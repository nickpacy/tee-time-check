const express = require('express');
const timechecksController = require('../controllers/timechecksController');

const router = express.Router();

router.get('/', timechecksController.getTimechecks);
router.get('/:timecheckId', timechecksController.getTimecheckById);
router.post('/', timechecksController.createTimecheck);
router.post('/bulk-update', timechecksController.updateBulkTimechecks);
router.put('/:timecheckId', timechecksController.updateTimecheck);
router.delete('/:timecheckId', timechecksController.deleteTimecheck);
router.get('/timechecksByUserId/:userId', timechecksController.getTimechecksByUserId);
router.get('/timechecksByUserIdAndCourseId/:userId/:courseId', timechecksController.getTimechecksByUserIdAndCourseId);
router.get('/timechecksByCourse/:userId', timechecksController.getTimechecksByCourse);
router.get('/activeTimecheckCount/:userId', timechecksController.getActiveTimecheckCountByUserId);
router.get('/resetTimechecks/:userId', timechecksController.resetTimechecks);


module.exports = router;