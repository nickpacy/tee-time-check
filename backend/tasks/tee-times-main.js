// Import required dependencies
const mysql = require("mysql2/promise"); // MySQL library
const moment = require("moment-timezone"); // Date and time manipulation library
const dotenv = require("dotenv"); // Environment variable management library
const winston = require("winston"); // Logging library

// Import custom functions
const uti = require("./utility");
const foreupFunction = require("./tee-times-foreup");
const navyFunction = require("./tee-times-navy");
const teeitupFunction = require("./tee-times-teeitup");
const jcgolfFunction = require("./tee-times-jcgolf");
const chronoFunction = require("./tee-times-chrono");
const golfnowFunction = require("./tee-times-golfnow");
const notificationsFunction = require("./user-notifications");

// Load environment variables from .env file
dotenv.config();

// Create a logger instance
const logger = winston.createLogger({
  level: "info",
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
  transports: [new winston.transports.Console()],
});

// Create a connection pool for MySQL database
const pool = mysql.createPool({
  connectionLimit: process.env.POOL_LIMIT, // Maximum number of connections in the pool
  host: process.env.DB_HOST, // MySQL database host
  user: process.env.DB_USER, // MySQL database user
  password: process.env.DB_PASSWORD, // MySQL database password
  database: process.env.DB_NAME, // MySQL database name
});
notificationsFunction.init(pool);
foreupFunction.init(pool);

// Retrieve relevant courses with time checks
const getRelevantCourses = async (connection, config) => {
  const query = `
    SELECT DISTINCT t.dayOfWeek, t.courseId, 1 AS numPlayers, c.bookingClass, c.scheduleId, c.bookingPrefix, c.websiteId, c.courseName,c.method, c.bookingUrl, c.timeZone, '12:00:00' AS navy5amStartTime
    FROM timechecks t
    JOIN users u ON u.userid = t.userId
    JOIN courses c ON c.courseid = t.courseId
    WHERE u.active = 1 AND t.active = 1 AND c.active = 1
      ${config.IS_JCGOLF ? ` AND c.method = 'jcgolf'` : ` AND c.method <> 'jcgolf'`}
      ${config.COURSE_FILTER ? ` AND c.courseId IN (${config.COURSE_FILTER})` : ''}
      AND ((u.email is not null AND u.emailNotification = 1 )
        OR (u.phone is not null AND u.phoneNotification = 1)
        OR u.deviceToken is not null)
  `;
  const [courseResults] = await connection.execute(query);
  return courseResults;
};

// Fetch all tee times for given courses
const getAllTeeTimes = async (courseResults) => {
  const allTeeTimes = {};
  let isFirstJCGolf = true;
  for (const course of courseResults) {
    const { 
      bookingClass, 
      dayOfWeek, 
      numPlayers, 
      scheduleId, 
      bookingPrefix, 
      websiteId, 
      method, 
      timeZone,
      navy5amStartTime,
      courseId,
      courseName,
      bookingUrl
    } = course;
    let teeTimes = [];
    let bookingLink = bookingUrl;
    try {
      let courseTeeTimes = [];

      switch (method) {
        case "foreup":
          courseTeeTimes = await foreupFunction.getTeeTimes(bookingClass, dayOfWeek, numPlayers, scheduleId, pool);
          break;
        case "navy":
          const navyTimes = await navyFunction.getTeeTimes(bookingClass, dayOfWeek, numPlayers, navy5amStartTime);
          courseTeeTimes = navyTimes[0];
          bookingLink = navyTimes[1];
          break;
        case "teeitup":
          courseTeeTimes = await teeitupFunction.getTeeTimes(bookingPrefix, dayOfWeek, numPlayers, timeZone);
          break;
        case "chrono":
          courseTeeTimes = await chronoFunction.getTeeTimes(websiteId, bookingClass, scheduleId, dayOfWeek, numPlayers, bookingPrefix);
          break;
        case "golfnow":
          courseTeeTimes = await golfnowFunction.getTeeTimes(bookingClass, dayOfWeek, numPlayers);
          break;
        case "jcgolf":
          courseTeeTimes = await jcgolfFunction.getTeeTimes(bookingClass, dayOfWeek, numPlayers, bookingPrefix, websiteId, isFirstJCGolf);
          if (isFirstJCGolf) {
            isFirstJCGolf = false;  // Set the flag to false after the first call
          }
          break;
        default:
          courseTeeTimes = [];
      }

      if (allTeeTimes[courseId]) {
        allTeeTimes[courseId].teeTimes = allTeeTimes[courseId].teeTimes.concat(courseTeeTimes);
        allTeeTimes[courseId].bookingLink = bookingLink;
      } else {
        allTeeTimes[courseId] = {courseName, teeTimes: courseTeeTimes, bookingLink};
      }

    } catch (error) {
      logger.error(`Error retrieving tee times for course ${courseId} from ${method}:`, error);
    }
  }

  return allTeeTimes;
};

// Process tee times for users based on their preferences
const processTeeTimesForUsers = async (connection, allTeeTimes, config) => {
  const query = `
    SELECT DISTINCT t.id, u.userId, u.email, u.phone, u.emailNotification, u.phoneNotification, u.deviceToken, t.dayOfWeek, 
                          t.startTime, t.endTime, t.courseId, t.numPlayers, c.bookingClass, c.scheduleId, c.bookingPrefix, c.websiteId, 
                          c.courseName, c.courseAbbr, c.method, c.bookingUrl, c.timeZone, GROUP_CONCAT(DISTINCT n.TeeTime) AS notifiedTeeTimes 
    FROM timechecks t
    JOIN users u ON u.userid = t.userId
    JOIN courses c ON c.courseid = t.courseId
    LEFT JOIN notifications n ON n.Active = 1 AND n.userId = t.userId AND c.courseid = n.courseid AND n.NotifiedDate BETWEEN NOW() - INTERVAL 24 HOUR AND NOW()
    WHERE u.active = 1
        AND t.active = 1
        AND c.active = 1
        ${config.IS_JCGOLF ? ` AND c.method = 'jcgolf'` : ` AND c.method <> 'jcgolf'`}
        ${config.COURSE_FILTER ? ` AND c.courseId IN (${config.COURSE_FILTER})` : ''}
        AND ((u.email is not null AND u.emailNotification = 1 )
          OR (u.phone is not null AND u.phoneNotification = 1)
          OR u.deviceToken is not null)
    GROUP BY t.id, u.userId, u.email, u.phone, u.emailNotification, u.phoneNotification, t.dayOfWeek, 
        t.startTime, t.endTime, t.courseId, t.numPlayers, c.bookingClass, c.scheduleId, c.bookingPrefix, c.websiteId, 
        c.courseName, c.courseAbbr, c.method, c.bookingUrl, c.TimeZone;
  `;

  const [results] = await connection.execute(query);
  
  const teeTimesByUser = {};

  for (const row of results) {
    const {
      email,
      emailNotification,
      phone,
      phoneNotification,
      deviceToken,
      dayOfWeek,
      startTime,
      endTime,
      numPlayers,
      courseId,
      userId,
      courseName,
      courseAbbr,
      timeZone,
      notifiedTeeTimes,
    } = row;

    if (!allTeeTimes[courseId]) {
      continue; // Skip if no tee times available for this course
    }

    const [formattedStartTime, formattedEndTime] = uti.formatTimesForTimezone(startTime, endTime, timeZone);
    const closestDate = uti.getClosestDayOfWeek(dayOfWeek, "MM-DD-YYYY", timeZone);
    const [teeTimeStartDate, teeTimeEndDate] = uti.getTeeTimeDateRange(closestDate, formattedStartTime, formattedEndTime);

    const userTeeTimes = allTeeTimes[courseId].teeTimes.filter((teeTime) => {
      const teeTimeDate = moment(teeTime.time, "YYYY-MM-DD HH:mm");

      // Check if the tee time falls within the user's specified start and end time and meets the numPlayers condition
      if (
        teeTimeDate.isSameOrAfter(teeTimeStartDate) &&
        teeTimeDate.isSameOrBefore(teeTimeEndDate) &&
        teeTime.available_spots >= numPlayers
      ) {
        const utcTeeTimeString = moment.tz(teeTime.time, timeZone).utc().format('YYYY-MM-DD HH:mm:ss');
        return !(notifiedTeeTimes && notifiedTeeTimes.includes(utcTeeTimeString));
      }

      return false;
    });

    if (userTeeTimes.length > 0) {
      if (!teeTimesByUser[userId]) {
        teeTimesByUser[userId] = [];
      }
      userTeeTimes.forEach(teeTime => {
        teeTimesByUser[userId].push({
          courseName,
          courseAbbr,
          teeTime: teeTime.time,
          available_spots: teeTime.available_spots,
          userId,
          courseId,
          bookingLink: allTeeTimes[courseId].bookingLink,
          email,
          phone,
          deviceToken,
          timeZone,
          emailNotification,
          phoneNotification
        });
      });
    }
  }

  return teeTimesByUser;
};

// Send notifications to users
const sendNotifications = async (teeTimesByUser) => {
  if (Object.keys(teeTimesByUser).length > 0) {
    try {
      await Promise.all([
        notificationsFunction.sendPushNotification(teeTimesByUser),
        notificationsFunction.sendSMS(teeTimesByUser),
        notificationsFunction.sendEmails(teeTimesByUser)
      ]);
      logger.info('All notifications sent successfully');
    } catch (error) {
      logger.error('An error occurred while sending notifications:', error);
    }
  } else {
    logger.info('No New Tee Times.');
  }
};

// Save notified tee times to the database
const saveNotifiedTeeTimes = async (connection, teeTimesByUser) => {
  const newTeeTimesByUser = {};
  for (const userId in teeTimesByUser) {
    const notifiedTeeTimes = teeTimesByUser[userId];
    newTeeTimesByUser[userId] = [];
    for (const { teeTime, courseId, timeZone, available_spots, bookingLink, courseName, courseAbbr, phone, deviceToken, email, phoneNotification, emailNotification } of notifiedTeeTimes) {
      const utcTeeTime = moment.tz(teeTime, timeZone).utc().format('YYYY-MM-DD HH:mm:ss');
      const [result] = await connection.execute(
        `INSERT INTO notifications (UserId, CourseId, TeeTime, AvailableSpots)
         VALUES (?, ?, ?, ?)`,
        [userId, courseId, utcTeeTime, available_spots]
      );
      newTeeTimesByUser[userId].push({
        teeTime,
        courseId,
        courseName,
        courseAbbr,
        timeZone,
        available_spots,
        bookingLink,
        phone, 
        deviceToken, 
        email, 
        phoneNotification, 
        emailNotification,
        notificationId: result.insertId // 🔹 Keep NotificationId
      });
    }
  }
  return newTeeTimesByUser;
};


// Check tee times and notify users
const checkTeeTimes = async (config) => {

  try {
    const connection = await pool.getConnection();
    try {
      const relevantCoursesWithTimechecks = await getRelevantCourses(connection, config);
      const allTeeTimes = await getAllTeeTimes(relevantCoursesWithTimechecks);
      const teeTimesByUser = await processTeeTimesForUsers(connection, allTeeTimes, config);
      const teeTimesWithIds = await saveNotifiedTeeTimes(connection, teeTimesByUser);
      await sendNotifications(teeTimesWithIds);

    } catch (err) {
      logger.error("Error processing tee times:", err);
    } finally {
      connection.release();
    }
  } catch (err) {
    logger.error("Error getting database connection:", err);
  }
};

//Run the function if this script is executed directly
if (require.main === module) {
  (async () => {
    const start = Date.now(); // Record the start time
    await checkTeeTimes();
    const end = Date.now(); // Record the end time
    const duration = (end - start) / 1000; // Calculate the duration
    console.log(`checkTeeTimesDuration: ${duration}s`); // Log the duration
    process.exit();
  })();
}

// Export the checkTeeTimes function for use in other modules
module.exports = {
  checkTeeTimes,
};
