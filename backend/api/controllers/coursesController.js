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
      INNER JOIN user_courses uc ON c.CourseId = uc.CourseId AND uc.UserId = ?
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
  const {
    CourseName,
    CourseAbbr,
    BookingClass,
    BookingPrefix,
    ScheduleId,
    Method,
    CourseImage,
    ImageUrl,
    WebsiteId,
    BookingUrl,
    Latitude,
    Longitude,
    TimeZone
  } = req.body;
  try {
    const result = await pool.query(
      "INSERT INTO Courses (CourseName, CourseAbbr, BookingClass, BookingPrefix, ScheduleId, Method, CourseImage, ImageUrl, WebsiteId, BookingUrl, Latitude, Longitude, TimeZone, Active) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1)",
      [CourseName, CourseAbbr, BookingClass, BookingPrefix, ScheduleId, Method, CourseImage, ImageUrl, WebsiteId, BookingUrl, Latitude, Longitude, TimeZone]
    );
    const newCourseId = result.insertId;
    res.status(201).json({
      CourseId: newCourseId,
      CourseName,
      CourseAbbr,
      BookingClass,
      BookingPrefix,
      ScheduleId,
      Method,
      CourseImage,
      ImageUrl,
      WebsiteId,
      BookingUrl,
      Latitude,
      Longitude,
      TimeZone
    });
  } catch (error) {
    next(new DatabaseError("Error creating course", error));
  }
};


// Update existing course
const updateCourse = async (req, res, next) => {
  const courseId = req.params.courseId;
  const {
    CourseName,
    CourseAbbr,
    BookingClass,
    BookingPrefix,
    ScheduleId,
    Method,
    CourseImage,
    ImageUrl,
    WebsiteId,
    BookingUrl,
    Latitude,
    Longitude,
    TimeZone
  } = req.body;
  try {
    const result = await pool.query(
      "UPDATE Courses SET CourseName = ?, CourseAbbr = ?, BookingClass = ?, BookingPrefix = ?, ScheduleId = ?, Method = ?, CourseImage = ?, ImageUrl = ?, WebsiteId = ?, BookingUrl = ?, Latitude = ?, Longitude = ?, TimeZone = ? WHERE CourseId = ?",
      [CourseName, CourseAbbr, BookingClass, BookingPrefix, ScheduleId, Method, CourseImage, ImageUrl, WebsiteId, BookingUrl, Latitude, Longitude, TimeZone, courseId]
    );
    if (result.affectedRows === 0) {
      throw new NotFoundError("Course not found");
    } else {
      res.json({
        CourseId: courseId,
        CourseName,
        CourseAbbr,
        BookingClass,
        BookingPrefix,
        ScheduleId,
        Method,
        CourseImage,
        ImageUrl,
        WebsiteId,
        BookingUrl,
        Latitude,
        Longitude,
        TimeZone
      });
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

const getCoursesByDistance = async (req, res, next) => {
  const userId = req.user.userId;
  const radius = parseFloat(req.query.radius); // Radius in meters

  if (isNaN(radius)) {
    return res.status(400).json({ error: 'Invalid radius' });
  }

  try {
    // First, get user's latitude and longitude
    const userLocation = await pool.query(
      "SELECT Latitude, Longitude FROM users WHERE UserId = ?", [userId]
    );

    if (userLocation.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    const { Latitude: userLatitude, Longitude: userLongitude } = userLocation[0];

    // Next, get courses within the radius of the user's location
    const query = `
      SELECT 
        c.*,
        CASE WHEN uc.CourseId IS NOT NULL THEN 1 ELSE 0 END AS UserCourseEnabled,
        uc.Active AS UserCourseActive,
        uc.SortOrder,
        ST_Distance_Sphere(
          point(c.Longitude, c.Latitude),
          point(?, ?)
        ) AS Distance
      FROM courses c
      LEFT JOIN user_courses uc ON c.CourseId = uc.CourseId AND uc.UserId = ?
      HAVING distance < ?
      ORDER BY distance, uc.SortOrder;
    `;

    const rows = await pool.query(query, [userLongitude, userLatitude, userId, radius]);
    res.json(rows);
  } catch (error) {
    next(new DatabaseError("Error getting courses by distance", error));
  }
};

const addUserCourse = async (req, res, next) => {
  const userId = req.user.userId;
  const courseId = req.body.courseId;

  if (!courseId) {
    return res.status(400).json({ error: 'Course ID is required' });
  }

  try {
    // Find the highest current sort order for this user
    const maxSortOrderResult = await pool.query(
      "SELECT MAX(SortOrder) as MaxSortOrder FROM user_courses WHERE UserId = ?", 
      [userId]
    );

    const maxSortOrder = maxSortOrderResult[0].MaxSortOrder;
    const nextSortOrder = maxSortOrder !== null ? maxSortOrder + 1 : 0;

    // Insert the new user_course with the next sort order
    await pool.query(
      "INSERT INTO user_courses (UserId, CourseId, SortOrder, Active) VALUES (?, ?, ?, 1)",
      [userId, courseId, nextSortOrder]
    );

    await pool.query("CALL AddTimechecksForNewUser(?)", [userId]);

    // Fetch the newly created user_course details
    const newCourseDetails = await pool.query(
      "SELECT c.*, uc.SortOrder, uc.Active FROM courses c JOIN user_courses uc ON c.CourseId = uc.CourseId WHERE uc.UserId = ? AND uc.CourseId = ?",
      [userId, courseId]
    );

    if (newCourseDetails.length === 0) {
      throw new NotFoundError("Newly added course not found");
    }

    res.status(201).json(newCourseDetails[0]);
  } catch (error) {
    next(new DatabaseError("Error adding user course", error));
  }
};

const removeUserCourse = async (req, res, next) => {
  const userId = req.user.userId;
  const courseId = req.params.courseId;

  if (!courseId) {
    return res.status(400).json({ error: 'Course ID is required' });
  }

  try {
    // Start a transaction
    await pool.query("START TRANSACTION");

    // Delete the course from user_courses
    await pool.query(
      "DELETE FROM user_courses WHERE UserId = ? AND CourseId = ?",
      [userId, courseId]
    );

    // Delete corresponding timechecks
    await pool.query(
      "DELETE FROM timechecks WHERE UserId = ? AND CourseId = ?",
      [userId, courseId]
    );

    // Commit the transaction
    await pool.query("COMMIT");

    res.status(200).json({ success: true, message: "Course and associated timechecks removed successfully." });
  } catch (error) {
    // Rollback the transaction in case of error
    await pool.query("ROLLBACK");
    next(new DatabaseError("Error removing user course and associated timechecks", error));
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
  getCoursesByDistance,
  addUserCourse,
  removeUserCourse
};
