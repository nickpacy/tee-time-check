const pool = require('../database');

const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');


function generateHash(password) {
  return bcrypt.hashSync(password, bcrypt.genSaltSync(8), null);
}

function validatePassword(password, hash) {
  return bcrypt.compareSync(password, hash);
}

async function registerUser(name, password, email) {
  const hashedPassword = generateHash(password);

  const sql = `INSERT INTO Users (Name, Password, Email) VALUES (?, ?, ?)`;
  const values = [name, hashedPassword, email];

  return new Promise((resolve, reject) => {
    pool.query(sql, values, (err, result) => {
      if (err) {
        reject(err);
        return;
      }

      const userId = result.insertId;
      resolve({ userId, name, email });
    });
  });
}

async function loginUser(name, password) {
  const sql = `SELECT UserId, Name, Password, Email FROM Users WHERE Name = ?`;
  const values = [name];

  return new Promise((resolve, reject) => {
    pool.query(sql, values, (err, results) => {
      if (err) {
        reject(err);
        return;
      }

      if (results.length === 0) {
        resolve(null);
        return;
      }

      const user = results[0];

      if (!validatePassword(password, user.Password)) {
        resolve(null);
        return;
      }

      resolve({ userId: user.UserId, name: user.Name, email: user.Email });
    });
  });
}

module.exports = {
  registerUser,
  loginUser
};