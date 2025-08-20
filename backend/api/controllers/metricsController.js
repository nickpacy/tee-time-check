const pool = require("../database");
const { InternalError } = require("../middlewares/errorTypes");


const getNotificationsByCourse = async (req, res, next) => {
  const userId = req.user.userId;
  const weekLookback = req.query.weekLookback || 12;

  try {
    // Get the notification counts by course and week
    const countsResults = await pool.query(
      `
        SELECT 
          c.CourseName,
          DATE_FORMAT(STR_TO_DATE(CONCAT(YEAR(n.NotifiedDate), WEEK(n.NotifiedDate, 1), ' Sunday'), '%X%V %W'), '%Y-%m-%d') AS WeekStartDate,
          COUNT(DISTINCT n.NotificationId) AS WeeklyNotificationCount
        FROM 
          notifications n
        JOIN 
          courses c ON n.CourseId = c.CourseId
        WHERE 
          n.UserId = ? AND n.NotifiedDate >= DATE_SUB(CURDATE(), INTERVAL ? WEEK)
        GROUP BY 
          c.CourseName, WeekStartDate
        ORDER BY 
          WeekStartDate, c.CourseName;
      `,
      [userId, weekLookback]
    );

    // Process the results to extract the week list and organize data for Highcharts
    let seriesData = {};
    let weekSet = new Set();

    countsResults.forEach((record) => {
      if (!seriesData[record.CourseName]) {
        seriesData[record.CourseName] = {};
      }

      seriesData[record.CourseName][record.weekStartDate] = record.WeeklyNotificationCount;
      weekSet.add(record.weekStartDate);
    });

    // Convert the set of weeks to a sorted array
    let weekList = Array.from(weekSet).sort();

    // Format series data according to the sorted week list
    let finalSeries = [];
    for (let course in seriesData) {
      let courseData = weekList.map((week) => seriesData[course][week] || 0);
      finalSeries.push({
        name: course,
        data: courseData,
      });
    }

    const data = {
      categories: weekList,
      series: finalSeries,
    };

    res.json(data);
  } catch (err) {
    next(new InternalError("Error getting metrics", err));
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
        c.CourseName, 
        u.Name;
    `, [startDate, endDate]);

    // Process the results for the stacked bar chart
    let seriesData = {};
    let courseNames = new Set();
    let userNames = {};

    results.forEach((record) => {
      courseNames.add(record.CourseName);

      if (!seriesData[record.UserId]) {
        seriesData[record.UserId] = {};
        userNames[record.UserId] = record.Name;
      }

      seriesData[record.UserId][record.CourseName] = record.TotalTeeTimes;
    });

    courseNames = Array.from(courseNames).sort();

    let finalSeries = Object.keys(seriesData).map(userId => {
      return {
        name: userNames[userId],
        data: courseNames.map(courseName => seriesData[userId][courseName] || 0)
      };
    });

    const data = {
      categories: courseNames,
      series: finalSeries,
    };

    res.json(data);
  } catch (error) {
    next(new InternalError("Error getting total tee times by course and user", error));
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

const getAllUsersMonthlyCharges = async (req, res, next) => {
  try {
    // Fetch distinct users who have messages
    const usersQuery = `
      SELECT DISTINCT u.UserId, u.Name
      FROM users u
      JOIN twilio_messages tm ON tm.toPhone = CONCAT('+1', u.Phone)
    `;
    const usersResults = await pool.query(usersQuery);

    if (usersResults.length === 0) {
      res.json([]);
      return;
    }

    // Create CASE statements for each user
    const caseStatements = usersResults.map(user => {
      return `SUM(CASE WHEN u.UserId = ${user.UserId} THEN tm.price * -1 ELSE 0 END) AS '${user.Name}'`;
    }).join(', ');

    // Construct the dynamic SQL query
    const query = `
      SELECT 
          DATE_FORMAT(tm.dateSent, '%Y-%m') AS month,
          ${caseStatements}
      FROM twilio_messages tm
      JOIN users u ON tm.toPhone = CONCAT('+1', u.Phone)
      GROUP BY month
      ORDER BY month;
    `;

    // Execute the query
    const results = await pool.query(query);

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
  getMonthlyCharges,
  getAllUsersMonthlyCharges
};
