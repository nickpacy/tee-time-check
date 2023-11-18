const express = require('express');
const metricsController = require('../controllers/metricsController');
const verifyToken = require('../middlewares/authMiddleware');

const router = express.Router();

router.post('/notificationsByCourse', verifyToken, metricsController.getNotificationsByCourse);


module.exports = router;