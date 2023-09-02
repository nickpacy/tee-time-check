const express = require('express');
const usersController = require('../controllers/usersController');
const verifyToken = require('../middlewares/authMiddleware');

const router = express.Router();

router.put('/updateDeviceToken', verifyToken, usersController.updateUserDeviceToken);

router.get('/', usersController.getUsers);
router.get('/:userId', usersController.getUserById);
router.post('/', usersController.createUser);
router.put('/:userId', usersController.updateUser);
router.delete('/:userId', usersController.deleteUser);
router.get('/userByEmail/:email', usersController.getUserByEmail);

module.exports = router;