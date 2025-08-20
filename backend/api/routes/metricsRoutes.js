const express = require('express');
const metricsController = require('../controllers/metricsController');
const { verifyToken } = require('../middlewares/authMiddleware');

const router = express.Router();

router.get('/notificationsByCourse', verifyToken, metricsController.getNotificationsByCourse);
router.get('/notificationsByCourseAndUser', metricsController.getTotalTeeTimesByCourseAndUser);
router.get('/monthlyCharges', verifyToken, metricsController.getMonthlyCharges);
router.get('/allUsersMonthlyCharges', verifyToken, metricsController.getAllUsersMonthlyCharges);


module.exports = router;