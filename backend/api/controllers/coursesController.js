const pool = require('../database');
const util = require('util');

// Get all courses
const getCourses = async (req, res) => {
  try {
    const rows = await pool.query('SELECT * FROM courses ORDER BY CourseName');
    res.json(rows);
  } catch (error) {
    console.error('Error getting courses: ', error);
    res.status(500).json({ error: 'Error getting courses' });
  }
};

const getCoursesByUserOrder = async (req, res) => {
  const userId = req.user.userId;
  const all = req.body.all;

  try {
      let query = `
          SELECT c.*, IFNULL(uc.Active, 1) AS Active
          FROM courses c
          LEFT JOIN user_courses uc ON c.CourseId = uc.CourseId AND uc.UserId = ?
          WHERE (uc.UserId IS NOT NULL OR (uc.UserId IS NULL AND NOT EXISTS (SELECT 1 FROM user_courses WHERE UserId = ?)))
      `;

      if (!all) {
          query += 'AND uc.Active = 1 ';
      }

      query += `
          ORDER BY 
              CASE WHEN uc.SortOrder IS NULL THEN 1 ELSE 0 END, 
              uc.SortOrder, 
              c.CourseName    
      `;

      const rows = await pool.query(query, [userId, userId]);
      res.json(rows);
  } catch (error) {
      console.error('Error getting courses by user order: ', error);
      res.status(500).json({ error: 'Error getting courses by user order' });
  }
};


const updateCourseOrder = async (req, res) => {
  const userId = req.user.userId;
  const reorderedCourses = req.body;

  try {
      const updatePromises = reorderedCourses.map(async (course, index) => {
          const courseId = course.CourseId;
          const isActive = course.Active;
          
          // Update SortOrder and Active flag for the course
          await pool.query(
              'UPDATE user_courses SET SortOrder = ?, Active = ? WHERE UserId = ? AND CourseId = ?',
              [index, isActive, userId, courseId]
          );

          // Update Active flag for corresponding timechecks if Active flag is set to false
          if (!isActive) {
            await pool.query(
                'UPDATE timechecks SET Active = ? WHERE UserId = ? AND CourseId = ?',
                [false, userId, courseId]
            );
        }
      });

      // Execute all update queries in parallel
      await Promise.all(updatePromises);

      res.json({ success: true, message: "Courses reordered and active flag updated successfully." });

  } catch (error) {
      console.error('Error updating course order: ', error);
      res.status(500).json({ success: false, message: "Error updating course order.", error: error.message });
  }
};

module.exports = {
  updateCourseOrder
};


// Get course by CourseId
const getCourseById = async (req, res) => {
  const courseId = req.params.courseId;
  try {
    const rows = await pool.query('SELECT * FROM courses WHERE CourseId = ?', [courseId]);
    if (rows.length === 0) {
      res.status(404).json({ error: 'Course not found' });
    } else {
      res.json(rows[0]);
    }
  } catch (error) {
    console.error('Error getting course: ', error);
    res.status(500).json({ error: 'Error getting course' });
  }
};

// Create new course
const createCourse = async (req, res) => {
  const { CourseName, BookingClass, ScheduleId } = req.body;
  try {
    const result = await pool.query('INSERT INTO Courses (CourseName, BookingClass, ScheduleId) VALUES (?, ?, ?)', [CourseName, BookingClass, ScheduleId]);
    const newCourseId = result.insertId;
    res.status(201).json({ CourseId: newCourseId, CourseName, BookingClass, ScheduleId });
  } catch (error) {
    console.error('Error creating course: ', error);
    res.status(500).json({ error: 'Error creating course' });
  }
};

// Update existing course
const updateCourse = async (req, res) => {
  const courseId = req.params.courseId;
  const { CourseName, BookingClass, ScheduleId } = req.body;
  try {
    const result = await pool.query('UPDATE Courses SET CourseName = ?, BookingClass = ?, ScheduleId = ? WHERE CourseId = ?', [CourseName, BookingClass, ScheduleId, courseId]);
    if (result.affectedRows === 0) {
      res.status(404).json({ error: 'Course not found' });
    } else {
      res.json({ CourseId: courseId, CourseName, BookingClass, ScheduleId });
    }
  } catch (error) {
    console.error('Error updating course: ', error);
    res.status(500).json({ error: 'Error updating course' });
  }
};

// Delete existing course
const deleteCourse = async (req, res) => {
  const courseId = req.params.courseId;
  try {
    const result = await pool.query('DELETE FROM courses WHERE CourseId = ?', [courseId]);
    if (result.affectedRows === 0) {
      res.status(404).json({ error: 'Course not found' });
    } else {
      res.sendStatus(204);
    }
  } catch (error) {
    console.error('Error deleting course: ', error);
    res.status(500).json({ error: 'Error deleting course' });
  }
};

module.exports = {
  getCourses,
  getCoursesByUserOrder,
  updateCourseOrder,
  getCourseById,
  createCourse,
  updateCourse,
  deleteCourse
};