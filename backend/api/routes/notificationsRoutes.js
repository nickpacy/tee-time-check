const express = require('express');
const notificationsController = require('../controllers/notificationsController');

const router = express.Router();

// GET all notifications
router.get('/', notificationsController.getNotifications);

// GET a notifications by for a user
//?showFutureDates=true
router.get('/byCourse/:userId', notificationsController.getNotificationsByCourse);

// POST a new notification
router.post('/', notificationsController.createNotification);

// PUT (update) an existing notification
router.put('/removeNotification', notificationsController.removeNotification);


module.exports = router;