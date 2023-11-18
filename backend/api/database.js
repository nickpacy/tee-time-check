const mysql = require('mysql2/promise');
const dotenv = require('dotenv');

dotenv.config();

class DatabaseError extends Error {
  constructor(message, originalError) {
    super(message);
    this.name = "DatabaseError";
    this.original = originalError;
  }
}

const pool = mysql.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
});


const database = {
  query: async (sql, params) => {
    let connection;
    try {
      connection = await pool.getConnection();
      const [rows] = await connection.query(sql, params);
      return rows;
    } catch (error) {
      throw new DatabaseError("Error executing query", error);
    } finally {
      if (connection) {
        connection.release();
      }
    }
  },
  close: async () => {
    await pool.end();
  }
};

module.exports = database;