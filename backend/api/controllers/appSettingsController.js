const pool = require("../database");
const { NotFoundError, DatabaseError } = require("../middlewares/errorTypes");

// Get all app settings
const getAppSettings = async (req, res, next) => {
  try {
    const rows = await pool.query("SELECT * FROM app_settings");
    res.json(rows);
  } catch (error) {
    next(new DatabaseError("Error getting app settings", error));
  }
};

// Get a specific app setting by key
const getSettingByKey = async (req, res, next) => {
  const settingKey = req.params.settingKey;

  try {
    const rows = await pool.query("SELECT * FROM app_settings WHERE SettingKey = ?", [settingKey]);
    if (rows.length === 0) {
      throw new NotFoundError("Setting not found");
    } else {
      res.json(rows[0]);
    }
  } catch (error) {
    next(new DatabaseError("Error getting specific app setting", error));
  }
};

// Create a new app setting
const createSetting = async (req, res, next) => {
  const { settingKey, settingValue, dataType, description } = req.body;

  try {
    await pool.query(
      "INSERT INTO app_settings (SettingKey, SettingValue, DataType, Description) VALUES (?, ?, ?, ?)",
      [settingKey, settingValue, dataType, description]
    );
    res.status(201).json({ settingKey, settingValue, dataType, description });
  } catch (error) {
    next(new DatabaseError("Error creating app setting", error));
  }
};

// Update an existing app setting
const updateSetting = async (req, res, next) => {
  const settingKey = req.params.settingKey;
  const { settingValue, dataType, description } = req.body;

  try {
    const result = await pool.query(
      "UPDATE app_settings SET SettingValue = ?, DataType = ?, Description = ? WHERE SettingKey = ?",
      [settingValue, dataType, description, settingKey]
    );
    if (result.affectedRows === 0) {
      throw new NotFoundError("Setting not found");
    } else {
      res.json({ settingKey, settingValue, dataType, description });
    }
  } catch (error) {
    next(error);
  }
};

// Delete an existing app setting
const deleteSetting = async (req, res, next) => {
  const settingKey = req.params.settingKey;

  try {
    const result = await pool.query("DELETE FROM app_settings WHERE SettingKey = ?", [settingKey]);
    if (result.affectedRows === 0) {
      throw new NotFoundError("Setting not found");
    } else {
      res.sendStatus(204);
    }
  } catch (error) {
    next(new DatabaseError("Error deleting app setting", error));
  }
};

module.exports = {
  getAppSettings,
  getSettingByKey,
  createSetting,
  updateSetting,
  deleteSetting
};
