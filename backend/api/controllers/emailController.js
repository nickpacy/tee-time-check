const pool = require("../database");
const dotenv = require("dotenv");
const bcrypt = require("bcryptjs");
const nodemailer = require("nodemailer");
const fs = require("fs").promises;
const crypto = require("crypto");
const escapeHtml = require('escape-html');

dotenv.config();

const generateRandomPassword = (length = 12) => {
  const characters =
    "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*()-_=+";
  const buffer = crypto.randomBytes(length);
  const passwordArray = [];

  for (let i = 0; i < length; i++) {
    passwordArray.push(characters[buffer[i] % characters.length]);
  }

  return passwordArray.join("");
};

// Create a transporter for sending emails
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST, // SMTP host for sending emails
  port: process.env.SMTP_PORT, // SMTP port for sending emails
  secure: true, // Use SSL/TLS for secure connection
  auth: {
    user: process.env.SMTP_USER, // SMTP username
    pass: process.env.SMTP_PASSWORD, // SMTP password
  },
});


const setAndSendPassword = async (user, mailOptions) => {
    // Generate a random password
    const randomPassword = generateRandomPassword(); // You can adjust the length as needed
  
    // Hash the new password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(randomPassword, salt);
  
    // Update the user's password in the database
    await pool.query('UPDATE users SET Password = ? WHERE Email = ?', [hashedPassword, user.Email]);
  
    try {
      // Read the HTML template from the file
      let htmlTemplate = await fs.readFile(`./assets/${mailOptions.template}`, 'utf8');
      htmlTemplate = htmlTemplate.replace('[User]', escapeHtml(user.Name));
      htmlTemplate = htmlTemplate.replace('[GeneratedPassword]', escapeHtml(randomPassword));

      console.log(htmlTemplate);
  
      const mailer = {
        from: mailOptions.from,
        to: mailOptions.to,
        subject: mailOptions.subject,
        html: htmlTemplate
      };
  
      // Send the Email
      const info = await transporter.sendMail(mailer);
      console.log('Email sent: ', info.messageId);
    } catch (error) {
      console.error('Error sending email: ', error);
    }
  };

module.exports = {
    setAndSendPassword
}