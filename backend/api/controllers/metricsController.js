const pool = require("../database");
const { InternalError } = require("../middlewares/errorTypes");
const getNotificationsByCourse = async (req, res, next) => {
  const userId = req.user.userId;
  const {weekLookback} = req.query || 12;
  try {
    // First, get the list of weeks
    const weeksResults = await pool.query(
      `
            WITH RECURSIVE date_series AS (
                SELECT MIN(DATE(STR_TO_DATE(CONCAT(YEAR(NotifiedDate), WEEK(NotifiedDate, 1), ' Sunday'), '%X%V %W'))) as date 
                FROM notifications
                WHERE UserId = ?
                UNION ALL
                SELECT DATE_ADD(date, INTERVAL 7 DAY) 
                FROM date_series 
                WHERE DATE_ADD(date, INTERVAL 7 DAY) <= (SELECT MAX(DATE(STR_TO_DATE(CONCAT(YEAR(NotifiedDate), WEEK(NotifiedDate, 1), ' Sunday'), '%X%V %W'))) FROM notifications WHERE UserId = ?)
            )
            SELECT date AS WeekStartDate 
            FROM date_series
            WHERE date >= DATE_SUB(CURDATE(), INTERVAL ? WEEK);
        `,
      [userId, userId, weekLookback]
    );

    // Then, get the notification counts by course and week
    const countsResults = await pool.query(
      `
            SELECT 
                CourseName,
                DATE_FORMAT(STR_TO_DATE(CONCAT(YEAR(NotifiedDate), WEEK(NotifiedDate, 1), ' Sunday'), '%X%V %W'), '%Y-%m-%d') AS WeekStartDate,
                COUNT(DISTINCT NotificationId) AS WeeklyNotificationCount
            FROM notifications n
            JOIN courses c ON n.CourseId = c.CourseId
            WHERE UserId = ? AND NotifiedDate >= DATE_SUB(CURDATE(), INTERVAL ? WEEK)
            GROUP BY CourseName, WeekStartDate
            ORDER BY WeekStartDate, CourseName;
        `,
      [userId, weekLookback]
    );
    const weekList = weeksResults.map(
      (week) => week.WeekStartDate.toISOString().split("T")[0]
    );

    // Process the results to format them for Highcharts
    let seriesData = {};
    countsResults.forEach((record) => {
      if (!seriesData[record.CourseName]) {
        seriesData[record.CourseName] = new Array(weekList.length).fill(0);
      }
      const weekIndex = weekList.indexOf(record.WeekStartDate);
      seriesData[record.CourseName][weekIndex] = record.WeeklyNotificationCount;
    });

    // Convert the processed series data into the required format
    let finalSeries = [];
    for (let course in seriesData) {
      finalSeries.push({
        name: course,
        data: seriesData[course],
      });
    }

    // Final dataset for Highcharts
    const data = {
      categories: weekList,
      series: finalSeries,
    };
    res.json(data);
  } catch (err) {
    next(new InternalError("Error getting metrics", error));
  }
};

const getTotalTeeTimesByCourseAndUser = async (req, res, next) => {
    let { startDate, endDate } = req.query; // Extract dates from query parameters

    // Default to the past 30 days if dates are not provided
    if (!startDate || !endDate) {
        endDate = new Date(); // Current date
        startDate = new Date();
        startDate.setDate(startDate.getDate() - 30); // Set to 30 days ago
        // Format dates to match the format expected by your database
        startDate = startDate.toISOString().split('T')[0];
        endDate = endDate.toISOString().split('T')[0];
    }


  try {
    const results = await pool.query(`
            SELECT 
                c.CourseName,
                n.UserId,
                u.Name,
                COUNT(n.TeeTime) AS TotalTeeTimes
            FROM 
                notifications n
            JOIN 
                courses c ON n.CourseId = c.CourseId
            JOIN 
                users u ON n.UserId = u.UserId
            WHERE 
                n.NotifiedDate BETWEEN ? AND ?
            GROUP BY 
                c.CourseName, n.UserId, u.Name
            ORDER BY 
                TotalTeeTimes DESC, 
                c.CourseName, 
                n.UserId;
        `, [startDate, endDate]);

    // WHERE n.TeeTime >= DATE_SUB(CURDATE(), INTERVAL 1 MONTH)

    // Process the results for the stacked bar chart
    let seriesData = {};
    let courseTotals = {};
    let courseNames = [];
    let userNames = {}; // New object to map userId to userName

    results.forEach((record) => {
      courseTotals[record.CourseName] =
        (courseTotals[record.CourseName] || 0) + record.TotalTeeTimes;

      if (!seriesData[record.UserId]) {
        seriesData[record.UserId] = [];
        userNames[record.UserId] = record.Name; // Map userId to userName
      }

      seriesData[record.UserId].push({
        name: record.CourseName,
        y: record.TotalTeeTimes,
      });
    });

    // Sort courses by total tee times
    courseNames = Object.keys(courseTotals).sort(
      (a, b) => courseTotals[b] - courseTotals[a]
    );

    // Format series data according to sorted course names
    let finalSeries = [];
    for (let userId in seriesData) {
      finalSeries.push({
        name: userNames[userId], // Use userName instead of userId
        data: courseNames.map((courseName) => {
          const courseData = seriesData[userId].find(
            (data) => data.name === courseName
          );
          return courseData ? courseData.y : 0;
        }),
      });
    }

    const data = {
      categories: courseNames,
      series: finalSeries,
    };

    res.json(data);
  } catch (error) {
    next(
      new InternalError(
        "Error getting total tee times by course and user",
        error
      )
    );
  }
};

const getMonthlyCharges = async (req, res, next) => {
  const userId = req.user.userId;

  try {
    // Use the TTC database and fetch monthly charges
    let query = `
      SELECT 
          DATE_FORMAT(tm.dateSent, '%Y-%m') AS month,
          COUNT(DISTINCT tm.sid) AS totalMessages,
          SUM(tm.price) * -1 AS totalCharges
      FROM twilio_messages tm
      JOIN users u ON tm.toPhone = CONCAT('+1', u.Phone)
      WHERE u.UserId = ?
      GROUP BY month
      ORDER BY month;
    `;

    // Execute the query
    const results = await pool.query(query, [userId]);

    // If no results, return an empty array
    if (results.length === 0) {
      res.json([]);
      return;
    }

    // Return the results as JSON
    res.json(results);
  } catch (error) {
    // Handle any errors
    next(new InternalError("Error getting monthly charges", error));
  }
};


module.exports = {
  getNotificationsByCourse,
  getTotalTeeTimesByCourseAndUser,
  getMonthlyCharges
};
