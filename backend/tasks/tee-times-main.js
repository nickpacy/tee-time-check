// Import required dependencies
const mysql = require("mysql2"); // MySQL library
const moment = require("moment-timezone"); // Date and time manipulation library
const dotenv = require("dotenv"); // Environment variable management library
const nodemailer = require("nodemailer"); // Email sending library
const cron = require("node-cron"); // Cron job scheduler
const winston = require("winston"); // Logging library

// Import custom functions
const util = require("./utility"); // Utility functions
const foreupFunction = require("./tee-times-foreup"); // Custom function for getting tee times from ForeUp
const navyFunction = require("./tee-times-navy"); // Custom function for getting tee times from Navy
const teeitupFunction = require("./tee-times-teeitup"); // Custom function for getting tee times from TeeItUp
const jcgolfFunction = require("./tee-times-jcgolf"); // Custom function for getting tee times from JCGolf

// Load environment variables from .env file
dotenv.config();

// Create a logger instance
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

// Create a connection pool for MySQL database
const pool = mysql.createPool({
  connectionLimit: process.env.POOL_LIMIT, // Maximum number of connections in the pool
  host: process.env.DB_HOST, // MySQL database host
  user: process.env.DB_USER, // MySQL database user
  password: process.env.DB_PASSWORD, // MySQL database password
  database: process.env.DB_NAME, // MySQL database name
});

// Create a transporter for sending emails
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST, // SMTP host for sending emails
  port: process.env.SMTP_PORT, // SMTP port for sending emails
  secure: true, // Use SSL/TLS for secure connection
  auth: {
    user: process.env.SMTP_USER, // SMTP username
    pass: process.env.SMTP_PASSWORD, // SMTP password
  },
});

// Check tee times and send notifications
const checkTeeTimes = async () => {
  // Get a connection from the pool
  pool.getConnection((err, connection) => {
    if (err) {
      logger.error("Error getting database connection:", err);
      throw err;
    }

    // Query to fetch tee time data for active users
    const query = `SELECT DISTINCT t.id, u.userId, u.email, t.dayOfWeek, t.startTime, t.endTime, t.courseId, t.numPlayers, c.bookingClass, c.scheduleId, c.bookingPrefix, c.websiteId, c.courseName, c.method, c.bookingUrl, n.notifiedTeeTimes
                    FROM timeChecks t
                    JOIN users u ON u.userid = t.userId
                    JOIN courses c ON c.courseid = t.courseId
                    LEFT JOIN notifications n ON n.userId = t.userId AND n.courseId = t.courseId AND n.checkdate = CURDATE() 
                    WHERE u.active = 1 AND t.active = 1`;

    connection.query(query, async (error, results) => {
      connection.release();

      if (error) {
        logger.error("Database query error:", error);
        throw error;
      }

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
          bookingPrefix,
          websiteId,
          courseId,
          userId,
          courseName,
          method,
          bookingUrl,
          notifiedTeeTimes,
        } = row;

        let teeTimes = [];
        let bookingLink = bookingUrl;

        // Setup date to use
        const closestDate = util.getClosestDayOfWeek(dayOfWeek, "MM-DD-YYYY");

        // Format the start and end times based on the user's timezone
        const formattedStartTime = moment
          .utc(startTime, "HH:mm:ss")
          .clone()
          .tz("America/Los_Angeles")
          .format("HH:mm:ss");
        const formattedEndTime = moment
          .utc(endTime, "HH:mm:ss")
          .clone()
          .tz("America/Los_Angeles")
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
              scheduleId
            );
          } catch (error) {
            logger.error("Error retrieving tee times from ForeUp:", error);
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
            logger.error("Error retrieving tee times from Navy:", error);
          }
        } else if (method === "teeitup") {
          try {
            teeTimes = await teeitupFunction.getTeeTimes(
              bookingClass,
              dayOfWeek,
              numPlayers
            );
          } catch (error) {
            logger.error("Error retrieving tee times from TeeItUp:", error);
          }
        } else if (method === "jcgolf") {
          try {
            teeTimes = await jcgolfFunction.getTeeTimes(
              bookingClass,
              dayOfWeek,
              numPlayers,
              bookingPrefix,
              websiteId
            );
          } catch (error) {
            logger.error("Error retrieving tee times from JCGolf:", error);
          }
        }

        try {
          for (const teeTime of teeTimes) {
            const teeTimeDate = moment(teeTime.time, "YYYY-MM-DD HH:mm");

            // Check if the tee time falls within the user's specified start and end time
            if (
              teeTimeDate.isAfter(teeTimeStartDate) &&
              teeTimeDate.isBefore(teeTimeEndDate)
            ) {
              if (notifiedTeeTimes && notifiedTeeTimes.includes(teeTime.time)) {
                // This tee time has already been notified, skip it
                continue;
              }

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
                bookingLink,
              });
            }
          }
        } catch (error) {
          logger.error("Error processing tee times:", error);
        }
      }

      // Send emails with tee time notifications
      await sendEmails(teeTimesByUser);

      // Save the list of notified tee times for each user to the database
      for (const email in teeTimesByUser) {
        const notifiedTeeTimes = teeTimesByUser[email]
          .map(({ teeTime }) => teeTime)
          .join(",");
        const userId = teeTimesByUser[email][0].userId;
        const courseId = teeTimesByUser[email][0].courseId;
        const updateQuery = `INSERT INTO notifications (userId, courseId, checkdate, notifiedTeeTimes) VALUES (?, ?, CURDATE(), ?) ON DUPLICATE KEY UPDATE notifiedTeeTimes = CONCAT(notifiedTeetimes, ',', ?)`;
        connection.query(
          updateQuery,
          [userId, courseId, notifiedTeeTimes, notifiedTeeTimes],
          async (err, results) => {
            if (err) {
              logger.error("Error updating notifications:", err);
              throw err;
            }
            connection.release();
          }
        );
      }
    });
  });
};

// Send emails with tee time notifications
const sendEmails = async (teeTimesByUser) => {
  if (Object.keys(teeTimesByUser).length > 0) {
    // Send an email to each user with their list of tee times
    for (const [email, teeTimes] of Object.entries(teeTimesByUser)) {
      const tableRows = teeTimes
        .map(({ courseName, teeTime, available_spots, bookingLink }) => {
          // Format the tee time in the user's local time zone
          const options = {
            weekday: "short",
            year: "numeric",
            month: "short",
            day: "numeric",
            hour: "numeric",
            minute: "numeric",
            hour12: true,
            timeZone: "America/Los_Angeles", // Specify the desired time zone
          };
          const localTime = new Date(teeTime).toLocaleString("en-US", options);
          return `
            <tr>
              <td><a href="${bookingLink}">${courseName}</a></td>
              <td>${localTime}</td>
              <td>${available_spots}</td>
            </tr>`;
        })
        .join("");

      const htmlBody = `
        <html>
          <head>
            <style>
              table {
                width: 100%;
                max-width: 600px;
                border-collapse: collapse;
              }
              
              th, td {
                padding: 8px;
                text-align: left;
              }
              
              th {
                background-color: #f2f2f2;
              }
              
              @media screen and (max-width: 600px) {
                table {
                  width: 100%;
                }
                
                th, td {
                  display: block;
                  width: 100%;
                }
              }
            </style>
          </head>
          <body>
            <h2>Tee Time Alert</h2>
            <table>
              <tr>
                <th>Course Name</th>
                <th>Tee Time</th>
                <th>Available Spots</th>
              </tr>
              ${tableRows}
            </table>
          </body>
        </html>
      `;

      const mailOptions = {
        from: process.env.SMTP_FROM, // Sender's email address
        to: email, // Recipient's email address
        subject: "Tee Time Alert",
        html: htmlBody,
      };

      await transporter.sendMail(mailOptions, (error, info) => {
        if (error) {
          logger.error(`Error sending email to ${email}:`, error);
        } else {
          logger.info(
            `Tee Time Found! Email sent to ${email}: ${info.response}`
          );
        }
      });
    }
  } else {
    // No new tee times
    logger.info("No New Tee Times as of " + new Date());
  }
};

// Create a cron job to schedule tee time checks
const startCronJob = () => {
  const task = cron.schedule(`* 7-23,0-2 * * *`, () => {
    // logger.info("Cron scheduler running at: " + new Date().toLocaleString());
    checkTeeTimes();
  });

  checkTeeTimes();
  task.start();
};

// Start the cron job
startCronJob();
