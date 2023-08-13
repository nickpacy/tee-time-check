// Import required dependencies
//  npm i moment-timezone dotenv twilio @sendgrid/mail mysql2
const mysql = require("mysql2/promise");
const moment = require("moment-timezone");
const dotenv = require("dotenv");
const fs = require('fs').promises;
const twilio = require('twilio');
const sgMail = require('@sendgrid/mail');

// Import custom functions
const uti = require("./utility");
const foreupFunction = require("./tee-times-foreup");
const navyFunction = require("./tee-times-navy");
const teeitupFunction = require("./tee-times-teeitup");
const jcgolfFunction = require("./tee-times-jcgolf");
const coronadoFunction = require("./tee-times-coronado");

const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

// Load environment variables from .env file
dotenv.config();

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

// Create a Twilio client for SMS messages
const smsClient = new twilio(process.env.TWILIO_SID, process.env.TWILIO_AUTH_TOKEN);

const fetchActiveCourseData = async (connection) => {
    const query  = `
    SELECT
        c.courseId,
        c.bookingClass,
        c.scheduleId,
        c.bookingPrefix,
        c.websiteId,
        c.method,
        c.bookingUrl,
        t.dayOfWeek, 
        MIN(t.numPlayers) AS minNumPlayers,
        MIN(DATE_SUB(t.startTime, INTERVAL 7 HOUR)) AS minStartTime,
        MAX(DATE_SUB(t.endTime, INTERVAL 7 HOUR)) AS maxEndTime
    FROM timechecks t 
        JOIN courses c ON t.courseId = c.courseId
        JOIN users u ON t.userId = u.userId
    WHERE t.active = 1 AND c.active = 1 AND u.active = 1
    GROUP BY 
        c.courseId,
        c.bookingClass,
        c.scheduleId,
        c.bookingPrefix,
        c.websiteId,
        c.method,
        c.bookingUrl,
        t.dayOfWeek
    `;
    return await connection.execute(query);
}

async function getCourseTeeTimes(courses) {
    const promises = [];

    for (const course of courses) {
        switch (course.method) {
            case 'foreup':
                promises.push(foreupFunction.getTeeTimes(
                    course.bookingClass,
                    course.dayOfWeek,
                    course.minNumPlayers,
                    course.scheduleId
                  ));
                break;
            case 'jcgolf':
                const lastPromise = promises[promises.length - 1] || Promise.resolve();
                const delayedPromise = lastPromise
                    .then(() => delay(1200))
                    .then(() => jcgolfFunction.getTeeTimes(
                        course.bookingClass,
                        course.dayOfWeek,
                        course.minNumPlayers,
                        course.bookingPrefix,
                        course.websiteId
                      ));
                promises.push(delayedPromise);
                break;
            case 'navy':
                promises.push(navyFunction.getTeeTimes(
                    course.bookingClass,
                    course.dayOfWeek,
                    course.minNumPlayers,
                    course.startTime
                  ).then(navyTimes => {
                        course.bookingUrl = navyTimes[1];
                        return navyTimes[0];
                    }));
                break;
            case 'teeitup':
                promises.push(teeitupFunction.getTeeTimes(
                    course.bookingPrefix,
                    course.dayOfWeek,
                    course.minNumPlayers
                  ));
                break;
            case 'coronado':
              const currentDate = moment().startOf('day'); // This will include the current time
              const twoDaysOut = moment().add(3, 'days').startOf('day'); // Set it to the start of the day (midnight) three days from now
              
              if (moment(uti.getClosestDayOfWeek(course.dayOfWeek), 'MM-DD-YYYY').isSameOrAfter(currentDate) && moment(uti.getClosestDayOfWeek(course.dayOfWeek), 'MM-DD-YYYY').isBefore(twoDaysOut)) {
                  promises.push(coronadoFunction.getTeeTimes(
                    course.bookingClass,
                    course.dayOfWeek,
                    course.minNumPlayers
                  ));
              } else {

                //   promises.push(getTeeTimes_coronado(date, '20066').then(times => times[0]));
              }
              break;
            default:
                promises.push(Promise.resolve([]));
                break;
        }
    }

    const teeTimesArrays = await Promise.all(promises);

    let teeTimesResults = [];
        teeTimesArrays.forEach((teeTimes, idx) => {
            teeTimes = teeTimes.map(item => ({
                ...item,
                courseId: courses[idx].courseId,
                dayOfWeek: courses[idx].dayOfWeek,
                bookingUrl: courses[idx].bookingUrl
            }));
            teeTimesResults.push(...teeTimes);
        });
    return teeTimesResults;
}


const fetchTeeTimeData = async (connection) => {
    const query = `
    SELECT DISTINCT
        t.id,
        u.userId,
        u.email,
        u.phone,
        u.emailNotification,
        u.phoneNotification,
        t.dayOfWeek,
        t.startTime,
        t.endTime,
        t.courseId,
        t.numPlayers,
        c.courseName,
        c.courseAbbr,
        GROUP_CONCAT(ntt.TeeTime) AS notifiedTeeTimes
    FROM
        timechecks t
        JOIN users u ON u.userid = t.userId
        JOIN courses c ON c.courseid = t.courseId
        LEFT JOIN notifications n ON n.userId = t.userId
            AND n.courseId = t.courseId
            AND DATE(n.checkdate - INTERVAL 7 HOUR) = DATE(CURDATE() - INTERVAL 7 HOUR)
        LEFT JOIN notified_tee_times ntt ON ntt.NotificationId = n.NotificationId
    WHERE
        u.active = 1
        AND t.active = 1
        AND c.active = 1
        AND (
            (u.email IS NOT NULL AND u.emailNotification = 1)
            OR (u.phone IS NOT NULL AND u.phoneNotification = 1)
        )
        AND u.lastLoginDate BETWEEN DATE_SUB(CURDATE(), INTERVAL 7 DAY) AND NOW()
    GROUP BY
        t.id,
        u.userId,
        u.email,
        u.phone,
        u.emailNotification,
        u.phoneNotification,
        t.dayOfWeek,
        t.startTime,
        t.endTime,
        t.courseId,
        t.numPlayers,
        c.courseName,
        c.courseAbbr;
    `;
    return await connection.execute(query);
};

const matchUserPreferences = async (availableTeeTimes, userPreferences) => {
    
    userPreferences.forEach(teeTime => {
        teeTime.closestDate = uti.getClosestDayOfWeek(teeTime.dayOfWeek, "MM-DD-YYYY");
        
        // Convert and adjust timezones
        teeTime.startTime = moment.utc(teeTime.startTime, "HH:mm:ss").clone().tz("America/Los_Angeles").format("HH:mm:ss");
        teeTime.endTime = moment.utc(teeTime.endTime, "HH:mm:ss").clone().tz("America/Los_Angeles").format("HH:mm:ss");
        
        // Calculate startDate and endDate
        teeTime.startDate = moment(`${teeTime.closestDate} ${teeTime.startTime}`, "MM-DD-YYYY HH:mm:ss").format("YYYY-MM-DD HH:mm");
        teeTime.endDate = moment(`${teeTime.closestDate} ${teeTime.endTime}`, "MM-DD-YYYY HH:mm:ss").format("YYYY-MM-DD HH:mm");
        
        // Adjust endDate if necessary
        const teeTimeStartDate = moment(teeTime.startDate);
        const teeTimeEndDate = moment(teeTime.endDate);
        
        if (teeTimeEndDate.isBefore(teeTimeStartDate)) {
            teeTime.endDate = teeTimeEndDate.add(1, "day").format("YYYY-MM-DD HH:mm");
        }
    });

    availableTeeTimes.forEach(teeTime => {
        teeTime.teeTimeDate = moment(teeTime.time, "YYYY-MM-DD HH:mm");
        teeTime.utcTimeString = moment.tz(teeTime.time, "America/Los_Angeles").utc().format('YYYY-MM-DD HH:mm:ss');
    });


    let userMatches = [];

    userPreferences.forEach(timecheck => {
        const matchedTimes = availableTeeTimes.filter(teeTime => {
            return (
                teeTime.courseId === timecheck.courseId &&
                teeTime.dayOfWeek === timecheck.dayOfWeek &&
                teeTime.teeTimeDate.isAfter(timecheck.startDate) &&
                teeTime.teeTimeDate.isBefore(timecheck.endDate) &&
                (!timecheck.notifiedTeeTimes || !timecheck.notifiedTeeTimes.includes(utcTeeTimeString)) &&
                teeTime.available_spots >= timecheck.numPlayers
            )
        });

        // Initialize the userId's matches if not already done
        if (!userMatches[timecheck.userId]) {
            userMatches[timecheck.userId] = [];
        }

        // Append the matched times
        userMatches[timecheck.userId].push(...matchedTimes);
    });

    return userMatches;
};

const sendNotifications = async (teeTimesByUser) => {
    await sendEmails(teeTimesByUser);
    await sendSMS(teeTimesByUser);
};

const saveNotifiedTeeTimes = async (teeTimesByUser, connection) => {
    const promises = [];
    // ... (The logic for saving notified tee times remains unchanged)
    return await Promise.all(promises);
};

const checkTeeTimes = async () => {
    try {
        const connection = await pool.getConnection();
        try {

            // Fetch active courses
            const [courses] = await fetchActiveCourseData(connection);

            // Get tee times from courses
            const availableTeeTimes = await getCourseTeeTimes(courses);

            // console.log(availableTeeTimes);


            const [userPreferences] = await fetchTeeTimeData(connection);

            // console.log(userPreferences);

            const matchedResults =  await matchUserPreferences(availableTeeTimes, userPreferences);

            console.log(matchedResults);

            // let teeTimesByUser = {};

            // for (const row of results[0]) {
            //     const teeTimesForThisUser = await processRowData(row);
            //     teeTimesByUser = { ...teeTimesByUser, ...teeTimesForThisUser }; // Combine the tee times
            // }

            // await sendNotifications(teeTimesByUser);
            // await saveNotifiedTeeTimes(teeTimesByUser, connection);

        } catch (err) {
            console.log("Error in the database connection:", err);
        } finally {
            connection.release();
        }
    } catch (err) {
        console.log("Error getting database connection:", err);
    }
};


console.log(checkTeeTimes());