const express = require('express');
const teeSheetController = require('../controllers/teeSheetController');
const { verifyToken } = require('../middlewares/authMiddleware'); // Assuming you want these routes protected

const router = express.Router();

// Route to get all tee times
router.get('/', verifyToken, teeSheetController.getDetailedTeeTimes);

// Route to get a specific tee time by ID
router.get('/:teeSheetId', verifyToken, teeSheetController.getTeeTimeById);
router.get('/players/:teeSheetId', verifyToken, teeSheetController.getTeeTimePlayers);

// Route to add a guest player
router.post('/addGuestPlayer', verifyToken, teeSheetController.addGuestPlayer);
router.post('/addFriendPlayer', verifyToken, teeSheetController.addFriendPlayer);

// Route to add friends to notification queue
router.post('/addFriendsToNotificationQueue', verifyToken, teeSheetController.addFriendsToNotificationQueue);

router.post('/updateQueueStatus', verifyToken, teeSheetController.updateQueueStatus);


// Route to remove a player from a tee sheet
router.delete('/removePlayer/:teeSheetPlayerId', verifyToken, teeSheetController.removeTeeSheetPlayer);


// Route to create a new tee time
router.post('/', verifyToken, teeSheetController.createTeeTime);

// Route to update a tee time
router.put('/:teeSheetId', verifyToken, teeSheetController.updateTeeTime);

// Route to delete a tee time
router.delete('/:teeSheetId', verifyToken, teeSheetController.deleteTeeTime);



module.exports = router;
