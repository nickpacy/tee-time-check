const express = require('express');
const appSettingsController = require('../controllers/appSettingsController');
const { verifyToken } = require('../middlewares/authMiddleware'); // Assuming you want these routes protected

const router = express.Router();

// Get all settings
router.get('/', verifyToken, appSettingsController.getAppSettings);

// Get a specific setting by key
router.get('/:settingKey', verifyToken, appSettingsController.getSettingByKey);

// CRUD operations for app settings
router.post('/', verifyToken, appSettingsController.createSetting);
router.put('/:settingKey', verifyToken, appSettingsController.updateSetting);
router.delete('/:settingKey', verifyToken, appSettingsController.deleteSetting);

module.exports = router;
