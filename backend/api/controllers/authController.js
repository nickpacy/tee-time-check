const pool = require('../database');
const dotenv = require('dotenv');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const email = require('./emailController');

dotenv.config();


// Register a new user
const registerUser = async (req, res) => {
  const { Name, Password, Email } = req.body;

  // console.log(req.body);

  // Validate request body
  if (!Email || !Password) {
    return res.status(400).json({ message: 'Email and password are required.' });
  }

  // Check if user already exists
  const results = await pool.query('SELECT * FROM users WHERE Email = ?',[Email]);
  if (results.length) {
    return res.status(400).json({ message: 'User already exists.' });
  }

  // Hash password
  const salt = await bcrypt.genSalt(10);
  const hashedPassword = await bcrypt.hash(Password, salt);

  try {
    const result = await pool.query('INSERT INTO users (Name, Email, Password) VALUES (?, ?, ?)', [Name, Email, hashedPassword]);
    const userId = result.insertId;

    // Generate JWT
    const token = jwt.sign({ _id: userId }, process.env.JWT_TOKEN, { expiresIn: '1h' });

    // Return JWT in response header and body
    res.header('auth-token', token).send({ userId, token });

    // res.status(201).json({ message: { CourseId: newCourseId, CourseName, BookingClass, ScheduleId } });
  } catch (error) {
    console.error('Error creating course: ', error);
    res.status(500).json({ message: { error: 'Error creating course' } });
  }
};


// Login
const loginUser = async (req, res) => {
  const { Remember, Password, Email } = req.body;

  // console.log("req.body", req.body);

  // Validate request body
  if (!Email || !Password) {
    return res.status(400).json({ message: 'Email and password are required.' });
  }

  try {
    // Check if user already exists
    const results = await pool.query('SELECT * FROM users WHERE Email = ?',[Email]);
    if (!results.length) {
      console.log(`${Email} tried logging in`)
      return res.status(400).json({ message: 'Invalid username or password.' });
    }

    const user = results[0];
    const userId = results[0].UserId;

    // Check password
    const validPassword = await bcrypt.compare(
      Password,
      results[0].Password
    );
    if (!validPassword) {
      return res.status(400).json({ message: 'Invalid email or password.' });
    }

     // Update LastLoginDate
     const lastLoginDate = new Date();
     await pool.query('UPDATE users SET LastLoginDate = ? WHERE UserId = ?', [lastLoginDate, userId]); 

    // Generate JWT
    const token = jwt.sign({ userId: userId }, process.env.JWT_TOKEN, { expiresIn: Remember ? '365d' : '365d' });

    // Return JWT in response header and body
    const responseObject = {
      user: {
        UserId: user.UserId,
        Name: user.Name,
        Email: user.Email,
        Phone: user.Phone,
        EmailNotification: user.EmailNotification,
        PhoneNotification: user.PhoneNotification,
        Active: user.Active,
        Admin: user.Admin,
        LastLoginDate: user.LastLoginDate
      },
      token
    };
    
    console.log('Sending Response:', responseObject);
    res.header('auth-token', token).send(responseObject);

    // res.status(201).json({ message: { CourseId: newCourseId, CourseName, BookingClass, ScheduleId } });
  } catch (error) {
    console.error('Error logging in: ', error);
    res.status(500).json({ message: { error: 'Error logging in' } });
  }
};

// Change Password
const changePassword = async (req, res) => {
  const { UserId, OldPassword, NewPassword } = req.body;

  // Validate request body
  if (!UserId || !OldPassword || !NewPassword) {
    return res.status(400).json({ message: 'UserId, old password, and new password are required.' });
  }

  try {
    // Check if user exists and get their current hashed password from the database
    const results = await pool.query('SELECT * FROM users WHERE UserId = ?', [UserId]);

    if (!results.length) {
      return res.status(404).json({ message: 'User not found.' });
    }

    const user = results[0];

    console.log(user, OldPassword);
    // Check if the old password matches the stored hashed password
    const validPassword = await bcrypt.compare(OldPassword, user.Password);
    if (!validPassword) {
      return res.status(400).json({ message: 'Invalid old password.' });
    }

    // Hash the new password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(NewPassword, salt);

    // Update the user's password in the database
    await pool.query('UPDATE users SET Password = ? WHERE UserId = ?', [hashedPassword, UserId]);

    res.status(200).json({ message: 'Password changed successfully.' });
  } catch (error) {
    console.error('Error changing password: ', error);
    res.status(500).json({ message: 'Error changing password' });
  }
};

// Forgot Password
const forgotPassword = async (req, res) => {
  const { Email } = req.body;

  // Validate request body
  if (!Email) {
    return res.status(400).json({ message: 'Email is required.' });
  }

  try {
    // Check if the user exists
    const results = await pool.query('SELECT * FROM users WHERE Email = ?', [Email]);

    if (!results.length) {
      return res.status(404).json({ message: 'User not found.' });
    }

    const user = results[0];
    const mailOptions = {
      from: '"Password Reset" <donotreply@teetimecheck.com>',
      to: Email,
      subject: 'Forgot Password - Tee Time Check',
      template: 'forgotPassword.html'
    };
    await email.setAndSendPassword(user, mailOptions);

    res.status(200).json({ message: 'Password reset successful. Check your email for the new password.' });
  } catch (error) {
    console.error('Error resetting password: ', error);
    res.status(500).json({ message: 'Error resetting password' });
  }
};



module.exports = {
  registerUser,
  loginUser,
  forgotPassword,
  changePassword
};