
const express = require('express');
const authController = require('../controllers/authController');
const router = express.Router();

router.post('/register', authController.registerUser);
router.post('/login', authController.loginUser);
router.post('/forgotPassword', authController.forgotPassword);
router.post('/changePassword', authController.changePassword);



module.exports = router;