const mysql = require("mysql2");
const axios = require("axios");
const dotenv = require("dotenv");
const nodemailer = require("nodemailer");
const cron = require("node-cron");
const winston = require("winston");

const foreupFunction = require("./tee-times-foreup");
const navyFunction = require("./tee-times-navy");
const teeitupFunction = require("./tee-times-teeitup");
const jcgolfFunction = require("./tee-times-jcgolf");

dotenv.config();

const logger = winston.createLogger({
  level: "info",
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
  transports: [
    new winston.transports.Console(),
    new winston.transports.File({ filename: "error.log", level: "error" }),
    new winston.transports.File({ filename: "combined.log" }),
  ],
});

const pool = mysql.createPool({
  connectionLimit: process.env.POOL_LIMIT,
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
});

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: process.env.SMTP_PORT,
  secure: true,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASSWORD,
  },
});

const formatDate = (dateString) => {
  const date = new Date(dateString);
  const formattedDate = `${(date.getMonth() + 1)
    .toString()
    .padStart(2, "0")}-${date
    .getDate()
    .toString()
    .padStart(2, "0")}-${date.getFullYear()}`;
  return formattedDate;
};

const formatTime = (dateString, timeString) => {
  const dateParts = formatDate(dateString).split("-");
  const year = parseInt(dateParts[2], 10);
  const month = parseInt(dateParts[0], 10) - 1;
  const day = parseInt(dateParts[1], 10);

  const date = new Date(Date.UTC(year, month, day));
  const timeParts = timeString.split(":");
  date.setUTCHours(parseInt(timeParts[0], 10));
  date.setUTCMinutes(parseInt(timeParts[1], 10));
  date.setUTCSeconds(parseInt(timeParts[2], 10));

  return date;
};

const getClosestDayOfWeek = (dayOfWeek) => {
  const currentDate = new Date();
  let closestDayOfWeek = new Date(
    currentDate.getTime() +
      (dayOfWeek - currentDate.getDay()) * 24 * 60 * 60 * 1000
  );

  if (
    (closestDayOfWeek < currentDate) ||
    (closestDayOfWeek.getDay() === currentDate.getDay() &&
    currentDate.getHours() >= 19)
  ) {
    closestDayOfWeek = new Date(
      closestDayOfWeek.getTime() + 7 * 24 * 60 * 60 * 1000
    );
  }

  return closestDayOfWeek;
};

const serverTimecheck = () => {
  const now = new Date();
  const currentHour = now.getHours();

  if (currentHour >= 0 && currentHour < 9) {
    return false;
  } else {
    return true;
  }
};

const checkTeeTimes = async () => {
  //Don't run between 12am and 9am
  if (!serverTimecheck()) {
    return false;
  }

  pool.getConnection((err, connection) => {
    if (err) throw error;

    const query = `SELECT DISTINCT t.id, u.userId, u.email, t.dayOfWeek, t.startTime, t.endTime, t.courseId, t.numPlayers, c.bookingClass, c.scheduleId, c.courseName, c.method, n.notifiedTeeTimes
                    FROM timeChecks t
                    JOIN users u ON u.userid = t.userId
                    JOIN courses c ON c.courseid = t.courseId
                    LEFT JOIN notifications n ON n.userId = t.userId AND n.courseId = t.courseId AND n.checkdate = CURDATE() 
                    WHERE u.active = 1 AND t.active = 1`;

    connection.query(query, async (error, results) => {
      connection.release();

      if (error) throw error;

      // Create an object to store the tee times for each user
      const teeTimesByUser = {};

      for (const row of results) {
        const {
          email,
          dayOfWeek,
          startTime,
          endTime,
          numPlayers,
          bookingClass,
          scheduleId,
          courseId,
          userId,
          courseName,
          method,
          notifiedTeeTimes,
        } = row;
        const formattedDate = formatDate(getClosestDayOfWeek(dayOfWeek));
        const startDate = formatTime(formattedDate, startTime);
        let endDate = formatTime(formattedDate, endTime);

        if (endDate < startDate) {
          endDate.setUTCDate(endDate.getUTCDate() + 1);
        }

        // let apiUrl = "";
        let teeTimes = [];

        // Check the value of the "Method" column and run the corresponding function
        if (method === "foreup") {
            // apiUrl = `https://foreupsoftware.com/index.php/api/booking/times?time=all&date=${formattedDate}&holes=all&players=${numPlayers}&booking_class=${bookingClass}&schedule_id=${scheduleId}&api_key=no_limits`;
            try {
            //   logger.info("Checking foreup " + courseName);
                teeTimes = await foreupFunction.getTeeTimes(bookingClass, dayOfWeek, numPlayers, scheduleId);
            } catch (error) {
              logger.error(error);
            }
          } else if (method === "navy") {
            try {
            //   logger.info("Checking navy " + courseName);
              teeTimes = await navyFunction.getTeeTimes(bookingClass, startTime, endTime, dayOfWeek, numPlayers);
            } catch (error) {
              logger.error(error);
            }
          } else if (method === "teeitup") {
            try {
            //   logger.info("Checking teeitup " + courseName);
              teeTimes = await teeitupFunction.getTeeTimes(bookingClass, dayOfWeek, numPlayers);
            } catch (error) {
              logger.error(error);
            }
          } else if (method === "jcgolf") {
            try {
            //   logger.info("Checking jcgolf " + courseName + ' | ' + dayOfWeek + ' | ' + bookingClass);
              teeTimes = await jcgolfFunction.getTeeTimes(bookingClass, dayOfWeek, numPlayers);
            } catch (error) {
              logger.error(error);
            }
          }

        

        try {
        //   const response = await axios.get(apiUrl);

        //   const teeTimes = response.data;

          for (const teeTime of teeTimes) {

              
              const teeTimeDate = new Date(teeTime.time);
              if (teeTimeDate > startDate && teeTimeDate < endDate) {
              if (notifiedTeeTimes && notifiedTeeTimes.includes(teeTime.time)) {
                // This tee time has already been notified, skip it
                continue;
              }

              // logger.info("Found a match!", courseName, teeTime.time, teeTime.available_spots);

              // Add the tee time to the object for this user
              if (!teeTimesByUser[email]) {
                teeTimesByUser[email] = [];
              }
              teeTimesByUser[email].push({
                courseName,
                teeTime: teeTime.time,
                available_spots: teeTime.available_spots,
                userId,
                courseId,
              });
            }
          }
        } catch (error) {
          logger.error(error);
        }
      }

      //SEND EMAILS
      await sendEmails(teeTimesByUser);

      // Save the list of notified tee times for each user to the database
      for (const email in teeTimesByUser) {
        const notifiedTeeTimes = teeTimesByUser[email]
          .map(({ teeTime }) => teeTime)
          .join(",");
        const userId = teeTimesByUser[email][0].userId;
        const courseId = teeTimesByUser[email][0].courseId;
        const updateQuery = `INSERT INTO notifications (userId, courseId, checkdate, notifiedTeeTimes) VALUES (?, ?, CURDATE(), ?) ON DUPLICATE KEY UPDATE notifiedTeeTimes = CONCAT(notifiedTeeTimes, ',', ?)`;
        connection.query(
          updateQuery,
          [userId, courseId, notifiedTeeTimes, notifiedTeeTimes],
          async (err, results) => {
            connection.release();

            if (err) throw error;
          }
        );
      }
    });
  });
};

const sendEmails = async (teeTimesByUser) => {
  if (Object.keys(teeTimesByUser).length > 0) {
    // Send an email to each user with their list of tee times
    for (const [email, teeTimes] of Object.entries(teeTimesByUser)) {
      const teeTimeList = teeTimes
        .map(({ courseName, teeTime, available_spots }) => {
          const options = {
            weekday: "long",
            year: "numeric",
            month: "long",
            day: "numeric",
            hour: "numeric",
            minute: "numeric",
            hour12: true
          };
          const localTime = new Date(teeTime).toLocaleString("en-US", options);
          return `- ${courseName} on ${localTime} for ${available_spots} people`;
        })
        .join("\n");

      const mailOptions = {
        from: process.env.SMTP_FROM,
        to: email,
        subject: "Tee Time Alert",
        text: `The following tee times are available:\n\n${teeTimeList}`,
      };

      await transporter.sendMail(mailOptions, (error, info) => {
        if (error) {
          console.error(`ERROR sending email to ${email}:`, error);
        } else {
          logger.info(`Email sent to ${email}: ${info.response}`);
        }
      });
    }
  } else {
    //No New Tee Times
    logger.info("No New Tee Times as of " + new Date());
  }
};

// const now = new Date();
// const startHour = 9;
// const endHour = 23;

// var task = cron.schedule(`* ${startHour}-${endHour} * * *`, () => {
//   // Code to be executed every minute, except between 12am and 8am
//   logger.info("Cron scheduler running at: " + new Date().toLocaleString());
//   checkTeeTimes();
// });

// task.start();

const now = new Date();
const startHour = 7;
const endHour = 23;

// if (now.getHours() >= startHour && now.getHours() <= endHour) {
//   // Code to run immediately if the current time is within the allowed time frame
//   logger.info("Code started running at: " + new Date().toLocaleString());
//   checkTeeTimes();
// }

var task = cron.schedule(`* ${startHour}-${endHour} * * *`, () => {
  // Code to be executed every minute, except between 12am and 8am
  logger.info("Cron scheduler running at: " + new Date().toLocaleString());
  checkTeeTimes();
});

task.start();