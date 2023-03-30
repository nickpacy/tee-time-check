const pool = require('../database');
const dotenv = require('dotenv');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

dotenv.config();

// async function generateHash(password) {
//   return bcrypt.hashSync(password, bcrypt.genSaltSync(8), null);
// }

// async function validatePassword(password, hash) {
//   return bcrypt.compareSync(password, hash);
// }

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
    const result = await pool.query('INSERT INTO Users (Name, Email, Password) VALUES (?, ?, ?)', [Name, Email, hashedPassword]);
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
  const { Name, Password, Email } = req.body;

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
    const token = jwt.sign({ _id: userId }, process.env.JWT_TOKEN, { expiresIn: '1h' });

    // Return JWT in response header and body
    res.header('auth-token', token).send({ userId, token });

    // res.status(201).json({ CourseId: newCourseId, CourseName, BookingClass, ScheduleId });
  } catch (error) {
    console.error('Error creating course: ', error);
    res.status(500).json({ error: 'Error creating course' });
  }
};


// Logout


module.exports = {
  registerUser,
  loginUser
};