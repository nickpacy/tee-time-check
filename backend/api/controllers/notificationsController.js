const moment = require('moment-timezone');
const pool = require('../database');

// Get all notifications
const getNotifications = async (req, res) => {
  try {
    const results = await pool.query('SELECT * FROM notifications');
    res.json(results);
  } catch (err) {
    console.error('Error getting notifications: ', err);
    res.status(500).json({ error: 'Error getting notifications' });
  }
};


// Create a new notification
const createNotification = async (req, res) => {
  const { UserId, CourseId, CheckDate, NotifiedTeeTimes } = req.body;
  try {
    const result = await pool.query('INSERT INTO notifications (UserId, CourseId, CheckDate, NotifiedTeeTimes) VALUES (?, ?, ?, ?)', [UserId, CourseId, CheckDate, NotifiedTeeTimes]);
    const newNotificationId = result.insertId;
    res.status(201).json({ Id: newNotificationId, UserId, CourseId, CheckDate, NotifiedTeeTimes });
  } catch (err) {
    console.error('Error creating notification: ', err);
    res.status(500).json({ error: 'Error creating notification' });
  }
};

// Update an existing notification
const updateNotification = async (req, res) => {
  const notificationId = req.params.notificationId;
  const { UserId, CourseId, CheckDate, NotifiedTeeTimes } = req.body;
  try {
    const result = await pool.query('UPDATE notifications SET UserId = ?, CourseId = ?, CheckDate = ?, NotifiedTeeTimes = ? WHERE Id = ?', [UserId, CourseId, CheckDate, NotifiedTeeTimes, notificationId]);
    if (result.affectedRows === 0) {
      res.status(404).json({ error: 'Notification not found' });
    } else {
      res.json({ Id: notificationId, UserId, CourseId, CheckDate, NotifiedTeeTimes });
    }
  } catch (err) {
    console.error('Error updating notification: ', err);
    res.status(500).json({ error: 'Error updating notification' });
  }
};


const getNotificationsByCourse = async (req, res) => {
  const userId = req.params.userId;
  const showFutureDates = req.query.showFutureDates === 'true';

  try {
    let query = 'SELECT DISTINCT UserId, c.CourseId, c.CourseName, c.ImageUrl, DATE(TeeTimes) as Date FROM vw_notifications n JOIN courses c ON n.CourseId = c.CourseId WHERE UserId = ? AND CheckDate = CURDATE()';

    if (showFutureDates) {
      query += ' AND TeeTimes > NOW()';
    }

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

        // Fetch TeeTimes for each unique CourseId and Date
        const teeTimesResults = await pool.query('SELECT TeeTimes FROM vw_notifications WHERE UserId = ? AND CourseId = ? AND DATE(TeeTimes) = ? ORDER BY TeeTimes', [userId, result.CourseId, result.Date]);

        // Extract TeeTimes from the results
        const teeTimes = teeTimesResults.map(row => row.TeeTimes);

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
  const { UserId, CourseId, CheckDate, TeeTime } = req.body;
  // Convert CheckDate and TeeTime to Pacific Time
  let checkDatePacific = moment(new Date()).tz('America/Los_Angeles').format('YYYY-MM-DD')//moment(CheckDate).tz('America/Los_Angeles').format('YYYY-MM-DD');
  let teeTimePacific = moment(TeeTime).tz('America/Los_Angeles').format('YYYY-MM-DD HH:mm');

  console.log({
    UserId, CourseId, checkDatePacific, teeTimePacific
  })

  try {
    // Fetch the existing notification from the database based on UserId, CourseId, and CheckDate
    const existingNotification = await pool.query(
      'SELECT NotifiedTeeTimes FROM notifications WHERE UserId = ? AND CourseId = ? AND CheckDate = ?',
      [UserId, CourseId, checkDatePacific]
    );

    if (existingNotification.length === 0) {
      res.status(404).json({ error: 'Notification not found' });
      return;
    }

    // Parse the comma-separated datetime string from the database into an array
    const notifiedTeeTimesArray = existingNotification[0].NotifiedTeeTimes.split(',');

    // Check if the datetime string to remove is present in the array
    const indexToRemove = notifiedTeeTimesArray.indexOf(teeTimePacific);
    if (indexToRemove === -1) {
      // The datetime string to remove is not present, just return the current values
      res.json({ UserId, CourseId, CheckDate, NotifiedTeeTimes: existingNotification[0].NotifiedTeeTimes });
      return;
    }

    // Remove the datetime string from the array
    notifiedTeeTimesArray.splice(indexToRemove, 1);

    // Convert the updated array back to a comma-separated string
    const updatedNotifiedTeeTimes = notifiedTeeTimesArray.join(',');

    // Perform the database update with the modified NotifiedTeeTimes string
    const result = await pool.query(
      'UPDATE notifications SET NotifiedTeeTimes = ? WHERE UserId = ? AND CourseId = ? AND CheckDate = ?',
      [updatedNotifiedTeeTimes, UserId, CourseId, checkDatePacific]
    );

    if (result.affectedRows === 0) {
      res.status(404).json({ error: 'Notification not found' });
    } else {
      res.json({ UserId, CourseId, CheckDate, NotifiedTeeTimes: updatedNotifiedTeeTimes });
    }
  } catch (err) {
    console.error('Error updating notification: ', err);
    res.status(500).json({ error: 'Error updating notification' });
  }
};


module.exports = {
  getNotifications,
  createNotification,
  updateNotification,
  getNotificationsByCourse,
  removeNotification
};