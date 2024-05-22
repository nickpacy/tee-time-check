const express = require('express');
const notificationsController = require('../controllers/notificationsController');
const verifyToken = require('../middlewares/authMiddleware');

const router = express.Router();


// GET a notifications by for a user
router.get('/byCourse', verifyToken, notificationsController.getNotificationsByCourse);

router.get('/updateMessages', notificationsController.updateTwilioMessages)

// DELETE an existing notification
router.delete('/removeNotification/:NotificationId', notificationsController.removeNotification);


module.exports = router;