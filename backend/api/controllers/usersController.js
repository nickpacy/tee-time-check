const pool = require('../database');

// Get all users
const getUsers = async (req, res) => {
    try {
      const rows = await pool.query('SELECT * FROM users');
      res.json(rows);
    } catch (error) {
      console.error('Error getting users: ', error);
      res.status(500).json({ error: 'Error getting users' });
    }
};

// Get user by UserId
const getUserById = async (req, res) => {
    const userId = req.params.userId;
    try {
        const rows = await pool.query('SELECT * FROM users WHERE UserId = ?', [userId]);
        if (rows.length === 0) {
            res.status(404).json({ error: 'User not found' });
        } else {
            res.json(rows[0]);
        }
    } catch (error) {
        console.error('Error getting user: ', error);
        res.status(500).json({ error: 'Error getting user' });
    }
};

// Get user by email
const getUserByEmail = async (req, res) => {
    const email = req.params.email;
    try {
        const rows = await pool.query('SELECT * FROM users WHERE Email = ? LIMIT 1', [email]);
        if (rows.length === 0) {
            res.status(404).json({ error: 'User not found' });
        } else {
            res.json(rows[0]);
        }
    } catch (error) {
        console.error('Error getting user: ', error);
        res.status(500).json({ error: 'Error getting user' });
    }
};

// Create a new user
const createUser = async (req, res) => {
    const { Name, Email, Active } = req.body;
    try {
      const [result] = await pool.query('INSERT INTO users (Name, Email, Active) VALUES (?, ?, ?)', [Name, Email, Active]);
      const newUserId = result.insertId;

      // Call the stored procedure to add inactive timechecks for the new user
      await pool.query('CALL AddTimechecksForNewUser(?)', [newUserId]);

      res.status(201).json({ UserId: newUserId, Name, Email, Active });
    } catch (error) {
      console.error('Error creating user: ', error);
      res.status(500).json({ error: 'Error creating user' });
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
      const result = await pool.query('UPDATE users SET Name = ?, Email = ?, Phone = ?, EmailNotification = ?, PhoneNotification = ?, Admin = ?, Active = ? WHERE UserId = ?', [Name, Email, Phone, EmailNotification, PhoneNotification, Admin, Active, userId]
      );
      if (result.affectedRows === 0) {
        res.status(404).json({ error: 'User not found' });
      } else {
        res.json({ UserId: userId, Name, Email, Phone, EmailNotification, PhoneNotification, Admin, Active});
      }
    } catch (error) {
      console.error('Error updating user: ', error);
      res.status(500).json({ error: 'Error updating user' });
    }
  };

// Delete an existing user
const deleteUser = async (req, res) => {
    const userId = req.params.userId;
    try {
      const result = await pool.query('DELETE FROM users WHERE UserId = ?', [userId]);
      if (result.affectedRows === 0) {
        res.status(404).json({ error: 'User not found' });
      } else {
        res.sendStatus(204);
      }
    } catch (error) {
      console.error('Error deleting user: ', error);
      res.status(500).json({ error: 'Error deleting user' });
    }
};

module.exports = {
  getUsers,
  getUserById,
  getUserByEmail,
  createUser,
  updateUser,
  deleteUser
};