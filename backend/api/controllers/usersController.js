const pool = require('../database');
const email = require('./emailController');
const crypto = require("crypto");

const ENCRYPTION_KEY = crypto.scryptSync('AlgoteeEncyrpt', 'andthesaltis', 32); // change 'Your Super Secret Passphrase' and 'salt'
const IV_LENGTH = 16; // For AES, this is always 16

function encrypt(text) {
    let iv = crypto.randomBytes(IV_LENGTH);
    let cipher = crypto.createCipheriv('aes-256-gcm', ENCRYPTION_KEY, iv);
    let encrypted = cipher.update(text);
    let finalBuffer = Buffer.concat([encrypted, cipher.final()]);
    let authTag = cipher.getAuthTag();
    return Buffer.concat([iv, finalBuffer, authTag]).toString('base64'); // returns base64 string
}

function decrypt(text) {
    let buffer = Buffer.from(text, 'base64');
    let iv = buffer.slice(0, IV_LENGTH);
    let encryptedText = buffer.slice(IV_LENGTH, buffer.length - 16); // excluding auth tag
    let authTag = buffer.slice(buffer.length - 16);
    let decipher = crypto.createDecipheriv('aes-256-gcm', ENCRYPTION_KEY, iv);
    decipher.setAuthTag(authTag);
    let decrypted = decipher.update(encryptedText);
    return Buffer.concat([decrypted, decipher.final()]).toString();
}



// Get all users
const getUsers = async (req, res) => {
    try {
      const rows = await pool.query('SELECT * FROM users');
      res.json(rows);
    } catch (error) {
      console.error('Error getting users: ', error);
      res.status(500).json({ message: 'Error getting users' });
    }
};

// Get user by UserId
const getUserById = async (req, res) => {
    const userId = req.params.userId;

    try {
        const rows = await pool.query('SELECT * FROM users WHERE UserId = ?', [userId]);
        if (rows.length === 0) {
            res.status(404).json({ message: 'User not found' });
        } else {
            res.json(rows[0]);
        }
    } catch (error) {
        console.error('Error getting user: ', error);
        res.status(500).json({ message: 'Error getting user' });
    }
};

// Get user by email
const getUserByEmail = async (req, res) => {
    const email = req.params.email;
    try {
        const rows = await pool.query('SELECT * FROM users WHERE Email = ? LIMIT 1', [email]);
        if (rows.length === 0) {
            res.status(404).json({ message: 'User not found' });
        } else {
            res.json(rows[0]);
        }
    } catch (error) {
        console.error('Error getting user: ', error);
        res.status(500).json({ message: 'Error getting user' });
    }
};

// Create a new user
const createUser = async (req, res) => {
    const { Name, Email, Active } = req.body;
    try {
      const tempPassword = 'NEW';
      const result = await pool.query('INSERT INTO users (Name, Email, Password, Active) VALUES (?, ?, ?, ?)', [Name, Email, tempPassword, Active]);
      const newUserId = result.insertId;

      // Call the stored procedure to add inactive timechecks for the new user
      await pool.query('CALL AddTimechecksForNewUser(?)', [newUserId]);
      await pool.query('CALL CreateUserCourses(?)', [newUserId]);

      const rows = await pool.query('SELECT * FROM users WHERE UserId = ?', [newUserId]);
      console.log(rows)
      const user = rows[0];
      console.log(user);

      const mailOptions = {
        from: '"Welcome" <donotreply@teetimecheck.com>',
        to: user.Email,
        subject: 'Welcome - Tee Time Check',
        template: 'welcome.html'
      };
      await email.setAndSendPassword(user, mailOptions)

      res.status(201).json({ UserId: newUserId, Name, Email, Active });
    } catch (error) {
      console.error('Error creating user: ', error);
      res.status(500).json({ message: 'Error creating user', error });
    }
  };

// Update an existing user
const updateUser = async (req, res) => {
    const userId = req.params.userId;
    let { Name, Email, Phone, EmailNotification, PhoneNotification, Admin, Active } = req.body;

    if ('PhoneNotification' in req.body) {
      PhoneNotification = PhoneNotification !== null ? PhoneNotification : false;
    } else {
        PhoneNotification = false;
    }

    try {
      Phone = Phone === '' ? null : Phone;
      const result = await pool.query('UPDATE users SET Name = ?, Email = ?, Phone = ?, EmailNotification = ?, PhoneNotification = ?, Admin = ?, Active = ? WHERE UserId = ?', [Name, Email, Phone, EmailNotification, PhoneNotification, Admin, Active, userId]
      );

      // if EmailNotification and PhoneNotification are both false
      // update the Timechecks table and set Active = false for all the timechecks related to this user
      // if (!EmailNotification && !PhoneNotification && !) {
      //   await pool.query('UPDATE timechecks SET Active = false WHERE UserId = ?', [userId]);
      // }


      if (result.affectedRows === 0) {
        res.status(404).json({ message: 'User not found' });
      } else {
        res.json({ UserId: userId, Name, Email, Phone, EmailNotification, PhoneNotification, Admin, Active, message: 'Profile updated successfully!'});
      }
    } catch (error) {
      console.error('Error updating user: ', error);
      let message = 'Error updating user';
      if (error.code == 'ER_DUP_ENTRY') {
        if (error.sqlMessage && error.sqlMessage.includes('email')) {
          message = 'Email already exists.';
        }
        if (error.sqlMessage && error.sqlMessage.includes('phone')) {
          message = 'Phone # already exists.';
        }
      }
      res.status(500).json({ message: message, error });
    }
  };

// Delete an existing user
const deleteUser = async (req, res) => {
  const userId = req.params.userId;
  try {
     // First, delete the related notifications for this user
     await pool.query('DELETE FROM notifications WHERE UserId = ?', [userId]);
    
    // Second, delete the related timechecks for this user
    await pool.query('DELETE FROM timechecks WHERE UserId = ?', [userId]);

    // Then, delete the user
    const result = await pool.query('DELETE FROM users WHERE UserId = ?', [userId]);

    if (result.affectedRows === 0) {
      res.status(404).json({ message: 'User not found' });
    } else {
      res.sendStatus(204);
    }
  } catch (error) {
    console.error('Error deleting user: ', error);
    res.status(500).json({ message: 'Error deleting user' });
  }
};

const updateUserDeviceToken = async (req, res) => {
  const userId = req.user.userId;  // Assuming you get userId from JWT or session
  const newDeviceToken = req.body.deviceToken;  // Assuming you'll send `deviceToken` in request body
  
  try {
    // First, fetch the current device token to check if it has changed
    const [currentRows] = await pool.query(
      'SELECT deviceToken FROM users WHERE userId = ?',
      [userId]
    );
    
    const currentDeviceToken = currentRows.length > 0 ? currentRows[0].deviceToken : null;
    
    // If the new token is different from the current one, then update
    if (newDeviceToken !== currentDeviceToken) {
      await pool.query(
        'UPDATE users SET deviceToken = ? WHERE userId = ?',
        [newDeviceToken, userId]
      );

      res.json({ success: true, message: "Device token updated successfully." });
    } else {
      res.json({ success: true, message: "Device token unchanged, no update needed." });
    }

  } catch (error) {
    console.error('Error updating device token: ', error);
    res.status(500).json({ success: false, message: "Error updating device token.", error: error.message });
  }
};

const insertOrUpdateUserSetting = async (req, res) => {
  const userId = req.user.userId;
  
  // Assuming you'll send an array named `settings` in request body
  // Each entry should be of the form: { settingKey: 'some_key', settingValue: 'some_value', encrypt: true/false }
  const settings = req.body.settings || []; 

  let responseMessages = []; // Store feedback messages for each setting

  try {
    for (let setting of settings) {
      let settingValue = setting.settingValue;

      // Check if encryption flag is set and true for this setting
      if (setting.encrypt) {
        settingValue = encrypt(settingValue);
      }

      await pool.query(
        'INSERT INTO user_settings (userId, settingKey, settingValue) VALUES (?, ?, ?) ON DUPLICATE KEY UPDATE settingValue = ?',
        [userId, setting.settingKey, settingValue, settingValue]
      );

      responseMessages.push(`${setting.settingKey} Setting inserted or updated successfully.`);
    }

    res.json({ success: true, message: "User Settings Updated!" });

  } catch (error) {
    console.error('Error processing settings: ', error);
    res.status(500).json({ success: false, message: "Error processing settings.", error: error.message });
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
  insertOrUpdateUserSetting
};