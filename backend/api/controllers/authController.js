const pool = require("../database");
const dotenv = require("dotenv");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { DatabaseError, NotFoundError } = require("../middlewares/errorTypes"); // Include custom error types
const email = require("./emailController");

dotenv.config();

// Register a new user
const registerUser = async (req, res, next) => {
  const { Name, Password, Email } = req.body;

  if (!Email || !Password) {
    return res
      .status(400)
      .json({ message: "Email and password are required." });
  }

  try {
    const results = await pool.query("SELECT * FROM users WHERE Email = ?", [
      Email,
    ]);
    if (results.length) {
      return res.status(400).json({ message: "User already exists." });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(Password, salt);

    const result = await pool.query(
      "INSERT INTO users (Name, Email, Password) VALUES (?, ?, ?)",
      [Name, Email, hashedPassword]
    );
    const userId = result.insertId;
    const token = jwt.sign({ _id: userId }, process.env.JWT_TOKEN, {
      expiresIn: "1h",
    });

    res.header("auth-token", token).send({ userId, token });
  } catch (error) {
    next(new DatabaseError("Error creating user", error));
  }
};

// Login
const loginUser = async (req, res, next) => {
  const { Remember, Password, Email } = req.body;

  if (!Email || !Password) {
    return res
      .status(400)
      .json({ message: "Email and password are required." });
  }

  try {
    const results = await pool.query("SELECT * FROM users WHERE Email = ?", [
      Email,
    ]);
    if (!results.length) {
      throw new NotFoundError("Invalid username or password.");
    }

    const user = results[0];
    const userId = user.UserId;
    const validPassword = await bcrypt.compare(Password, user.Password);
    if (!validPassword) {
      throw new NotFoundError("Invalid email or password.");
    }

    const lastLoginDate = new Date();
    await pool.query("UPDATE users SET LastLoginDate = ? WHERE UserId = ?", [
      lastLoginDate,
      userId,
    ]);

    const token = jwt.sign({ userId: userId }, process.env.JWT_TOKEN, {
      expiresIn: Remember ? "365d" : "365d",
    });
    res.header("auth-token", token).send({
      user: {
        UserId: user.UserId,
        Name: user.Name,
        Email: user.Email,
        Phone: user.Phone,
        EmailNotification: user.EmailNotification,
        PhoneNotification: user.PhoneNotification,
        Active: user.Active,
        Admin: user.Admin,
        LastLoginDate: user.LastLoginDate
      },
      token,
    });
  } catch (error) {
    next(error);
  }
};

// Change Password
const changePassword = async (req, res, next) => {
  const { UserId, OldPassword, NewPassword } = req.body;

  if (!UserId || !OldPassword || !NewPassword) {
    return res
      .status(400)
      .json({
        message: "UserId, old password, and new password are required.",
      });
  }

  try {
    const results = await pool.query("SELECT * FROM users WHERE UserId = ?", [
      UserId,
    ]);

    if (!results.length) {
      throw new NotFoundError("User not found.");
    }

    const user = results[0];
    const validPassword = await bcrypt.compare(OldPassword, user.Password);
    if (!validPassword) {
      throw new NotFoundError("Invalid old password.");
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(NewPassword, salt);
    await pool.query("UPDATE users SET Password = ? WHERE UserId = ?", [
      hashedPassword,
      UserId,
    ]);

    res.status(200).json({ message: "Password changed successfully." });
  } catch (error) {
    next(new DatabaseError("Error changing password", error));
  }
};

// Forgot Password
const forgotPassword = async (req, res, next) => {
  const { Email } = req.body;

  if (!Email) {
    return res.status(400).json({ message: "Email is required." });
  }

  try {
    const results = await pool.query("SELECT * FROM users WHERE Email = ?", [
      Email,
    ]);

    if (!results.length) {
      throw new NotFoundError("User not found.");
    }

    const user = results[0];
    const mailOptions = {
      from: '"Password Reset" <donotreply@teetimecheck.com>',
      to: Email,
      subject: "Forgot Password - Tee Time Check",
      template: "forgotPassword.html",
    };
    await email.setAndSendPassword(user, mailOptions);

    res
      .status(200)
      .json({
        message:
          "Password reset successful. Check your email for the new password.",
      });
  } catch (error) {
    next(new DatabaseError("Error resetting password", error));
  }
};

module.exports = {
  registerUser,
  loginUser,
  forgotPassword,
  changePassword,
};
