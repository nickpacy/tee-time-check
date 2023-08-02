// Import required dependencies
const mysql = require("mysql2/promise"); // MySQL library
const moment = require("moment-timezone"); // Date and time manipulation library
const dotenv = require("dotenv"); // Environment variable management library
const nodemailer = require("nodemailer"); // Email sending library
const winston = require("winston"); // Logging library
const fs = require('fs').promises; // Import the fs module
// const AWS = require('aws-sdk');
const twilio = require('twilio');

// Import custom functions
const uti = require("./utility"); // Utility functions
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

// Create a Twilio client
const smsClient = new twilio(process.env.TWILIO_SID, process.env.TWILIO_AUTH_TOKEN);

// AWS.config.update({
//   region: 'us-east-1' // Choose your region
// });

// const sns = new AWS.SNS({apiVersion: '2010-03-31'});

// Check tee times and send notifications
const checkTeeTimes = async () => {

  try {
    // Get a connection from the pool
    const connection = await pool.getConnection();

    try {
      // Query to fetch tee time data for active users
      const query = `SELECT DISTINCT t.id, u.userId, u.email, u.phone, t.dayOfWeek, t.startTime, t.endTime, t.courseId, t.numPlayers, c.bookingClass, c.scheduleId, c.bookingPrefix, c.websiteId, c.courseName, c.courseAbbr, c.method, c.bookingUrl, n.notifiedTeeTimes
                    FROM timechecks t
                    JOIN users u ON u.userid = t.userId
                    JOIN courses c ON c.courseid = t.courseId
                    LEFT JOIN notifications n ON n.userId = t.userId AND n.courseId = t.courseId AND n.checkdate = CURDATE() 
                    WHERE u.active = 1 AND t.active = 1`;

      const results = await connection.execute(query);

      // Create an object to store the tee times for each user
      const teeTimesByUser = {};

      for (const row of results[0]) {
        const {
          email,
          phone,
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
              bookingClass,
              dayOfWeek,
              numPlayers
            );
          } catch (error) {
            console.log("Error retrieving tee times from TeeItUp:", error);
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
            console.log("Error retrieving tee times from JCGolf:", error);
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
                courseAbbr,
                teeTime: teeTime.time,
                available_spots: teeTime.available_spots,
                userId,
                courseId,
                bookingLink,
              });
            }
          }
        } catch (error) {
          console.log("Error processing tee times:", error);
        }
      }

      // Send emails with tee time notifications
      // await sendEmails(teeTimesByUser);
      await sendSMS(teeTimesByUser);

      try {
        // Save the list of notified tee times for each user to the database
        const promises = []; // Array to hold all the promises
        for (const email in teeTimesByUser) {
          const notifiedTeeTimes = teeTimesByUser[email]
            .map(({ teeTime }) => teeTime)
            .join(",");
          const userId = teeTimesByUser[email][0].userId;
          const courseId = teeTimesByUser[email][0].courseId;
          const updateQuery = `INSERT INTO notifications (userId, courseId, checkdate, notifiedTeeTimes) VALUES (?, ?, CURDATE(), ?) ON DUPLICATE KEY UPDATE notifiedTeeTimes = CONCAT(notifiedTeetimes, ',', ?);`;

          // Add the promise to the array
          // Add the promise to the array
          promises.push(
            connection.execute(updateQuery, [
              userId,
              courseId,
              notifiedTeeTimes,
              notifiedTeeTimes,
            ])
          );
        }

        // Wait for all the promises to resolve
        await Promise.all(promises).catch((error) =>
          console.log("Error in Promise.all: ", error)
        );

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
          const teeTimeDate = moment.tz(teeTime, "America/Los_Angeles").toDate();
          const localTime = teeTimeDate.toLocaleString("en-US", options);
          return `
            <tr>
              <td><a href="${bookingLink}">${courseName}</a></td>
              <td>${localTime}</td>
              <td>${available_spots}</td>
            </tr>`;
        })
        .join("");

      // Read the HTML template from the file
      let htmlTemplate = await fs.readFile('email-template.html', 'utf8');
      
      // Insert the table rows into the template
      const htmlBody = htmlTemplate.replace('${tableRows}', tableRows);

      const mailOptions = {
        from: process.env.SMTP_FROM, // Sender's email address
        to: email, // Recipient's email address
        subject: "Tee Time Alert",
        html: htmlBody,
      };

      try {
        const info = await transporter.sendMail(mailOptions);
        console.log(`Tee Time Found! Email sent to ${email}: ${info.response}`);
      } catch (error) {
        console.log(`Error sending email to ${email}:`, error);
      }
    }
  } else {
    // No new tee times
    console.log("No New Tee Times as of " + new Date());
  }
};

const sendSMS = async (teeTimesByUser) => {
  if (Object.keys(teeTimesByUser).length > 0) {
    // Send an SMS to each user with their list of tee times
    for (const [phoneNumber, teeTimes] of Object.entries(teeTimesByUser)) {
      let message = 'New Tee Times';
      for (const { courseAbbr, teeTime, available_spots, bookingLink } of teeTimes) {
        const teeTimeDate = moment.tz(teeTime, "America/Los_Angeles").toDate();
        const localTime = moment(teeTimeDate).format('M/D hh:mm');
        const newMessage = `\n${courseAbbr} ${localTime} (${available_spots})`;
        
        // Check if adding the new message (and potentially '...') would exceed the SMS length limit
        if ((message + newMessage + (message ? '...' : '')).length > 160) {
          message += '...';
          break;
        }
        message += newMessage;
      }

      try {
        // Send the SMS
        await smsClient.messages.create({
          body: message,
          to: '+18023737297', // Recipient's phone number
          from: '+18449764183' // Your Twilio number
        });
        console.log(`Tee Time Found! SMS sent to +18023737297`);
      } catch (error) {
        console.log(`Error sending SMS to +18023737297:`, error);
      }
    }
  } else {
    // No new tee times
    console.log("No New Tee Times as of " + new Date());
  }
};

module.exports = {
  checkTeeTimes,
};
