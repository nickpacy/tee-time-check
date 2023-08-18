const express = require('express');
const timechecksController = require('../controllers/timechecksController');
const verifyToken = require('../middlewares/authMiddleware');

const router = express.Router();

// Specific routes
router.get('/', timechecksController.getTimechecks);
router.get('/allUsersActiveTimechecks', timechecksController.getAllUsersActiveTimechecks);
router.post('/', timechecksController.createTimecheck);
router.post('/bulk-update', timechecksController.updateBulkTimechecks);

// Middleware-protected routes
router.get('/timechecksByUserId', verifyToken, timechecksController.getTimechecksByUserId);
router.get('/timechecksByUserIdAndCourseId/:courseId', verifyToken, timechecksController.getTimechecksByUserIdAndCourseId);
router.get('/timechecksByCourse', verifyToken, timechecksController.getTimechecksByCourse);
router.get('/activeTimecheckCount', verifyToken, timechecksController.getActiveTimecheckCountByUserId);
router.get('/resetTimechecks', verifyToken, timechecksController.resetTimechecks);

// Parameterized routes
router.get('/:timecheckId', timechecksController.getTimecheckById);
router.put('/:timecheckId', timechecksController.updateTimecheck);
router.delete('/:timecheckId', timechecksController.deleteTimecheck);

module.exports = router;


module.exports = router;