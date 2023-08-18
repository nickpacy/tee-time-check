const pool = require('../database');

// Get all timechecks
const getTimechecks = async (req, res) => {
  try {
    const results = await pool.query('SELECT * FROM timechecks');
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
    const results = await pool.query('SELECT * FROM timechecks WHERE Id = ?', [timecheckId]);
    if (results.length === 0) {
      res.status(404).json({ error: 'Timecheck not found...' });
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
    const result = await pool.query('INSERT INTO timechecks (UserId, DayOfWeek, StartTime, EndTime, CourseId, NumPlayers) VALUES (?, ?, ?, ?, ?, ?)', [UserId, DayOfWeek, StartTime, EndTime, CourseId, NumPlayers]);
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
    const result = await pool.query('UPDATE timechecks SET UserId = ?, DayOfWeek = ?, StartTime = ?, EndTime = ?, CourseId = ?, NumPlayers = ?, Active = ? WHERE Id = ?', [UserId, DayOfWeek, StartTime, EndTime, CourseId, NumPlayers, Active, timecheckId]);
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
        'UPDATE timechecks SET UserId = ?, DayOfWeek = ?, StartTime = ?, EndTime = ?, CourseId = ?, NumPlayers = ?, Active = ? WHERE Id = ?',
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
    const result = await pool.query('DELETE FROM timechecks WHERE Id = ?', [timecheckId]);
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
  const userId = req.user.userId;
  const q = `SELECT t.*, c.CourseName, u.name, u.email FROM timechecks t
              JOIN users u ON t.UserId = u.UserId
              JOIN courses c ON t.CourseID = c.CourseId
              JOIN user_courses uc ON u.UserId = uc.UserId AND c.CourseId = uc.CourseId
              WHERE u.UserId = ? AND uc.Active = 1
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

// Get all the timechecks from the application
const getAllUsersActiveTimechecks = async (req, res) => {
  // This query fetches active timechecks and their associated users
  const q = `
        SELECT DISTINCT  t.*, c.CourseName, c.ImageUrl, u.UserId, u.Name, u.Email 
        FROM users u
        INNER JOIN user_courses uc ON u.UserId = uc.UserId
        INNER JOIN timechecks t ON t.UserId = u.UserId
        INNER JOIN courses c ON t.CourseID = c.CourseId AND c.CourseId = uc.CourseId
        WHERE t.Active = 1 AND c.Active = 1 AND u.Active = 1 AND uc.Active = 1
  `;
  try {
    const results = await pool.query(q);
    if (results.length === 0) {
      res.status(404).json({ error: 'No active timechecks found' });
      return;
    }

    // Transforming the flat SQL result set into nested objects
    const usersMap = {};
    results.forEach(row => {
      if (!usersMap[row.UserId]) {
        usersMap[row.UserId] = {
          userId: row.UserId,
          name: row.Name,
          email: row.Email,
          timechecks: []
        };
      }
      usersMap[row.UserId].timechecks.push({
        timecheckId: row.TimecheckId, // Assuming there's a TimecheckId column
        courseId: row.CourseId,
        courseName: row.CourseName,
        imageUrl: row.ImageUrl,
        dayOfWeek: row.DayOfWeek,
        startTime: row.StartTime,
        endTime: row.EndTime,
        numPlayers: row.NumPlayers
      });
    });

    // Converting the usersMap object into an array
    const usersArray = Object.values(usersMap);
    
    res.json(usersArray);

  } catch (err) {
    console.error('Error getting active timechecks: ', err);
    res.status(500).json({ error: 'Error getting active timechecks' });
  }
};


// Get count of active timechecks by UserId
const getActiveTimecheckCountByUserId = async (req, res) => {
  const userId = req.user.userId;

  const q = `SELECT 
              COUNT(*) as activeTimechecksCount
              , COUNT(DISTINCT c.CourseId) AS activeCourseCount
             FROM timechecks t
             JOIN users u ON t.UserId = u.UserId
             JOIN courses c ON t.CourseId = c.CourseId
             WHERE u.UserId = ? AND t.Active = 1 AND c.Active = 1
            `
  try {
    const results = await pool.query(q, [userId]);
    if (results.length === 0) {
      res.status(404).json({ error: 'No active timechecks for user' });
    } else {
      const stats = {
        activeTimechecksCount: results[0].activeTimechecksCount,
        activeCourseCount: results[0].activeCourseCount
      }
      res.json(stats);
    }
  } catch (err) {
    console.error('Error getting active timecheck count: ', err);
    res.status(500).json({ error: 'Error getting active timecheck count' });
  }
};

// Get timechecks by UserId and CourseId
const getTimechecksByUserIdAndCourseId = async (req, res) => {
  const userId = req.user.userId;
  const courseId = req.params.courseId;
  try {
    const results = await pool.query('SELECT * FROM timechecks WHERE UserId = ? AND CourseId = ? ORDER BY CASE WHEN DayOfWeek = 0 THEN 7 ELSE DayOfWeek END', [userId, courseId]);
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


const getTimechecksByCourse = async (req, res) => {
  const userId = req.user.userId;

  try {
    // Call getCourses to get all courses
    const courses = await pool.query('SELECT DISTINCT * FROM courses c JOIN user_courses uc ON c.CourseId = uc.CourseId WHERE uc.UserId = ? AND uc.Active = 1 ORDER BY uc.SortOrder', [userId]);

    // For each course, call getTimechecksByUserIdAndCourseId to get its timechecks
    const promises = courses.map(async (course) => {
      const timechecks = await pool.query('SELECT t.* FROM timechecks t WHERE t.UserId = ? AND t.CourseId = ? ORDER BY DayOfWeek', [userId, course.CourseId]);
      course.Timechecks = timechecks; // Add timechecks as a new property to the course object
      return course;
    });

    // Wait for all promises to resolve
    const coursesWithTimechecks = await Promise.all(promises);

    // Send the result back to the client
    res.json(coursesWithTimechecks);
  } catch (error) {
    console.error('Error getting courses with timechecks: ', error);
    res.status(500).json({ error: 'Error getting courses with timechecks' });
  }
};


// Reset all timechecks for a specific user
const resetTimechecks = async (req, res) => {
  const userId = req.user.userId;
  try {
    const result = await pool.query('UPDATE timechecks SET Active = false WHERE UserId = ?', [userId]);
    if (result.affectedRows === 0) {
      res.status(404).json({ error: 'No timechecks found for user to reset' });
    } else {
      res.json({ success: 'Successfully reset all timechecks for user' });
    }
  } catch (err) {
    console.error('Error resetting timechecks: ', err);
    res.status(500).json({ error: 'Error resetting timechecks' });
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
    getTimechecksByUserIdAndCourseId,
    getActiveTimecheckCountByUserId,
    getAllUsersActiveTimechecks,
    getTimechecksByCourse,
    resetTimechecks
  };