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
// const coronadoFunction = require("./tee-times-coronado");
const notificationsFunction = require("./user-notifications");
// const lambdaFunction = require("./tee-times-autobooker");

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
let pool;
if (!pool) {
  pool = mysql.createPool({
    connectionLimit: process.env.POOL_LIMIT, // Maximum number of connections in the pool
    host: process.env.DB_HOST, // MySQL database host
    user: process.env.DB_USER, // MySQL database user
    password: process.env.DB_PASSWORD, // MySQL database password
    database: process.env.DB_NAME, // MySQL database name
  });
}



// Check tee times and send notifications
const checkTeeTimes = async () => {

  try {
    // Get a connection from the pool
    const connection = await pool.getConnection();

    try {

      const query = `SELECT DISTINCT t.id, u.userId, u.email, u.phone, u.emailNotification, u.phoneNotification, u.deviceToken, t.dayOfWeek, 
                          t.startTime, t.endTime, t.courseId, t.numPlayers, c.bookingClass, c.scheduleId, c.bookingPrefix, c.websiteId, 
                          c.courseName, c.courseAbbr, c.method, c.bookingUrl, c.timeZone, GROUP_CONCAT(DISTINCT n.TeeTime) AS notifiedTeeTimes 
                      FROM timechecks t
                      JOIN users u ON u.userid = t.userId
                      JOIN courses c ON c.courseid = t.courseId
                      LEFT JOIN notifications n ON n.userId = t.userId AND c.courseid = n.courseid AND n.NotifiedDate BETWEEN NOW() - INTERVAL 24 HOUR AND NOW()
                      WHERE u.active = 1
                          AND t.active = 1
                          AND c.active = 1
                          AND ((u.email is not null AND u.emailNotification = 1 )
                            OR (u.phone is not null AND u.phoneNotification = 1)
                            OR u.deviceToken is not null)
                      GROUP BY t.id, u.userId, u.email, u.phone, u.emailNotification, u.phoneNotification, t.dayOfWeek, 
                          t.startTime, t.endTime, t.courseId, t.numPlayers, c.bookingClass, c.scheduleId, c.bookingPrefix, c.websiteId, 
                          c.courseName, c.courseAbbr, c.method, c.bookingUrl, c.TimeZone;  
      `;

      const results = await connection.execute(query);

      // Create an object to store the tee times for each user
      const teeTimesByUser = {};
      let isFirstJCGolf = true;
      for (const row of results[0]) {
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
          bookingClass,
          scheduleId,
          bookingPrefix,
          websiteId,
          courseId,
          userId,
          courseName,
          courseAbbr,
          method,
          bookingUrl,
          timeZone,
          notifiedTeeTimes,
        } = row;

        let teeTimes = [];
        let bookingLink = bookingUrl;

        // Setup date to use
        const closestDate = uti.getClosestDayOfWeek(dayOfWeek, "MM-DD-YYYY");

        // Format the start and end times based on the user's timezone
        const formattedStartTime = moment
          .utc(startTime, "HH:mm:ss")
          .clone()
          .tz(timeZone)
          .format("HH:mm:ss");
        const formattedEndTime = moment
          .utc(endTime, "HH:mm:ss")
          .clone()
          .tz(timeZone)
          .format("HH:mm:ss");

        // Format the tee time start and end dates
        const teeTimeStartDate = moment(
          `${closestDate} ${formattedStartTime}`,
          "MM-DD-YYYY HH:mm:ss"
        ).format("YYYY-MM-DD HH:mm");
        let teeTimeEndDate = moment(
          `${closestDate} ${formattedEndTime}`,
          "MM-DD-YYYY HH:mm:ss"
        ).format("YYYY-MM-DD HH:mm");

        // If the end time is before the start time, add 1 day to the end time
        if (moment(teeTimeEndDate).isBefore(teeTimeStartDate)) {
          teeTimeEndDate = moment(teeTimeEndDate)
            .add(1, "day")
            .format("YYYY-MM-DD HH:mm");
        }

        // Check the value of the "Method" column and run the corresponding function
        if (method === "foreup") {
          try {
            teeTimes = await foreupFunction.getTeeTimes(
              bookingClass,
              dayOfWeek,
              numPlayers,
              scheduleId,
              pool
            );
          } catch (error) {
            console.log("Error retrieving tee times from ForeUp:", error);
          }
        } else if (method === "navy") {
          try {
            const navyTimes = await navyFunction.getTeeTimes(
              bookingClass,
              dayOfWeek,
              numPlayers,
              startTime
            );
            teeTimes = navyTimes[0];
            bookingLink = navyTimes[1];
          } catch (error) {
            console.log("Error retrieving tee times from Navy:", error);
          }
        } else if (method === "teeitup") {
          try {
            teeTimes = await teeitupFunction.getTeeTimes(
              bookingPrefix,
              dayOfWeek,
              numPlayers,
              timeZone
            );
          } catch (error) {
            console.log("Error retrieving tee times from TeeItUp:", error);
          }
        } else if (method === "chrono") {
          try {
            teeTimes = await chronoFunction.getTeeTimes(
              websiteId,
              bookingClass,
              scheduleId,
              dayOfWeek,
              numPlayers
            );
          } catch (error) {
            console.log("Error retrieving tee times from TeeItUp:", error);
          }
        } else if (method === "golfnow") {
          try {
            teeTimes = await golfnowFunction.getTeeTimes(
              bookingClass,
              dayOfWeek,
              numPlayers
            );
          } catch (error) {
            console.log("Error retrieving tee times from TeeItUp:", error);
          }
        // } else if (method === "coronado") {
        //   try {
        //     teeTimes = await coronadoFunction.getTeeTimes(
        //       bookingClass,
        //       dayOfWeek,
        //       numPlayers
        //     );
        //   } catch (error) {
        //     console.log("Error retrieving tee times from Coronado:", error);
        //   }
        } else if (method === "jcgolf") {
          try {
             // If it's not the first call to jcgolf, wait for 1 second
            teeTimes = await jcgolfFunction.getTeeTimes(
              bookingClass,
              dayOfWeek,
              numPlayers,
              bookingPrefix,
              websiteId,
              isFirstJCGolf
            );
            if (isFirstJCGolf) {
              isFirstJCGolf = false;  // Set the flag to false after the first call
            }
          } catch (error) {
            console.log("Error retrieving tee times from JCGolf:", error);
          }
        }

        try {
          for (const teeTime of teeTimes) {
            const teeTimeDate = moment(teeTime.time, "YYYY-MM-DD HH:mm");

            // Check if the tee time falls within the user's specified start and end time
            if (
              teeTimeDate.isSameOrAfter(teeTimeStartDate) &&
              teeTimeDate.isSameOrBefore(teeTimeEndDate)
            ) {
              const utcTeeTimeString = moment.tz(teeTime.time, timeZone).utc().format('YYYY-MM-DD HH:mm:ss');

              if (notifiedTeeTimes && notifiedTeeTimes.includes(utcTeeTimeString)) {
                // This tee time has already been notified, skip it
                continue;
              }

              // Add the tee time to the object for this user
              if (!teeTimesByUser[userId]) {
                teeTimesByUser[userId] = [];
              }
              teeTimesByUser[userId].push({
                courseName,
                courseAbbr,
                teeTime: teeTime.time,
                available_spots: teeTime.available_spots,
                userId,
                courseId,
                bookingLink,
                email,
                phone,
                deviceToken,
                timeZone,
                emailNotification,
                phoneNotification
              });
            }
          }
        } catch (error) {
          console.log("Error processing tee times:", error);
        }
      }

      // Send emails with tee time notifications
      // await notificationsFunction.sendPushNotitification(teeTimesByUser);
      // await notificationsFunction.sendSMS(teeTimesByUser);
      // await notificationsFunction.sendEmails(teeTimesByUser);
      await sendNotifications(teeTimesByUser);

      // if (Boolean(process.env.BOOKER_ENABLED)) {
        
      //   if (teeTimesByUser[1]) { // Check if userId 1 has any tee times
      //     const validTeeTimes = teeTimesByUser[1].filter(teeTime => teeTime.courseId === 1 || teeTime.courseId === 2);
          
      //     if (validTeeTimes.length > 0) { // Check if there's any valid tee time
      //         const firstValidTeeTime = validTeeTimes[0];
      //         console.log(firstValidTeeTime);
      //         if (await checkUserSettingsForBooker(1)) { 
  
      //             console.log("Booker Called")
      //             // Call the lambda function with the first valid tee time
      //             await lambdaFunction.invokeBooker(firstValidTeeTime);
      //         }
      //     }
      //   }
      // }

      try {
          // Save the list of notified tee times for each user to the database
          const promises = []; // Array to hold all the promises
          for (const userId in teeTimesByUser) {
            const notifiedTeeTimes = teeTimesByUser[userId];
            
            // For each tee time, insert a new record into the notifications table
            for (const { teeTime, courseId, timeZone } of notifiedTeeTimes) {
                const insertNotificationQuery = `
                    INSERT INTO notifications (UserId, CourseId, TeeTime)
                    VALUES (?, ?, ?);
                `;
        
                // Convert to UTC Time
                const utcTeeTime = moment.tz(teeTime, timeZone).utc().format('YYYY-MM-DD HH:mm:ss');
        
                // Add the promise to the array
                promises.push(connection.execute(insertNotificationQuery, [userId, courseId, utcTeeTime]));
            }
          }
      
          // Wait for all the promises to resolve
          await Promise.all(promises).catch((error) => console.log("Error in Promise.all: ", error));
      
      } catch (err) {
          console.log("Error saving notified tee times:", err);
      } finally {
          // Release the connection and close the pool
          if (connection && connection.release) connection.release();
      }
    
    } catch (err) {
      console.log("Error inthe database connection:", err);
    } finally {
      // Ensure the connection is released back to the pool even if an error occurred
      connection.release();
    }
  } catch (err) {
    console.log("Error getting database connection:", err);
  }
};



async function sendNotifications(teeTimesByUser) {
  try {
    await Promise.all([
      notificationsFunction.sendPushNotitification(teeTimesByUser),
      notificationsFunction.sendSMS(teeTimesByUser),
      notificationsFunction.sendEmails(teeTimesByUser)
    ]);
    console.log('All notifications sent successfully');
    // Continue with additional logic if needed
  } catch (error) {
    console.error('An error occurred while sending notifications:', error);
    // Handle the error appropriately
  }
}

// async function checkUserSettingsForBooker(userId) {
//   try {
//       const connection = await pool.getConnection();
//       const query = `
//           SELECT settingKey, settingValue 
//           FROM user_settings
//           WHERE userId = ? AND (
//               (settingKey = 'TorreyPinesLoginActive' AND settingValue = 1) OR
//               (settingKey IN ('TorreyPinesLoginEmail', 'TorreyPinesLoginPassword') AND settingValue != '')
//           );
//       `;
//       const [rows] = await connection.execute(query, [userId]);
//       connection.release();

//       if (rows.length < 3) {
//         console.log("Dont call booker")
//         return false; // Ensure all three settings exist and are correct
//       }
//       return true;
//   } catch (error) {
//       console.log("Error checking user settings for Lambda:", error);
//       return false;
//   }
// }



module.exports = {
  checkTeeTimes,
};
