// api/routes/communicationsRoutes.js
const express = require('express');
const communicationsController = require('../controllers/communicationsController');
const { verifyToken, requireAdmin, requireSelfOrAdmin } = require('../middlewares/authMiddleware');

const router = express.Router();

// All comms routes require a valid token
router.use(verifyToken);

/**
 * Current user (no param)
 * GET /communications/me
 * GET /communications/me/summary?hours=24
 * GET /communications/me/sms-count-today
 */
router.get('/me', communicationsController.listSelf);
router.get('/me/summary', communicationsController.summarySelf);
router.get('/me/sms-count-today', communicationsController.smsCountTodaySelf);

/**
 * Per specific user — allow self or admin
 * GET /communications/users/:userId
 * GET /communications/users/:userId/summary?hours=24
 * GET /communications/users/:userId/sms-count-today
 */
router.get('/users/:userId', requireSelfOrAdmin('userId'), communicationsController.listUser);
router.get('/users/:userId/summary', requireSelfOrAdmin('userId'), communicationsController.summaryUser);
router.get('/users/:userId/sms-count-today', requireSelfOrAdmin('userId'), communicationsController.smsCountTodayUser);

/**
 * Global (all users) — admin only
 * GET /communications/all?from=&to=&limit=
 * GET /communications/all/summary?hours=24
 */
router.get('/all', requireAdmin, communicationsController.listAll);
router.get('/all/summary', requireAdmin, communicationsController.summaryAll);

/**
 * Admin summaries
 * GET /communications/admin/users?from=&to=
 * GET /communications/admin/users/:userId?from=&to=
 */
router.get('/admin/users', requireAdmin, communicationsController.listUserSummaries);
router.get('/admin/users/:userId', requireAdmin, communicationsController.listUserNotifications);


module.exports = router;
