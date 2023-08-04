const express = require('express');
const notificationsController = require('../controllers/notificationsController');

const router = express.Router();

// GET all notifications
router.get('/', notificationsController.getNotifications);

// GET a specific notification by ID
router.get('/:notificationId', notificationsController.getNotificationById);

// GET a notifications by for a user
//?showFutureDates=true
router.get('/byUser/:userId', notificationsController.getNotificationsByUserId);

// POST a new notification
router.post('/', notificationsController.createNotification);

// PUT (update) an existing notification
router.put('/removeNotification', notificationsController.removeNotification);

// DELETE a notification
router.delete('/:notificationId', notificationsController.deleteNotification);

module.exports = router;