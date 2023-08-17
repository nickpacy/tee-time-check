// const moment = require('moment-timezone');
const pool = require('../database');


const getNotificationsByCourse = async (req, res) => {
  const userId = req.params.userId;

  try {
      // Fetch distinct courses and tee times for which user received notifications in the past 24 hours
      let query = `
          SELECT 
              n.UserId, 
              n.CourseId, 
              c.CourseName, 
              c.ImageUrl,
              n.NotificationId,
              n.TeeTime
          FROM notifications n
          JOIN courses c ON n.CourseId = c.CourseId 
          WHERE n.UserId = ?
          AND n.NotifiedDate BETWEEN NOW() - INTERVAL 24 HOUR AND NOW()
      `;

      const results = await pool.query(query, [userId]);

      if (results.length === 0) {
          res.status(404).json({ error: 'Notification not found' });
          return;
      }

      res.json(results);

  } catch (err) {
      console.error('Error getting notification: ', err);
      res.status(500).json({ error: 'Error getting notification' });
  }
};


const removeNotification = async (req, res) => {
  const NotificationId = req.params.NotificationId;

  try {
    // Delete the specified tee time from the notified_tee_times table
    const result = await pool.query(
      'DELETE FROM notifications WHERE NotificationId = ?',
      [NotificationId]
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