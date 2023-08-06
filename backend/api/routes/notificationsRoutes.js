const express = require('express');
const notificationsController = require('../controllers/notificationsController');

const router = express.Router();


// GET a notifications by for a user
//?showFutureDates=true
router.get('/byCourse/:userId', notificationsController.getNotificationsByCourse);

// PUT (update) an existing notification
router.delete('/removeNotification/:NotifiedTeeTimeId', notificationsController.removeNotification);


module.exports = router;