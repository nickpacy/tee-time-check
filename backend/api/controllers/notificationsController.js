const pool = require("../database");
const dotenv = require("dotenv");
const twilio = require('twilio');
const { NotFoundError, InternalError } = require("../middlewares/errorTypes");

dotenv.config();
const smsClient = new twilio(
    process.env.TWILIO_SID,
    process.env.TWILIO_AUTH_TOKEN
);

const getNotificationsByCourse = async (req, res, next) => {
  const userId = req.user.userId;

  try {
    // Fetch distinct courses and tee times for which user received notifications in the past 24 hours
     let query = `
          SELECT 
          n.UserId, 
          n.CourseId, 
          c.CourseName, 
          c.ImageUrl,
          n.NotificationId,
          n.TeeTime,
          n.NotifiedDate,
          CASE 
            WHEN c.Method = 'navy' THEN 
              CONCAT(
                'https://myffr.navyaims.com/navywest/wbwsc/navywest.wsc/search.html',
                ':Action=Start&secondarycode=',
                c.BookingClass,
                '&numberofplayers=1&begindate=',
                DATE_FORMAT(n.TeeTime, '%m/%d/%Y'),
                '&begintime=05:00AM&numberofholes=18&reservee=&display=Listing&sort=Time&search=yes&page=1&module=GR&multiselectlist_value=&grwebsearch_buttonsearch=yes'
              )
            ELSE c.BookingUrl 
          END AS BookingUrl
          FROM notifications n
          JOIN courses c ON n.CourseId = c.CourseId 
          WHERE n.UserId = ? AND n.NotifiedDate BETWEEN NOW() - INTERVAL 24 HOUR AND NOW()
          ORDER BY NotifiedDate DESC, CourseId ASC, TeeTime ASC;
            `;
            
    const results = await pool.query(query, [userId]);

    results.forEach(result => {
      if (result.BookingUrl && result.BookingUrl.includes(':Action')) {
        result.BookingUrl = result.BookingUrl.replace(':Action', '?Action');
      }
    });

    if (results.length === 0) {
      res.json([]);
      return;
    }

    res.json(results);
  } catch (error) {
    next(new InternalError("Error getting notification", error));
  }
};

const removeNotification = async (req, res, next) => {
  const NotificationId = req.params.NotificationId;

  try {
    // Delete the specified tee time from the notified_tee_times table
    const result = await pool.query(
      "DELETE FROM notifications WHERE NotificationId = ?",
      [NotificationId]
    );

    if (result.affectedRows === 0) {
      next(new NotFoundError("Notified tee time not found"));
    } else {
      res.json({ message: "Notified tee time removed successfully." });
    }
  } catch (error) {
    next(new InternalError("Error removing notified tee time", error));
  }
};


const updateTwilioMessages = async (req, res, next) => {
  const lastUpdate = await getLastUpdateTimestamp(); // Ensure this function is correctly defined and handled

  try {
      const messages = await smsClient.messages.list({
          dateSentAfter: lastUpdate.toISOString()
      });

      let updatesCount = 0; // Counter for successfully updated/inserted messages

      for (const message of messages) {
          const { sid, dateSent, from, to, body, price } = message;
          const sql = `INSERT INTO twilio_messages (sid, dateSent, fromPhone, toPhone, body, price)
                       VALUES (?, ?, ?, ?, ?, ?)
                       ON DUPLICATE KEY UPDATE
                       dateSent = VALUES(dateSent), fromPhone = VALUES(fromPhone), toPhone = VALUES(toPhone),
                       body = VALUES(body), price = VALUES(price)`;

          const result = await pool.query(sql, [sid, new Date(dateSent), from, to, body, parseFloat(price)]);
          if (result.affectedRows > 0) {
              updatesCount++;
              // console.log(`Message with SID: ${sid} updated or inserted successfully.`);
          }
      }

      // Sending a success response with details about the operation
      res.json({
          success: true,
          message: `${updatesCount} messages updated or inserted successfully.`,
          updatedRecords: updatesCount
      });
  } catch (error) {
      console.error('Error updating Twilio messages:', error);
      next(new InternalError("Error updating Twilio messages", error));
  }
};


const getLastUpdateTimestamp = async (req, res, next) => {
  try {
      const sql = `SELECT MAX(dateSent) as lastUpdate FROM twilio_messages`;
      const results = await pool.query(sql);

      if (results.length > 0 && results[0].lastUpdate) {
          return new Date(results[0].lastUpdate);
      }
      return new Date('2023-07-01T00:00:00Z'); // Default if no records or unable to find a last update
  } catch (error) {
      console.error('Error retrieving last update timestamp:', error);
      next(new InternalError("Failed to retrieve last update timestamp", error));
  }
};





module.exports = {
  getNotificationsByCourse,
  removeNotification,
  updateTwilioMessages,
  updateTwilioMessages
};
