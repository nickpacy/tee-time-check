const pool = require('../database');
const dotenv = require('dotenv');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const nodemailer = require("nodemailer"); 
const fs = require('fs').promises;
const crypto = require('crypto');

dotenv.config();

// Create a transporter for sending emails
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST, // SMTP host for sending emails
  port: process.env.SMTP_PORT, // SMTP port for sending emails
  secure: true, // Use SSL/TLS for secure connection
  auth: {
    user: process.env.SMTP_USER, // SMTP username
    pass: process.env.SMTP_PASSWORD, // SMTP password
  },
});


const generateRandomPassword = (length = 12) => {
  const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*()-_=+';
  const buffer = crypto.randomBytes(length);
  const passwordArray = [];

  for (let i = 0; i < length; i++) {
    passwordArray.push(characters[buffer[i] % characters.length]);
  }

  return passwordArray.join('');
};


// Register a new user
const registerUser = async (req, res) => {
  const { Name, Password, Email } = req.body;

  console.log(req.body);

  // Validate request body
  if (!Email || !Password) {
    return res.status(400).send('Email and password are required.');
  }

  // Check if user already exists
  const results = await pool.query('SELECT * FROM users WHERE Email = ?',[Email]);
  if (results.length) {
    return res.status(400).send('User already exists.');
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

    // res.status(201).json({ CourseId: newCourseId, CourseName, BookingClass, ScheduleId });
  } catch (error) {
    console.error('Error creating course: ', error);
    res.status(500).json({ error: 'Error creating course' });
  }
};


// Login
const loginUser = async (req, res) => {
  const { Remember, Password, Email } = req.body;

  console.log(req.body);

  // Validate request body
  if (!Email || !Password) {
    return res.status(400).send('Email and password are required.');
  }

  try {
    // Check if user already exists
    const results = await pool.query('SELECT * FROM users WHERE Email = ?',[Email]);
    if (!results.length) {
      return res.status(400).send('Invalid username or password.');
    }

    const user = results[0];
    const userId = results[0].UserId;

    // Check password
    const validPassword = await bcrypt.compare(
      Password,
      results[0].Password
    );
    if (!validPassword) {
      return res.status(400).send('Invalid email or password.');
    }

    // Generate JWT
    const token = jwt.sign({ _id: userId }, process.env.JWT_TOKEN, { expiresIn: Remember ? '365d' : '1h' });

    // Return JWT in response header and body
    res.header('auth-token', token).send({ 
      user: {
        UserId: user.UserId,
        Name: user.Name,
        Email: user.Email,
        Phone: user.Phone,
        EmailNotification: user.EmailNotification,
        PhoneNotification: user.PhoneNotification,
        Active: user.Active,
        Admin: user.Admin,
      }
      , token 
    });

    // res.status(201).json({ CourseId: newCourseId, CourseName, BookingClass, ScheduleId });
  } catch (error) {
    console.error('Error creating course: ', error);
    res.status(500).json({ error: 'Error creating course' });
  }
};

// Change Password
const changePassword = async (req, res) => {
  const { UserId, OldPassword, NewPassword } = req.body;

  // Validate request body
  if (!UserId || !OldPassword || !NewPassword) {
    return res.status(400).send('UserId, old password, and new password are required.');
  }

  try {
    // Check if user exists and get their current hashed password from the database
    const results = await pool.query('SELECT * FROM users WHERE UserId = ?', [UserId]);

    if (!results.length) {
      return res.status(404).send('User not found.');
    }

    const user = results[0];

    console.log(user, OldPassword);
    // Check if the old password matches the stored hashed password
    const validPassword = await bcrypt.compare(OldPassword, user.Password);
    if (!validPassword) {
      return res.status(400).send('Invalid old password.');
    }

    // Hash the new password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(NewPassword, salt);

    // Update the user's password in the database
    await pool.query('UPDATE users SET Password = ? WHERE UserId = ?', [hashedPassword, UserId]);

    res.status(200).send('Password changed successfully.');
  } catch (error) {
    console.error('Error changing password: ', error);
    res.status(500).send('Error changing password');
  }
};

// Forgot Password
const forgotPassword = async (req, res) => {
  const { Email } = req.body;

  // Validate request body
  if (!Email) {
    return res.status(400).send('Email is required.');
  }

  try {
    // Check if the user exists
    const results = await pool.query('SELECT * FROM users WHERE Email = ?', [Email]);

    if (!results.length) {
      return res.status(404).send('User not found.');
    }

    const user = results[0];

    // Generate a random password
    const randomPassword = generateRandomPassword(); // You can adjust the length as needed

    // Hash the new password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(randomPassword, salt);

    // Update the user's password in the database
    await pool.query('UPDATE users SET Password = ? WHERE Email = ?', [hashedPassword, Email]);

    try {
      // Read the HTML template from the file
      let htmlTemplate = await fs.readFile('./assets/forgotPassword.html', 'utf8');
      htmlTemplate = htmlTemplate.replace('[User]', user.Name);
      htmlTemplate = htmlTemplate.replace('[GeneratedPassword]', randomPassword);
  
      const mailOptions = {
        from: '"Password Reset" <donotreply@teetimecheck.com>',
        to: Email,
        subject: 'Forgot Password - Tee Time Check',
        html: htmlTemplate
      };
  
      // Send the Email
      const info = await transporter.sendMail(mailOptions);
      console.log('Email sent: ', info.messageId);
    } catch (error) {
      console.error('Error sending email: ', error);
    }


    res.status(200).send('Password reset successful. Check your email for the new password.');
  } catch (error) {
    console.error('Error resetting password: ', error);
    res.status(500).send('Error resetting password');
  }
};



module.exports = {
  registerUser,
  loginUser,
  forgotPassword,
  changePassword
};