const pool = require("../database");
const email = require("./emailController");
const crypto = require("crypto");
const {
  NotFoundError,
  InternalError,
  ConflictError,
} = require("../middlewares/errorTypes");

const ENCRYPTION_KEY = crypto.scryptSync("AlgoteeEncyrpt", "andthesaltis", 32); // change 'Your Super Secret Passphrase' and 'salt'
const IV_LENGTH = 16; // For AES, this is always 16

// Encryption and Decryption functions
function encrypt(text) {
  let iv = crypto.randomBytes(IV_LENGTH);
  let cipher = crypto.createCipheriv("aes-256-gcm", ENCRYPTION_KEY, iv);
  let encrypted = cipher.update(text);
  let finalBuffer = Buffer.concat([encrypted, cipher.final()]);
  let authTag = cipher.getAuthTag();
  return Buffer.concat([iv, finalBuffer, authTag]).toString("base64");
}

function decrypt(text) {
  let buffer = Buffer.from(text, "base64");
  let iv = buffer.slice(0, IV_LENGTH);
  let encryptedText = buffer.slice(IV_LENGTH, buffer.length - 16);
  let authTag = buffer.slice(buffer.length - 16);
  let decipher = crypto.createDecipheriv("aes-256-gcm", ENCRYPTION_KEY, iv);
  decipher.setAuthTag(authTag);
  let decrypted = decipher.update(encryptedText);
  return Buffer.concat([decrypted, decipher.final()]).toString();
}

// Get all users
const getUsers = async (req, res, next) => {
  try {
    const rows = await pool.query("SELECT * FROM users");
    res.json(rows);
  } catch (error) {
    next(new InternalError("Error getting users", error));
  }
};

// Get user by UserId
const getUserById = async (req, res, next) => {
  const userId = req.params.userId;
  try {
    const rows = await pool.query("SELECT * FROM users WHERE UserId = ?", [
      userId,
    ]);
    if (rows.length === 0) {
      next(new NotFoundError("User not found"));
    } else {
      res.json(rows[0]);
    }
  } catch (error) {
    next(new InternalError("Error getting user", error));
  }
};

// Get user by email
const getUserByEmail = async (req, res, next) => {
  const email = req.params.email;
  try {
    const rows = await pool.query(
      "SELECT * FROM users WHERE Email = ? LIMIT 1",
      [email]
    );
    if (rows.length === 0) {
      next(new NotFoundError("User not found"));
    } else {
      res.json(rows[0]);
    }
  } catch (error) {
    next(new InternalError("Error getting user", error));
  }
};


// Search for users by name
const searchUsers = async (req, res, next) => {
  const queryString = req.query.q;

  try {
    const rows = await pool.query(
      "SELECT * FROM users WHERE active = 1 AND name LIKE CONCAT(?, '%') ",
      [queryString]
    );
    res.json(rows);
  } catch (error) {
    next(new InternalError("Error getting user", error));
  }
};


// Create a new user
const createUser = async (req, res, next) => {
  const { Name, Email, Active } = req.body;
  try {
    const tempPassword = "NEW";
    const result = await pool.query(
      "INSERT INTO users (Name, Email, Password, Active) VALUES (?, ?, ?, ?)",
      [Name, Email, tempPassword, Active]
    );
    const newUserId = result.insertId;

    // Call the stored procedure to add inactive timechecks for the new user
    // await pool.query("CALL AddTimechecksForNewUser(?)", [newUserId]);
    // await pool.query("CALL CreateUserCourses(?)", [newUserId]);

    const rows = await pool.query("SELECT * FROM users WHERE UserId = ?", [
      newUserId,
    ]);
    // console.log(rows);
    const user = rows[0];
    // console.log(user);

    const mailOptions = {
      from: '"Welcome" <donotreply@algotee.com>',
      to: user.Email,
      subject: "Welcome - Algoteé",
      template: "welcome.html",
    };
    await email.setAndSendPassword(user, mailOptions);

    res.status(201).json({ UserId: newUserId, Name, Email, Active });
  } catch (error) {
    next(new InternalError("Error creating user", error));
  }
};

// Update an existing user
const updateUser = async (req, res, next) => {
  const userId = req.params.userId;
  let {
    Name,
    Email,
    Phone,
    EmailNotification,
    PhoneNotification,
    Latitude,
    Longitude,
    Admin,
    Active,
  } = req.body;

  if ("PhoneNotification" in req.body) {
    PhoneNotification = PhoneNotification !== null ? PhoneNotification : false;
  } else {
    PhoneNotification = false;
  }

  try {
    Phone = Phone === "" ? null : Phone;
    const result = await pool.query(
      "UPDATE users SET Name = ?, Email = ?, Phone = ?, EmailNotification = ?, PhoneNotification = ?, Latitude = ?, Longitude = ?, Admin = ?, Active = ? WHERE UserId = ?",
      [
        Name,
        Email,
        Phone,
        EmailNotification,
        PhoneNotification,
        Latitude,
        Longitude,
        Admin,
        Active,
        userId,
      ]
    );

    if (result.affectedRows === 0) {
      next(new NotFoundError("User not found"));
    } else {
      res.json({
        UserId: userId,
        Name,
        Email,
        Phone,
        EmailNotification,
        PhoneNotification,
        Latitude,
        Longitude,
        Admin,
        Active,
        message: "Profile updated successfully!",
      });
    }
  } catch (error) {
    if (error.code === "ER_DUP_ENTRY") {
      next(new ConflictError("Duplicate email or phone number", error));
    } else {
      next(new InternalError("Error updating user", error));
    }
  }
};

// Delete an existing user
const deleteUser = async (req, res, next) => {
  const userId = req.params.userId;
  try {
    // Attempt to delete related notifications for the user
    try {
      await pool.query("DELETE FROM notifications WHERE UserId = ?", [userId]);
    } catch (error) {
      console.log(error);
      throw new InternalError(`Error deleting notifications for user with ID ${userId}`, error);
    }

    // Attempt to delete related timechecks for the user
    try {
      await pool.query("DELETE FROM timechecks WHERE UserId = ?", [userId]);
    } catch (error) {
      console.log(error);
      throw new InternalError(`Error deleting timechecks for user with ID ${userId}`, error);
    }

    // Attempt to delete related user_courses for the user
    try {
      await pool.query("DELETE FROM user_courses WHERE UserId = ?", [userId]);
    } catch (error) {
      console.log(error);
      throw new InternalError(`Error deleting user_courses for user with ID ${userId}`, error);
    }

    // Attempt to delete related user_settings for the user
    try {
      await pool.query("DELETE FROM user_settings WHERE UserId = ?", [userId]);
    } catch (error) {
      console.log(error);
      throw new InternalError(`Error deleting user_settings for user with ID ${userId}`, error);
    }

    // Attempt to delete the user
    const result = await pool.query("DELETE FROM users WHERE UserId = ?", [userId]);

    if (result.affectedRows === 0) {
      next(new NotFoundError("User not found"));
    } else {
      res.sendStatus(204); // No Content
    }
  } catch (error) {
    // Pass along any caught errors to the next middleware
    next(error instanceof InternalError ? error : new InternalError("Error deleting user", error));
  }
};


// updateUserDeviceToken
const updateUserDeviceToken = async (req, res, next) => {
  const userId = req.user.userId;
  const { deviceToken } = req.body;

  try {
    const [currentRows] = await pool.query(
      "SELECT DeviceToken FROM users WHERE UserId = ?",
      [userId]
    );
    const currentDeviceToken =
      currentRows.length > 0 ? currentRows[0].DeviceToken : null;

    if (deviceToken !== currentDeviceToken) {
      await pool.query("UPDATE users SET DeviceToken = ? WHERE UserId = ?", [
        deviceToken,
        userId,
      ]);
      res.json({
        success: true,
        message: "Device token updated successfully.",
      });
    } else {
      res.json({
        success: true,
        message: "Device token unchanged, no update needed.",
      });
    }
  } catch (error) {
    next(new InternalError("Error updating device token", error));
  }
};

// insertOrUpdateUserSetting
const insertOrUpdateUserSetting = async (req, res, next) => {
  const userId = req.user.userId;
  const settings = req.body.settings || [];

  try {
    for (let setting of settings) {
      let settingValue = setting.encrypt
        ? encrypt(setting.settingValue)
        : setting.settingValue;

      await pool.query(
        "INSERT INTO user_settings (UserId, SettingKey, SettingValue) VALUES (?, ?, ?) ON DUPLICATE KEY UPDATE SettingValue = ?",
        [userId, setting.settingKey, settingValue, settingValue]
      );
    }

    res.json({ success: true, message: "User Settings Updated!" });
  } catch (error) {
    next(new InternalError("Error processing settings", error));
  }
};

const getUserSettings = async (req, res, next) => {
  const userId = req.user.userId;

  try {
    // Query to fetch all settings for this user
    const rows = await pool.query(
      "SELECT settingKey, settingValue, IF(settingKey LIKE '%password%', true, false) as encrypt FROM user_settings WHERE userId = ?",
      [userId]
    );

    // Transform results if necessary (e.g., decrypt values)
    const transformedSettings = rows.map((row) => {
      let settingValue = row.settingValue;

      // Decrypt settingValue if the 'encrypt' column is true
      if (row.encrypt) {
        settingValue = decrypt(settingValue);
      }

      return {
        settingKey: row.settingKey,
        settingValue: settingValue,
      };
    });

    res.json(transformedSettings);
  } catch (error) {
    next(new InternalError("Error fetching settings", error));
  }
};

module.exports = {
  getUsers,
  getUserById,
  getUserByEmail,
  createUser,
  updateUser,
  deleteUser,
  updateUserDeviceToken,
  insertOrUpdateUserSetting,
  getUserSettings,
  searchUsers
};
