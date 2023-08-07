
const express = require('express');
const teeTimeController = require('../controllers/teeTimeController');
const router = express.Router();

//Global tee time search 
router.post('/teetimesearch', teeTimeController.searchTeeTimes);

module.exports = router;