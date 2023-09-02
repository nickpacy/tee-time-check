const dotenv = require("dotenv"); // Environment variable management library
const moment = require("moment-timezone"); // Date and time manipulation library
const fs = require('fs').promises; // Import the fs module
const twilio = require("twilio");
const sgMail = require("@sendgrid/mail");
const apn = require('apn');



// Load environment variables from .env file
dotenv.config();

// Create a Twilio client
const smsClient = new twilio(
  process.env.TWILIO_SID,
  process.env.TWILIO_AUTH_TOKEN
);

// Setup auth key for iOS Push notifications
let options = {
    token: {
        key: "AuthKey_NPDRS4SRCS.p8",
        keyId: "NPDRS4SRCS",
        teamId: "RFHPD79HMY"
    },
    production: false
};
let apnProvider = new apn.Provider(options);

// Send emails with tee time notifications
const sendEmails = async (teeTimesByUser) => {
  if (Object.keys(teeTimesByUser).length > 0) {
    // Send an email to each user with their list of tee times
    for (const [userId, teeTimes] of Object.entries(teeTimesByUser)) {
      const emailNotification = teeTimes[0].emailNotification;
      if (!emailNotification) break;

      const email = teeTimes[0].email;

      const tableRows = teeTimes
        .map(({ courseName, teeTime, available_spots, bookingLink }) => {
          // Format the tee time in the user's local time zone
          const options = {
            weekday: "short",
            year: "numeric",
            month: "short",
            day: "numeric",
            hour: "numeric",
            minute: "numeric",
            hour12: true,
            timeZone: "America/Los_Angeles", // Specify the desired time zone
          };
          const teeTimeDate = moment
            .tz(teeTime, "America/Los_Angeles")
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
    sgMail.setApiKey(process.env.SENDGRID_API_KEY);

    const result = await sgMail.send({
      from: mail.from,
      to: mail.to,
      subject: mail.subject,
      html: mail.html,
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


const sendPushNotitification = async (teeTimesByUser) => {
    if (Object.keys(teeTimesByUser).length > 0) {
        // Send an email to each user with their list of tee times
        for (const [userId, teeTimes] of Object.entries(teeTimesByUser)) {
          const deviceToken = teeTimes[0].deviceToken;
          if (!deviceToken) break;
    

            let note = new apn.Notification();
            if (teeTimes.length == 1) {
                note.alert = `${formatDate(teeTimes[0].teeTime)} @ ${teeTimes[0].courseName} for ${teeTimes[0].available_spots} `;
                note.payload = {'targetURL': teeTimes[0].bookingLink};
            } else {
                note.alert = `${teeTimes.length} Tee Times Found. Click to View`;
                note.payload = {'action': 'open_notifications_view'};
            }
            note.expiry = Math.floor(Date.now() / 1000) + 1800; // Expires 30 minutes.
            note.badge = 0;
            note.sound = "default";
            note.topic = "com.nickpacy.tee-time-check-ios";
    
          try {
            apnProvider.send(note, deviceToken).then( result => {
                // see documentation for an explanation of result
                // console.log(result);
                if (result.failed.length > 0) {
                    console.log(result.failed[0].response);
                } else {
                    console.log(`Tee Time Found! Push sent to ${deviceToken}`);
                }
                }).finally(() => {
                    apnProvider.shutdown();
                });
          } catch (error) {
            console.log(`Error sending email to ${email}:`, error);
          }
        }
      } else {
        // No new tee times
        console.log("No New Tee Times as of " + new Date());
      }
    
}

const formatDate = (teeTime) => {
    // Format the tee time in the user's local time zone
    const options = {
        weekday: "short",
        year: "numeric",
        month: "short",
        day: "numeric",
        hour: "numeric",
        minute: "numeric",
        hour12: true,
        timeZone: "America/Los_Angeles", // Specify the desired time zone
    };
    const teeTimeDate = moment
        .tz(teeTime, "America/Los_Angeles")
        .toDate();
    const localTime = teeTimeDate.toLocaleString("en-US", options);

    return localTime;
}



module.exports = {
    sendEmails,
    sendSMS,
    sendPushNotitification
  };
  