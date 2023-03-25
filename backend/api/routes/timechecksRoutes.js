const express = require('express');
const timechecksController = require('../controllers/timechecksController');

const router = express.Router();

router.get('/', timechecksController.getTimechecks);
router.get('/:timecheckId', timechecksController.getTimecheckById);
router.post('/', timechecksController.createTimecheck);
router.put('/:timecheckId', timechecksController.updateTimecheck);
router.delete('/:timecheckId', timechecksController.deleteTimecheck);
router.get('/timechecksByUserId/:userId', timechecksController.getTimechecksByUserId);

module.exports = router;