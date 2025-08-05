const dotenv = require("dotenv"); // Environment variable management library
const moment = require("moment-timezone"); // Date and time manipulation library
const f = require("fs");
const fs = require('fs').promises; // Import the fs module
const twilio = require("twilio");
const { ApnsClient, Notification } = require('apns2');
const { Resend } = require('resend');
const { convert } = require("html-to-text");



// Load environment variables from .env file
dotenv.config();

// Create a Twilio client
const smsClient = new twilio(
  process.env.TWILIO_SID,
  process.env.TWILIO_AUTH_TOKEN
);

// Send emails with tee time notifications
const sendEmails = async (teeTimesByUser) => {
  if (Object.keys(teeTimesByUser).length > 0) {
    // Send an email to each user with their list of tee times
    for (const [userId, teeTimes] of Object.entries(teeTimesByUser)) {
      const emailNotification = teeTimes[0].emailNotification;
      if (!emailNotification) break;

      const email = teeTimes[0].email;

      const tableRows = teeTimes
        .map(({ courseName, teeTime, available_spots, bookingLink, timeZone }) => {
          // Format the tee time in the user's local time zone
          const options = {
            weekday: "short",
            year: "numeric",
            month: "short",
            day: "numeric",
            hour: "numeric",
            minute: "numeric",
            hour12: true,
            timeZone: timeZone, // Specify the desired time zone
          };
          const teeTimeDate = moment
            .tz(teeTime, timeZone)
            .toDate();
          const localTime = teeTimeDate.toLocaleString("en-US", options);
          return `
              <tr>
                <td><a href="${bookingLink}">${courseName}</a></td>
                <td>${localTime}</td>
                <td>${available_spots}</td>
              </tr>`;
        })
        .join("");

      // Read the HTML template from the file
      let htmlTemplate = await fs.readFile("email-template.html", "utf8");

      // Insert the table rows into the template
      const htmlBody = htmlTemplate.replace("${tableRows}", tableRows);

      const mailOptions = {
        from: process.env.SMTP_FROM, // Sender's email address
        to: email, // Recipient's email address
        subject: "Tee Time Alert",
        html: htmlBody,
        text: convert(htmlBody)
      };

      try {
        const info = await sendMail(mailOptions);
        console.log(`Tee Time Found! Email sent to ${email}`);
      } catch (error) {
        console.log(`Error sending email to ${email}:`, error);
      }
    }
  } else {
    // No new tee times
    console.log("No New Tee Times as of " + new Date());
  }
};

// Actually send the email
const sendMail = async (mail) => {
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
    console.error("Error sending email:", err);
    throw err; // Rethrow the error to be caught by the caller or handle it accordingly
  }
};

// Send Text Messages
const sendSMS = async (teeTimesByUser) => {
  if (Object.keys(teeTimesByUser).length > 0) {
    // Send an SMS to each user with their list of tee times
    for (const [userId, teeTimes] of Object.entries(teeTimesByUser)) {
      const phoneNotification = teeTimes[0].phoneNotification;
      if (!phoneNotification) break;

      let phoneNumber = teeTimes[0].phone;
      if (!phoneNumber.startsWith("+1")) {
        phoneNumber = "+1" + phoneNumber;
      }

      let message = "New Tee Times";
      for (const {
        courseName,
        teeTime,
        available_spots,
        bookingLink,
      } of teeTimes) {
        // const teeTimeDate = moment.tz(teeTime, "America/Los_Angeles").toDate();
        const localTime = moment(teeTime).format("ddd M/D h:mm A");
        const newMessage = `\n${courseName} ${localTime} (${available_spots})`;

        // Check if adding the new message (and potentially '...') would exceed the SMS length limit
        if ((message + newMessage + (message ? "..." : "")).length > 160) {
          message += "...";
          break;
        }
        message += newMessage;
      }

      try {
        // Send the SMS
        await smsClient.messages.create({
          body: message,
          to: phoneNumber, // Recipient's phone number
          from: process.env.TWILIO_FROM, // Your Twilio number
        });
        console.log(`Tee Time Found! SMS sent to ${phoneNumber}`);
      } catch (error) {
        console.log(`Error sending SMS to ${phoneNumber}:`, error);
      }
    }
  } else {
    // No new tee times
    console.log(`No New Tee Times as of ${new Date()}`);
  }
};


const sendPushNotification = async (teeTimesByUser) => {
  if (Object.keys(teeTimesByUser).length === 0) {
    console.log("No New Tee Times as of " + new Date());
    return;
  }

  signingKey = f.readFileSync('AuthKey_NPDRS4SRCS.p8', 'utf8');

  // Initialize APNs client
  const apnClient = new ApnsClient({
    team: 'RFHPD79HMY',
    keyId: 'NPDRS4SRCS',
    signingKey: signingKey,
    defaultTopic: 'com.nickpacy.tee-time-check-ios',
    production: true,
  });

  // Loop through users and send push notifications
  for (const [userId, teeTimes] of Object.entries(teeTimesByUser)) {
    const deviceToken = teeTimes[0]?.deviceToken;
    if (!deviceToken) continue;

    // Prepare alert and payload
    let alert;
    let payload;

    if (teeTimes.length === 1) {
      const teeTime = moment(teeTimes[0].teeTime).format("ddd M/D h:mm A");
      alert = `${teeTime} @ ${teeTimes[0].courseName} for ${teeTimes[0].available_spots}`;
      payload = { targetURL: teeTimes[0].bookingLink };
    } else {
      alert = `${teeTimes.length} Tee Times Found. Click to View`;
      payload = { action: 'open_notifications_view' };
    }

    // Create notification
    const note = new Notification(deviceToken, {
      alert,
      sound: 'default',
      badge: 0,
      payload,
      expiry: Math.floor(Date.now() / 1000) + 1800,
    });

    // Send and handle response
    try {
      const result = await apnClient.send(note);

      if (result instanceof Notification) {
        console.log(`Tee Time Found! Push sent to ${deviceToken}`);
      } else {
        console.error(`Failed to send push to ${deviceToken}:`, result);
      }
    } catch (error) {
      console.error(`Error sending push to ${deviceToken}:`, error);
    }
  }
};

// const formatDate = (teeTime) => {
//     // Format the tee time in the user's local time zone
//     const options = {
//         weekday: "short",
//         year: "numeric",
//         month: "short",
//         day: "numeric",
//         hour: "numeric",
//         minute: "numeric",
//         hour12: true,
//         timeZone: "America/Los_Angeles", // Specify the desired time zone
//     };
//     const teeTimeDate = moment
//         .tz(teeTime, "America/Los_Angeles")
//         .toDate();
//     const localTime = teeTimeDate.toLocaleString("en-US", options);

//     return localTime;
// }



module.exports = {
    sendEmails,
    sendSMS,
    sendPushNotification
  };
  