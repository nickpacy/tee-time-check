const pool = require("../database");
const dotenv = require("dotenv");
const bcrypt = require("bcryptjs");
const fs = require("fs").promises;
const crypto = require("crypto");
const escapeHtml = require("escape-html");
const { Resend } = require('resend');
const { InternalError, ConflictError } = require("../middlewares/errorTypes"); // Import the custom error classes

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

const setAndSendPassword = async (user, mailOptions, next) => {
  try {
    // Generate a random password
    const randomPassword = generateRandomPassword(); // You can adjust the length as needed

    // Hash the new password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(randomPassword, salt);

    // Update the user's password in the database
    await pool.query("UPDATE users SET Password = ? WHERE Email = ?", [
      hashedPassword,
      user.Email,
    ]);

    // Read the HTML template from the file
    let htmlTemplate = await fs.readFile(
      `./assets/${mailOptions.template}`,
      "utf8"
    );
    htmlTemplate = htmlTemplate.replace("[User]", escapeHtml(user.Name));
    htmlTemplate = htmlTemplate.replace(
      "[GeneratedPassword]",
      escapeHtml(randomPassword)
    );

    const mailer = {
      from: mailOptions.from,
      to: mailOptions.to,
      subject: mailOptions.subject,
      html: htmlTemplate,
    };

    // Send the Email
    const info = await sendMail(mailer);
    // console.log(`Email sent to ${mailer.to}`);
  } catch (error) {
    if (error.code && error.code === "ER_DUP_ENTRY") {
      next(new ConflictError("Duplicate entry found in database", error));
    } else {
      next(
        new InternalError(
          "Error occurred while setting and sending password",
          error
        )
      );
    }
  }
};

const sendMail = async (mail, next) => {
  try {
    const resend = new Resend(process.env.RESEND_API_KEY)

    const result = await resend.emails.send({
      from: mail.from,
      to: mail.to,
      subject: mail.subject,
      html: mail.html
    });

    return result; // Return the result object on successful email send
  } catch (err) {
    next(new InternalError("Error sending email", err));
  }
};

const sendTestEmail = async (req, res, next) => {
  try {
    const testMail = {
      from: 'YourApp <nick@algotee.com>', // replace with verified domain when live
      to: 'nickpacy@gmail.com', // put your test recipient email here
      subject: 'Test Email from Resend Integration',
      html: '<p>This is a <strong>test email</strong> sent using Resend.</p>'
    };

    const result = await sendMail(testMail, next);

    if (result?.error) {
      return res.status(500).json({ error: result.error });
    }

    return res.status(200).json({ message: 'Test email sent successfully!', data: result.data });
  } catch (error) {
    next(new InternalError("Error sending test email", error));
  }
};

module.exports = {
  setAndSendPassword,
  sendTestEmail
};
