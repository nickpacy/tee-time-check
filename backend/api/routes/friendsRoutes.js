const express = require('express');
const friendsController = require('../controllers/friendsController');
const { verifyToken } = require('../middlewares/authMiddleware');

const router = express.Router();

// Specific routes
router.get('/', verifyToken, friendsController.getFriends);
router.get('/pending', verifyToken, friendsController.getPendingRequests);

// CRUD operations
router.post('/', verifyToken, friendsController.createFriend);
router.put('/:friendshipId', verifyToken, friendsController.updateFriend);
router.delete('/:friendshipId', verifyToken, friendsController.deleteFriend);

module.exports = router;
