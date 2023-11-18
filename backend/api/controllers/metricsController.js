const pool = require('../database');
const { InternalError } = require("../middlewares/errorTypes");
const getNotificationsByCourse = async (req, res, next) => {
    const userId = req.user.userId;
    const weekLookback = req.body.lookback || 12;
    try {
        // First, get the list of weeks
        const weeksResults = await pool.query(`
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
        `, [userId, userId, weekLookback]);

        // Then, get the notification counts by course and week
        const countsResults = await pool.query(`
            SELECT 
                CourseName,
                DATE_FORMAT(STR_TO_DATE(CONCAT(YEAR(NotifiedDate), WEEK(NotifiedDate, 1), ' Sunday'), '%X%V %W'), '%Y-%m-%d') AS WeekStartDate,
                COUNT(DISTINCT NotificationId) AS WeeklyNotificationCount
            FROM notifications n
            JOIN courses c ON n.CourseId = c.CourseId
            WHERE UserId = ? AND NotifiedDate >= DATE_SUB(CURDATE(), INTERVAL ? WEEK)
            GROUP BY CourseName, WeekStartDate
            ORDER BY WeekStartDate, CourseName;
        `, [userId, weekLookback]);
        const weekList = weeksResults.map(week => week.WeekStartDate.toISOString().split('T')[0]);


        // Process the results to format them for Highcharts
        let seriesData = {};
        countsResults.forEach(record => {
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
                data: seriesData[course]
            });
        }

        // Final dataset for Highcharts
        const data = {
            categories: weekList,
            series: finalSeries
        };
        res.json(data);

    } catch (err) {
        next(new InternalError("Error getting metrics", error));
    }
};


module.exports = {
    getNotificationsByCourse
};