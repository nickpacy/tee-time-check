const pool = require('../database');

// Get all courses
const getCourses = async (req, res) => {
  try {
    const rows = await pool.query('SELECT * FROM courses');
    res.json(rows);
  } catch (error) {
    console.error('Error getting courses: ', error);
    res.status(500).json({ error: 'Error getting courses' });
  }
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
  getCourseById,
  createCourse,
  updateCourse,
  deleteCourse
};