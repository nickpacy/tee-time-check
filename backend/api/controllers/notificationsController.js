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

// Get a specific notification by ID
const getNotificationById = async (req, res) => {
  const notificationId = req.params.notificationId;
  try {
    const results = await pool.query('SELECT * FROM notifications WHERE Id = ?', [notificationId]);
    if (results.length === 0) {
      res.status(404).json({ error: 'Notification not found' });
    } else {
      res.json(results[0]);
    }
  } catch (err) {
    console.error('Error getting notification: ', err);
    res.status(500).json({ error: 'Error getting notification' });
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

// Delete a notification
const deleteNotification = async (req, res) => {
  const notificationId = req.params.notificationId;
  try {
    const result = await pool.query('DELETE FROM notifications WHERE Id = ?', [notificationId]);
    if (result.affectedRows === 0) {
      res.status(404).json({ error: 'Notification not found' });
    } else {
      res.sendStatus(204);
    }
  } catch (err) {
    console.error('Error deleting notification: ', err);
    res.status(500).json({ error: 'Error deleting notification' });
  }
};

module.exports = {
  getNotifications,
  getNotificationById,
  createNotification,
  updateNotification,
  deleteNotification
};