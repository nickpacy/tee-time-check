const pool = require('../database');
const {
  NotFoundError,
  InternalError,
} = require("../middlewares/errorTypes");

// Get all timechecks
const getTimechecks = async (req, res, next) => {
  try {
    const results = await pool.query('SELECT * FROM timechecks');
    res.json(results);
  } catch (err) {
    next(new InternalError("Error getting users", err));
  }
};

// Get a specific timecheck by ID
const getTimecheckById = async (req, res, next) => {
  const timecheckId = req.params.timecheckId;
  try {
    const results = await pool.query('SELECT * FROM timechecks WHERE Id = ?', [timecheckId]);
    if (results.length === 0) {
      next(new NotFoundError("Timecheck not found"));
    } else {
      res.json(results[0]);
    }
  } catch (err) {
    next(new InternalError("Error getting timechecks", err));
  }
};

// Create a new timecheck
const createTimecheck = async (req, res, next) => {
  const { UserId, DayOfWeek, StartTime, EndTime, CourseId, NumPlayers } = req.body;
  try {
    const result = await pool.query('INSERT INTO timechecks (UserId, DayOfWeek, StartTime, EndTime, CourseId, NumPlayers) VALUES (?, ?, ?, ?, ?, ?)', [UserId, DayOfWeek, StartTime, EndTime, CourseId, NumPlayers]);
    const newTimecheckId = result.insertId;
    res.status(201).json({ Id: newTimecheckId, UserId, DayOfWeek, StartTime, EndTime, CourseId, NumPlayers });
  } catch (err) {
    next(new InternalError("Error creating timechecks", err));
  }
};

// Update an existing timecheck
const updateTimecheck = async (req, res, next) => {
  const timecheckId = req.params.timecheckId;
  const { UserId, DayOfWeek, StartTime, EndTime, CourseId, NumPlayers, Active } = req.body;
  try {
    const result = await pool.query('UPDATE timechecks SET UserId = ?, DayOfWeek = ?, StartTime = ?, EndTime = ?, CourseId = ?, NumPlayers = ?, Active = ? WHERE Id = ?', [UserId, DayOfWeek, StartTime, EndTime, CourseId, NumPlayers, Active, timecheckId]);
    if (result.affectedRows === 0) {
      next(new NotFoundError("Timecheck not found"));
    } else {
      res.json({ Id: timecheckId, UserId, DayOfWeek, StartTime, EndTime, CourseId, NumPlayers, Active });
    }
  } catch (err) {
    next(new InternalError("Error updating timechecks", err));
  }
};

// Update existing timechecks in bulk
const updateBulkTimechecks = async (req, res, next) => {
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
    next(new InternalError("Error updating timechecks", err));
  }
};

// Delete a timecheck
const deleteTimecheck = async (req, res, next) => {
  const timecheckId = req.params.timecheckId;
  try {
    const result = await pool.query('DELETE FROM timechecks WHERE Id = ?', [timecheckId]);
    if (result.affectedRows === 0) {
      next(new NotFoundError("Timecheck not found"));
    } else {
      res.sendStatus(204);
    }
  } catch (err) {
    next(new InternalError("Error updating timechecks", err));
  }
}

// Get a specific timecheck by ID
const getTimechecksByUserId = async (req, res, next) => {
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
      res.json([]);
    } else {
      res.json(results);
    }
  } catch (err) {
    next(new InternalError("Error getting timechecks", err));
  }
};

// Get all the timechecks from the application
const getAllUsersActiveTimechecks = async (req, res, next) => {
  // This query fetches active timechecks and their associated users
  const q = `
        SELECT DISTINCT  t.*, c.CourseName, c.ImageUrl, c.CourseImage, u.UserId, u.Name, u.Email 
        FROM users u
        INNER JOIN user_courses uc ON u.UserId = uc.UserId
        INNER JOIN timechecks t ON t.UserId = u.UserId
        INNER JOIN courses c ON t.CourseID = c.CourseId AND c.CourseId = uc.CourseId
        WHERE t.Active = 1 AND c.Active = 1 AND u.Active = 1 AND uc.Active = 1
  `;
  try {
    const results = await pool.query(q);
    if (results.length === 0) {
      res.json([]);
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
        timecheckId: row.Id,
        userId: row.UserId,
        courseId: row.CourseId,
        courseName: row.CourseName,
        imageUrl: row.ImageUrl,
        courseImage: row.CourseImage,
        dayOfWeek: row.DayOfWeek,
        startTime: row.StartTime,
        endTime: row.EndTime,
        numPlayers: row.NumPlayers,
        active: row.Active
      });    
    });


    // Converting the usersMap object into an array
    const usersArray = Object.values(usersMap);

    res.json(usersArray);

  } catch (err) {
    next(new InternalError("Error getting active timechecks", err));
  }
};


// Get count of active timechecks by UserId
const getActiveTimecheckCountByUserId = async (req, res, next) => {
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
      res.json([]);
    } else {
      const stats = {
        activeTimechecksCount: results[0].activeTimechecksCount,
        activeCourseCount: results[0].activeCourseCount
      }
      res.json(stats);
    }
  } catch (err) {
    next(new InternalError("Error getting active timecheck counts.", err));
  }
};

// Get timechecks by UserId and CourseId
const getTimechecksByUserIdAndCourseId = async (req, res, next) => {
  const userId = req.user.userId;
  const courseId = req.params.courseId;
  try {
    const results = await pool.query('SELECT * FROM timechecks WHERE UserId = ? AND CourseId = ? ORDER BY CASE WHEN DayOfWeek = 0 THEN 7 ELSE DayOfWeek END', [userId, courseId]);
    if (results.length === 0) {
      res.json([]);
    } else {
      res.json(results);
    }
  } catch (err) {
    next(new InternalError("Error getting timechecks.", err));
  }
};


const getTimechecksByCourse = async (req, res, next) => {
  const userId = req.user.userId;

  updateLastLoginDate(userId);

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
    next(new InternalError("Error getting courses with timechecks", err));
  }
};

const getTimechecksByDayofWeek = async (req, res, next) => {
  const userId = req.user.userId;

  updateLastLoginDate(userId);

  try {
    // Call getCourses to get all courses
    const daysOfWeek = [
      { id: 0, name: 'Sunday', shortName: 'Sun' },
      { id: 1, name: 'Monday', shortName: 'Mon' },
      { id: 2, name: 'Tuesday', shortName: 'Tue' },
      { id: 3, name: 'Wednesday', shortName: 'Wed' },
      { id: 4, name: 'Thursday', shortName: 'Thu' },
      { id: 5, name: 'Friday', shortName: 'Fri' },
      { id: 6, name: 'Saturday', shortName: 'Sat' }
    ];

    // For each course, call getTimechecksByUserIdAndCourseId to get its timechecks
    const promises = daysOfWeek.map(async (day) => {
      const timechecks = await pool.query('SELECT t.* FROM timechecks t JOIN user_courses uc ON t.CourseId = uc.CourseId AND t.UserId = uc.UserId WHERE t.UserId = ? AND uc.Active = 1 AND t.DayOfWeek = ?', [userId, day.id]);
      day.Timechecks = timechecks; // Add timechecks as a new property to the course object
      return day;
    });

    // Wait for all promises to resolve
    const daysWithTimechecks = await Promise.all(promises);

    // Send the result back to the client
    res.json(daysWithTimechecks);
  } catch (error) {
    next(new InternalError("Error getting courses with timechecks.", err));
  }
};


// Reset all timechecks for a specific user
const resetTimechecks = async (req, res, next) => {
  const userId = req.user.userId;
  try {
    const result = await pool.query('UPDATE timechecks SET Active = false WHERE UserId = ?', [userId]);
    if (result.affectedRows === 0) {
      res.json([]);
    } else {
      res.json({ success: 'Successfully reset all timechecks for user' });
    }
  } catch (err) {
    next(new InternalError("Error resetting timechecks", err));
  }
};

const updateLastLoginDate = async (userId) => {
  try {
    const currentDate = new Date().toISOString().slice(0, 19).replace('T', ' '); // Format to MySQL datetime
    
    await pool.query(
      'UPDATE users SET lastLoginDate = ? WHERE userId = ?',
      [currentDate, userId]
    );

    // console.log(`Last login date updated successfully for userId: ${userId}`);
  } catch (error) {
    next(new InternalError("Error updating last login", err));
  }
};


const setTimecheckInactive = async (req, res, next) => {
  const timecheckId = req.body.timecheckId;

  try {
    const result = await pool.query('UPDATE timechecks SET Active = ? WHERE Id = ?', [false, timecheckId]);

    if (result.affectedRows === 0) {
      throw new NotFoundError("Timecheck not found");
    } else {
      res.json({ message: `Timecheck with ID: ${timecheckId} is now inactive` });
    }
  } catch (err) {
    next(new InternalError("Error setting timecheck to active", err));
  }
};

const getTimecheckSummary = async (req, res, next) => {
  try {
    // Define the days of the week
    const daysOfWeek = [
      { id: 1, name: 'Monday', shortName: 'Mon' },
      { id: 2, name: 'Tuesday', shortName: 'Tue' },
      { id: 3, name: 'Wednesday', shortName: 'Wed' },
      { id: 4, name: 'Thursday', shortName: 'Thu' },
      { id: 5, name: 'Friday', shortName: 'Fri' },
      { id: 6, name: 'Saturday', shortName: 'Sat' },
      { id: 0, name: 'Sunday', shortName: 'Sun' },
    ];

    // Query to get the summary of timechecks
    const query = `
      SELECT 
        t.CourseId,
        c.CourseName,
        COUNT(CASE WHEN t.DayOfWeek = 0 THEN 1 END) AS Sunday,
        COUNT(CASE WHEN t.DayOfWeek = 1 THEN 1 END) AS Monday,
        COUNT(CASE WHEN t.DayOfWeek = 2 THEN 1 END) AS Tuesday,
        COUNT(CASE WHEN t.DayOfWeek = 3 THEN 1 END) AS Wednesday,
        COUNT(CASE WHEN t.DayOfWeek = 4 THEN 1 END) AS Thursday,
        COUNT(CASE WHEN t.DayOfWeek = 5 THEN 1 END) AS Friday,
        COUNT(CASE WHEN t.DayOfWeek = 6 THEN 1 END) AS Saturday,
        COUNT(*) AS Total
      FROM 
        timechecks t
      JOIN
        courses c ON t.CourseId = c.CourseId
      WHERE 
        t.Active = 1
      GROUP BY 
        t.CourseId, c.CourseName
      ORDER BY 
        Total DESC, c.CourseName;
    `;

    // Execute the query
    const results = await pool.query(query);

    // Format the result to match the expected structure
    const formattedResults = results.map(row => ({
      courseId: row.CourseId,
      courseName: row.CourseName,
      monday: row.Monday,
      tuesday: row.Tuesday,
      wednesday: row.Wednesday,
      thursday: row.Thursday,
      friday: row.Friday,
      saturday: row.Saturday,
      sunday: row.Sunday,
      total: row.Total,
    }));

    // Send the result back to the client
    res.json(formattedResults);
  } catch (error) {
    next(new InternalError("Error getting timecheck summary.", error));
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
    getTimechecksByDayofWeek,
    resetTimechecks,
    setTimecheckInactive,
    getTimecheckSummary
  };