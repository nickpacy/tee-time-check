const pool = require("../database");
const { NotFoundError, InternalError } = require("../middlewares/errorTypes");

const getNotificationsByCourse = async (req, res, next) => {
  const userId = req.user.userId;

  try {
    // Fetch distinct courses and tee times for which user received notifications in the past 24 hours
    let query = `
          SELECT 
              n.UserId, 
              n.CourseId, 
              c.CourseName, 
              c.ImageUrl,
              n.NotificationId,
              n.TeeTime
          FROM notifications n
          JOIN courses c ON n.CourseId = c.CourseId 
          WHERE n.UserId = ?
          AND n.NotifiedDate BETWEEN NOW() - INTERVAL 24 HOUR AND NOW()
      `;

    const results = await pool.query(query, [userId]);

    if (results.length === 0) {
      res.json([]);
      return;
    }

    res.json(results);
  } catch (error) {
    next(new InternalError("Error getting notification", error));
  }
};

const removeNotification = async (req, res, next) => {
  const NotificationId = req.params.NotificationId;

  try {
    // Delete the specified tee time from the notified_tee_times table
    const result = await pool.query(
      "DELETE FROM notifications WHERE NotificationId = ?",
      [NotificationId]
    );

    if (result.affectedRows === 0) {
      next(new NotFoundError("Notified tee time not found"));
    } else {
      res.json({ message: "Notified tee time removed successfully." });
    }
  } catch (error) {
    next(new InternalError("Error removing notified tee time", error));
  }
};

module.exports = {
  getNotificationsByCourse,
  removeNotification,
};
