const pool = require('../database');

// Get all timechecks
const getTimechecks = async (req, res) => {
  try {
    const results = await pool.query('SELECT * FROM Timechecks');
    res.json(results);
  } catch (err) {
    console.error('Error getting timechecks: ', err);
    res.status(500).json({ error: 'Error getting timechecks' });
  }
};

// Get a specific timecheck by ID
const getTimecheckById = async (req, res) => {
  const timecheckId = req.params.timecheckId;
  try {
    const results = await pool.query('SELECT * FROM Timechecks WHERE Id = ?', [timecheckId]);
    if (results.length === 0) {
      res.status(404).json({ error: 'Timecheck not found' });
    } else {
      res.json(results[0]);
    }
  } catch (err) {
    console.error('Error getting timecheck: ', err);
    res.status(500).json({ error: 'Error getting timecheck' });
  }
};

// Create a new timecheck
const createTimecheck = async (req, res) => {
  const { UserId, DayOfWeek, StartTime, EndTime, CourseId, NumPlayers } = req.body;
  try {
    const result = await pool.query('INSERT INTO Timechecks (UserId, DayOfWeek, StartTime, EndTime, CourseId, NumPlayers) VALUES (?, ?, ?, ?, ?, ?)', [UserId, DayOfWeek, StartTime, EndTime, CourseId, NumPlayers]);
    const newTimecheckId = result.insertId;
    res.status(201).json({ Id: newTimecheckId, UserId, DayOfWeek, StartTime, EndTime, CourseId, NumPlayers });
  } catch (err) {
    console.error('Error creating timecheck: ', err);
    res.status(500).json({ error: 'Error creating timecheck' });
  }
};

// Update an existing timecheck
const updateTimecheck = async (req, res) => {
  const timecheckId = req.params.timecheckId;
  const { UserId, DayOfWeek, StartTime, EndTime, CourseId, NumPlayers, Active } = req.body;
  try {
    const result = await pool.query('UPDATE Timechecks SET UserId = ?, DayOfWeek = ?, StartTime = ?, EndTime = ?, CourseId = ?, NumPlayers = ?, Active = ? WHERE Id = ?', [UserId, DayOfWeek, StartTime, EndTime, CourseId, NumPlayers, Active, timecheckId]);
    if (result.affectedRows === 0) {
      res.status(404).json({ error: 'Timecheck not found' });
    } else {
      res.json({ Id: timecheckId, UserId, DayOfWeek, StartTime, EndTime, CourseId, NumPlayers, Active });
    }
  } catch (err) {
    console.error('Error updating timecheck: ', err);
    res.status(500).json({ error: 'Error updating timecheck' });
  }
};

// Update existing timechecks in bulk
const updateBulkTimechecks = async (req, res) => {
  const timechecks = req.body; // Assuming the request body contains an array of timechecks to update

  try {
    const promises = timechecks.map(async (timecheck) => {
      const { Id, UserId, DayOfWeek, StartTime, EndTime, CourseId, NumPlayers, Active } = timecheck;

      const result = await pool.query(
        'UPDATE Timechecks SET UserId = ?, DayOfWeek = ?, StartTime = ?, EndTime = ?, CourseId = ?, NumPlayers = ?, Active = ? WHERE Id = ?',
        [UserId, DayOfWeek, StartTime, EndTime, CourseId, NumPlayers, Active, Id]
      );

      if (result.affectedRows === 0) {
        return { Id, error: 'Timecheck not found' };
      } else {
        return { Id, success: true };
      }
    });

    const updatedTimechecks = await Promise.all(promises);
    res.json(updatedTimechecks);
  } catch (err) {
    console.error('Error updating timechecks: ', err);
    res.status(500).json({ error: 'Error updating timechecks' });
  }
};

// Delete a timecheck
const deleteTimecheck = async (req, res) => {
  const timecheckId = req.params.timecheckId;
  try {
    const result = await pool.query('DELETE FROM Timechecks WHERE Id = ?', [timecheckId]);
    if (result.affectedRows === 0) {
      res.status(404).json({ error: 'Timecheck not found' });
    } else {
      res.sendStatus(204);
    }
  } catch (err) {
    console.error('Error deleting timecheck: ', err);
    res.status(500).json({ error: 'Error deleting timecheck' });
  }
}

// Get a specific timecheck by ID
const getTimechecksByUserId = async (req, res) => {
  const userId = req.params.userId;
  const q = `SELECT t.*, c.*, u.name, u.email FROM Timechecks t
              JOIN Users u ON t.UserId = u.UserId
              JOIN Courses c ON t.CourseID = c.CourseId
              WHERE u.UserId = ?
              ORDER BY c.CourseName, CASE WHEN t.DayOfWeek = 0 THEN 7 ELSE t.DayOfWeek END, t.StartTime;
              `
  try {
    const results = await pool.query(q, [userId]);
    if (results.length === 0) {
      res.status(404).json({ error: 'No timechecks for user' });
    } else {
      res.json(results);
    }
  } catch (err) {
    console.error('Error getting timechecks: ', err);
    res.status(500).json({ error: 'Error getting timechecks' });
  }
};

// Get timechecks by UserId and CourseId
const getTimechecksByUserIdAndCourseId = async (req, res) => {
  const userId = req.params.userId;
  const courseId = req.params.courseId;
  try {
    const results = await pool.query('SELECT * FROM Timechecks WHERE UserId = ? AND CourseId = ? ORDER BY CASE WHEN DayOfWeek = 0 THEN 7 ELSE DayOfWeek END', [userId, courseId]);
    if (results.length === 0) {
      res.status(404).json({ error: 'No timechecks for user and course' });
    } else {
      res.json(results);
    }
  } catch (err) {
    console.error('Error getting timechecks: ', err);
    res.status(500).json({ error: 'Error getting timechecks' });
  }
};

module.exports = {
    getTimechecks,
    getTimecheckById,
    createTimecheck,
    updateTimecheck,
    updateBulkTimechecks,
    deleteTimecheck,
    getTimechecksByUserId,
    getTimechecksByUserIdAndCourseId
  };