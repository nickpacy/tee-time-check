const pool = require("../database");
const { NotFoundError, DatabaseError } = require("../middlewares/errorTypes");

// Get all courses
const getCourses = async (req, res, next) => {
  try {
    const rows = await pool.query("SELECT * FROM courses ORDER BY CourseName");
    res.json(rows);
  } catch (error) {
    next(new DatabaseError("Error getting courses", error));
  }
};

const getCoursesByUserOrder = async (req, res, next) => {
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
      query += "AND uc.Active = 1 ";
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
    next(new DatabaseError("Error getting courses by user order", error));
  }
};

const updateCourseOrder = async (req, res, next) => {
  const userId = req.user.userId;
  const reorderedCourses = req.body;

  try {
    for (let index = 0; index < reorderedCourses.length; index++) {
      const course = reorderedCourses[index];
      const courseId = course.CourseId;
      const isActive = course.Active;

      // Update SortOrder and Active flag for the course
      await pool.query(
        "UPDATE user_courses SET SortOrder = ?, Active = ? WHERE UserId = ? AND CourseId = ?",
        [index, isActive, userId, courseId]
      );

      // Update Active flag for corresponding timechecks if Active flag is set to false
      if (!isActive) {
        await pool.query(
          "UPDATE timechecks SET Active = ? WHERE UserId = ? AND CourseId = ?",
          [false, userId, courseId]
        );
      }
    }

    res.json({
      success: true,
      message: "Courses reordered and active flag updated successfully.",
    });
  } catch (error) {
    next(new DatabaseError("Error updating course order", error));
  }
};

// Get course by CourseId
const getCourseById = async (req, res, next) => {
  const courseId = req.params.courseId;
  try {
    const rows = await pool.query("SELECT * FROM courses WHERE CourseId = ?", [
      courseId,
    ]);
    if (rows.length === 0) {
      throw new NotFoundError("Course not found");
    }
    res.json(rows[0]);
  } catch (error) {
    next(error);
  }
};

// Create new course
const createCourse = async (req, res, next) => {
  const { CourseName, BookingClass, ScheduleId } = req.body;
  try {
    const result = await pool.query(
      "INSERT INTO Courses (CourseName, BookingClass, ScheduleId) VALUES (?, ?, ?)",
      [CourseName, BookingClass, ScheduleId]
    );
    const newCourseId = result.insertId;
    res
      .status(201)
      .json({ CourseId: newCourseId, CourseName, BookingClass, ScheduleId });
  } catch (error) {
    next(new DatabaseError("Error creating course", error));
  }
};

// Update existing course
const updateCourse = async (req, res, next) => {
  const courseId = req.params.courseId;
  const { CourseName, BookingClass, ScheduleId } = req.body;
  try {
    const result = await pool.query(
      "UPDATE Courses SET CourseName = ?, BookingClass = ?, ScheduleId = ? WHERE CourseId = ?",
      [CourseName, BookingClass, ScheduleId, courseId]
    );
    if (result.affectedRows === 0) {
      throw new NotFoundError("Course not found");
    } else {
      res.json({ CourseId: courseId, CourseName, BookingClass, ScheduleId });
    }
  } catch (error) {
    next(error);
  }
};

// Delete existing course
const deleteCourse = async (req, res, next) => {
  const courseId = req.params.courseId;
  try {
    const result = await pool.query("DELETE FROM courses WHERE CourseId = ?", [
      courseId,
    ]);
    if (result.affectedRows === 0) {
      throw new NotFoundError("Course not found");
    } else {
      res.sendStatus(204);
    }
  } catch (error) {
    next(new DatabaseError("Error deleting course", error));
  }
};

module.exports = {
  getCourses,
  getCoursesByUserOrder,
  updateCourseOrder,
  getCourseById,
  createCourse,
  updateCourse,
  deleteCourse,
};
