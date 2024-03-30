const axios = require('axios');
const dotenv = require("dotenv"); 
const util = require('./utility');
const sgMail = require("@sendgrid/mail");

dotenv.config();

async function getTeeTimes(bookingClass, dayOfWeek, numPlayers, scheduleId, pool) {
  const formattedClosestDay = util.getClosestDayOfWeek(dayOfWeek);
  const url = `https://foreupsoftware.com/index.php/api/booking/times?time=all&date=${formattedClosestDay}&holes=all&players=${numPlayers}&booking_class=${bookingClass}&schedule_id=${scheduleId}&api_key=no_limits`;
  
  let config = {
    headers: {}
  };

  if (bookingClass === 888 || bookingClass === 1135) {
    config.headers["X-Authorization"] = `Bearer ${process.env.FOREUP_BEARER}`;
  }

  try {
    const response = await axios.get(url, config);
    const teeTimes = response.data.map(item => {
      return {
        time: item.time,
        available_spots: item.available_spots
      };
    });
    
    return teeTimes;
  } catch (error) {
    // console.error(error);

    if (error.response && error.response.status === 401) {
      // Specific error message handling
      if (error.response.data.msg.includes("You do not have permissions to use this booking class")) {

        // Check if an email has already been sent today
      if (await shouldSendEmail(pool)) {
        try {
          const mailOptions = {
            from: "Reset Bearer <info@teetimecheck.com>", // Sender's email address
            to: "nickpacy@gmail.com",
            subject: "Reset Bearer Token",
            html: "<p>You need to reset the ForeUp token for Algoteé</p>"
          };
          await sendMail(mailOptions);
          await updateEmailSentDate(pool); // Update the database with the email sent date
        } catch (error) {
          console.log(`Error sending email.`, error);
        }
      }

      }
    }

    return []; // Return an empty array in case of an error
  }
}


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

async function shouldSendEmail(pool) {
  const today = new Date().toISOString().split('T')[0]; // Format today's date as YYYY-MM-DD
  const [rows] = await pool.query("SELECT SettingValue FROM app_settings WHERE SettingKey = 'LastTokenExpiredEmailSent'");

  if (rows.length === 0 || rows[0].SettingValue !== today) {
    return true; // Send email if no entry or entry is not from today
  }
  return false; // Do not send if email already sent today
}

async function updateEmailSentDate(pool) {
  const today = new Date().toISOString().split('T')[0];
  await pool.query("REPLACE INTO app_settings (SettingKey, SettingValue) VALUES ('LastTokenExpiredEmailSent', ?)", [today]);
}

module.exports = {
    getTeeTimes
};


// '1', 'Torrey Pines South', '1138', '1487', 'foreup', 'torrey-pines-south.png'
// '2', 'Torrey Pines North', '1138', '1468', 'foreup', 'torrey-pines-north.png'


