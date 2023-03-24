const express = require('express');
const cors = require('cors');
const mysql = require('mysql');
const dotenv = require("dotenv");

dotenv.config();

const app = express();
app.use(express.json());
app.use(cors());

const PORT = process.env.PORT || 5050;

const db = mysql.createConnection({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
});

// Connect to the database
db.connect((err) => {
  if (err) {
    console.error('Error connecting to database: ', err);
    return;
  }
  console.log('Connected to database!');
});

// Get all users
app.get('/users', (req, res) => {
  db.query('SELECT * FROM Users', (err, results) => {
    if (err) {
      console.error('Error getting users: ', err);
      res.status(500).json({ error: 'Error getting users' });
      return;
    }
    res.json(results);
  });
});

// Get a specific user by ID
app.get('/users/:userId', (req, res) => {
  const userId = req.params.userId;
  db.query('SELECT * FROM Users WHERE UserId = ?', [userId], (err, results) => {
    if (err) {
      console.error('Error getting user: ', err);
      res.status(500).json({ error: 'Error getting user' });
      return;
    }
    if (results.length === 0) {
      res.status(404).json({ error: 'User not found' });
      return;
    }
    res.json(results[0]);
  });
});

// Get a specific user by email
app.get('/userByEmail/:email', (req, res) => {
    const email = req.params.email;
    db.query('SELECT * FROM Users WHERE Email = ? LIMIT 1', [email], (err, results) => {
      if (err) {
        console.error('Error getting user: ', err);
        res.status(500).json({ error: 'Error getting user' });
        return;
      }
      if (results.length === 0) {
        res.status(404).json({ error: 'User not found' });
        return;
      }
      res.json(results[0]);
    });
  });

// Create a new user
app.post('/users', (req, res) => {
  const { Name, Email, Active } = req.body;
  db.query('INSERT INTO Users (Name, Email, Active) VALUES (?, ?, ?)', [Name, Email, Active], (err, result) => {
    if (err) {
      console.error('Error creating user: ', err);
      res.status(500).json({ error: 'Error creating user' });
      return;
    }
    const newUserId = result.insertId;
    res.status(201).json({ UserId: newUserId, Name, Email, Active });
  });
});

// Update an existing user
app.put('/users/:userId', (req, res) => {
  const userId = req.params.userId;
  const { Name, Email, Active } = req.body;
  db.query('UPDATE Users SET Name = ?, Email = ?, Active = ? WHERE UserId = ?', [Name, Email, Active, userId], (err, result) => {
    if (err) {
      console.error('Error updating user: ', err);
      res.status(500).json({ error: 'Error updating user' });
      return;
    }
    if (result.affectedRows === 0) {
      res.status(404).json({ error: 'User not found' });
      return;
    }
    res.json({ UserId: userId, Name, Email, Active });
  });
});

// Delete a user
app.delete('/users/:userId', (req, res) => {
  const userId = req.params.userId;
  db.query('DELETE FROM Users WHERE UserId = ?', [userId], (err, result) => {
    if (err) {
      console.error('Error deleting user: ', err);
      res.status(500).json({ error: 'Error deleting user' });
      return;
    }
    if (result.affectedRows === 0) {
      res.status(404).json({ error: 'User not found' });
      return;
    }
    res.sendStatus(204);
  });
});

// Get all courses
app.get('/courses', (req, res) => {
  db.query('SELECT * FROM Courses', (err, results) => {
    if (err) {
      console.error('Error getting courses: ', err);
      res.status(500).json({ error: 'Error getting courses' });
      return;
    }
    res.json(results);
  });
});

// Get a specific course by ID
app.get('/courses/:courseId', (req, res) => {
  const courseId = req.params.courseId;
  db.query('SELECT * FROM Courses WHERE CourseId = ?', [courseId], (err, results) => {
    if (err) {
      console.error('Error getting course: ', err);
      res.status(500).json({ error: 'Error getting course' });
      return;
    }
    if (results.length === 0) {
      res.status(404).json({ error: 'Course not found' });
      return;
    }
    res.json(results[0]);
  });
});

// Create a new course
app.post('/courses', (req, res) => {
  const { CourseName, BookingClass, ScheduleId } = req.body;
  db.query('INSERT INTO Courses (CourseName, BookingClass, ScheduleId) VALUES (?, ?, ?)', [CourseName, BookingClass, ScheduleId], (err, result) => {
    if (err) {
      console.error('Error creating course: ', err);
      res.status(500).json({ error: 'Error creating course' });
      return;
    }
    const newCourseId = result.insertId;
    res.status(201).json({ CourseId: newCourseId, CourseName, BookingClass, ScheduleId });
  });
});

// Update an existing course
app.put('/courses/:courseId', (req, res) => {
  const courseId = req.params.courseId;
  const { CourseName, BookingClass, ScheduleId } = req.body;
  db.query('UPDATE Courses SET CourseName = ?, BookingClass = ?, ScheduleId = ? WHERE CourseId = ?', [CourseName, BookingClass, ScheduleId, courseId], (err, result) => {
    if (err) {
      console.error('Error updating course: ', err);
      res.status(500).json({ error: 'Error updating course' });
      return;
    }
    if (result.affectedRows === 0) {
      res.status(404).json({ error: 'Course not found' });
      return;
    }
    res.json({ CourseId: courseId, CourseName, BookingClass, ScheduleId });
  });
});

// Delete a course
app.delete('/courses/:courseId', (req, res) => {
  const courseId = req.params.courseId;
  db.query('DELETE FROM Courses WHERE CourseId = ?', [courseId], (err, result) => {
    if (err) {
      console.error('Error deleting course: ', err);
      res.status(500).json({ error: 'Error deleting course' });
      return;
    }
    if (result.affectedRows === 0) {
      res.status(404).json({ error: 'Course not found' });
      return;
    }
    res.sendStatus(204);
  });
});

// Get all timechecks
app.get('/timechecks', (req, res) => {
  db.query('SELECT * FROM Timechecks', (err, results) => {
    if (err) {
      console.error('Error getting timechecks: ', err);
      res.status(500).json({ error: 'Error getting timechecks' });
      return;
    }
    res.json(results);
  });
});

// Get a specific timecheck by ID
app.get('/timechecks/:timecheckId', (req, res) => {
  const timecheckId = req.params.timecheckId;
  db.query('SELECT * FROM Timechecks WHERE Id = ?', [timecheckId], (err, results) => {
    if (err) {
      console.error('Error getting timecheck: ', err);
      res.status(500).json({ error: 'Error getting timecheck' });
      return;
    }
    if (results.length === 0) {
      res.status(404).json({ error: 'Timecheck not found' });
      return;
    }
    res.json(results[0]);
  });
});

// Create a new timecheck
app.post('/timechecks', (req, res) => {
  const { UserId, DayOfWeek, StartTime, EndTime, CourseId, NumPlayers } = req.body;
  db.query('INSERT INTO Timechecks (UserId, DayOfWeek, StartTime, EndTime, CourseId, NumPlayers) VALUES (?, ?, ?, ?, ?, ?)', [UserId, DayOfWeek, StartTime, EndTime, CourseId, NumPlayers], (err, result) => {
    if (err) {
      console.error('Error creating timecheck: ', err);
      res.status(500).json({ error: 'Error creating timecheck' });
      return;
    }
    const newTimecheckId = result.insertId;
    res.status(201).json({ Id: newTimecheckId, UserId, DayOfWeek, StartTime, EndTime, CourseId, NumPlayers });
  });
});

// Update an existing timecheck
app.put('/timechecks/:timecheckId', (req, res) => {
  const timecheckId = req.params.timecheckId;
  const { UserId, DayOfWeek, StartTime, EndTime, CourseId, NumPlayers } = req.body;
  db.query('UPDATE Timechecks SET UserId = ?, DayOfWeek = ?, StartTime = ?, EndTime = ?, CourseId = ?, NumPlayers = ? WHERE Id = ?', [UserId, DayOfWeek, StartTime, EndTime, CourseId, NumPlayers, timecheckId], (err, result) => {
    if (err) {
      console.error('Error updating timecheck: ', err);
      res.status(500).json({ error: 'Error updating timecheck' });
      return;
    }
    if (result.affectedRows === 0) {
      res.status(404).json({ error: 'Timecheck not found' });
      return;
    }
    res.json({ Id: timecheckId, UserId, DayOfWeek, StartTime, EndTime, CourseId, NumPlayers });
  });
});

// Delete a timecheck
app.delete('/timechecks/:timecheckId', (req, res) => {
  const timecheckId = req.params.timecheckId;
  db.query('DELETE FROM Timechecks WHERE Id = ?', [timecheckId], (err, result) => {
    if (err) {
      console.error('Error deleting timecheck: ', err);
      res.status(500).json({ error: 'Error deleting timecheck' });
      return;
    }
    if (result.affectedRows === 0) {
      res.status(404).json({ error: 'Timecheck not found' });
      return;
    }
    res.sendStatus(204);
  });
});



//**********************CUSTOM QUERIES***********************/
// Get all timechecksby Userid
app.get('/timechecksByUserId/:userId', (req, res) => {
    const userId = req.params.userId;
    const q = `SELECT * FROM Timechecks t
                JOIN Users u ON t.UserId = u.UserId
                JOIN Courses c ON t.CourseID = c.CourseId
                WHERE u.UserId = ${userId}
                ORDER BY c.CourseName, t.DayOfWeek, t.StartTime;
                `
    db.query(q, (err, results) => {
      if (err) {
        console.error('Error getting timechecks: ', err);
        res.status(500).json({ error: 'Error getting timechecks' });
        return;
      }
      res.json(results);
    });
  });


app.listen(PORT, function() {
    console.log(`Tee Time Checker API Project at: ${PORT}!`);
});