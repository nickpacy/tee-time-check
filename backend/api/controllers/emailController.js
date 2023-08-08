const pool = require("../database");
const dotenv = require("dotenv");
const bcrypt = require("bcryptjs");
const sgMail = require('@sendgrid/mail');
const fs = require("fs").promises;
const crypto = require("crypto");
const escapeHtml = require('escape-html');


dotenv.config();

const generateRandomPassword = (length = 12) => {
  const characters =
    "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$";
  const buffer = crypto.randomBytes(length);
  const passwordArray = [];

  for (let i = 0; i < length; i++) {
    passwordArray.push(characters[buffer[i] % characters.length]);
  }

  return passwordArray.join("");
};

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
  
      const mailer = {
        from: mailOptions.from,
        to: mailOptions.to,
        subject: mailOptions.subject,
        html: htmlTemplate
      };
  
      // Send the Email
      const info = await sendMail(mailer);
      console.log(`Email sent to ${mailer.to}`);
    } catch (error) {
      console.error('Error sending email: ', error);
    }
  };

const sendMail = async (mail) => {
  try {
    sgMail.setApiKey(process.env.SENDGRID_API_KEY);

    const result = await sgMail.send({
      from: mail.from,
      to: mail.to,
      subject: mail.subject,
      html: mail.html
    });

    return result; // Return the result object on successful email send
  } catch (err) {
    console.error('Error sending email:', err);
    throw err; // Rethrow the error to be caught by the caller or handle it accordingly
  }
};

module.exports = {
    setAndSendPassword
}