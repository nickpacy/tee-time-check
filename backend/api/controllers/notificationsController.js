// const moment = require('moment-timezone');
const pool = require('../database');


const getNotificationsByCourse = async (req, res) => {
  const userId = req.params.userId;

  try {
      let query = `
          SELECT DISTINCT 
              n.UserId, 
              c.CourseId, 
              c.CourseName, 
              c.ImageUrl, 
              DATE(ntt.TeeTime) as Date
          FROM notified_tee_times ntt
          JOIN notifications n ON ntt.NotificationId = n.NotificationId
          JOIN courses c ON n.CourseId = c.CourseId 
          WHERE n.UserId = ? 
          AND DATE(ntt.NotifiedDate) = CURDATE()
      `;

      const results = await pool.query(query, [userId]);

      if (results.length === 0) {
          res.status(404).json({ error: 'Notification not found' });
      } else {
          const groupedResults = [];
          const courseMap = {};

          for (let result of results) {
              if (!courseMap[result.CourseId]) {
                  courseMap[result.CourseId] = {
                      CourseName: result.CourseName,
                      CourseId: result.CourseId,
                      ImageUrl: result.ImageUrl,
                      Dates: []
                  };
                  groupedResults.push(courseMap[result.CourseId]);
              }

              // Fetch TeeTimes and NotifiedTeeTimeId for each unique CourseId and Date
              const teeTimesResults = await pool.query(`
                  SELECT DISTINCT
                      ntt.TeeTime,
                      ntt.NotifiedTeeTimeId
                  FROM notified_tee_times ntt
                  JOIN notifications n ON ntt.NotificationId = n.NotificationId
                  WHERE n.UserId = ? 
                  AND n.CourseId = ? 
                  AND DATE(ntt.TeeTime) = ?
                  ORDER BY ntt.TeeTime
              `, [userId, result.CourseId, result.Date]);

              // Extract TeeTimes and NotifiedTeeTimeId from the results
              const teeTimes = teeTimesResults.map(row => ({
                  teeTime: row.TeeTime,
                  notifiedTeeTimeId: row.NotifiedTeeTimeId
              }));

              courseMap[result.CourseId].Dates.push({ Date: result.Date, TeeTimes: teeTimes });
          }

          res.json(groupedResults);
      }
  } catch (err) {
      console.error('Error getting notification: ', err);
      res.status(500).json({ error: 'Error getting notification' });
  }
};


const removeNotification = async (req, res) => {
  const NotifiedTeeTimeId = req.params.NotifiedTeeTimeId;

  try {
    // Delete the specified tee time from the notified_tee_times table
    const result = await pool.query(
      'DELETE FROM notified_tee_times WHERE NotifiedTeeTimeId = ?',
      [NotifiedTeeTimeId]
    );

    if (result.affectedRows === 0) {
      res.status(404).json({ error: 'Notified tee time not found' });
    } else {
      res.json({ message: 'Notified tee time removed successfully.' });
    }
  } catch (err) {
    console.error('Error removing notified tee time: ', err);
    res.status(500).json({ error: 'Error removing notified tee time' });
  }
};


module.exports = {
  getNotificationsByCourse,
  removeNotification
};