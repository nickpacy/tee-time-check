const mysql = require('mysql2/promise');
const dotenv = require('dotenv');

dotenv.config();

const pool = mysql.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
});


module.exports = {
    query: async (sql, params) => {
      const connection = await pool.getConnection();
      try {
        const [rows, fields] = await connection.query(sql, params);
        return rows;
      } catch (error) {
        console.error('Error executing query: ', error);
        throw error;
      } finally {
        if (connection) {
          connection.release();
        }
      }
    },
    close: async () => {
      await pool.end();
    },
  };