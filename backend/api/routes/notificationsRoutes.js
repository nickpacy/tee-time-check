const express = require('express');
const notificationsController = require('../controllers/notificationsController');

const router = express.Router();

// GET all notifications
router.get('/', notificationsController.getNotifications);

// GET a specific notification by ID
router.get('/:notificationId', notificationsController.getNotificationById);

// POST a new notification
router.post('/', notificationsController.createNotification);

// PUT (update) an existing notification
router.put('/:notificationId', notificationsController.updateNotification);

// DELETE a notification
router.delete('/:notificationId', notificationsController.deleteNotification);

module.exports = router;