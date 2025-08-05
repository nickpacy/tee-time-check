// Import required dependencies
const winston = require("winston"); // Logging library
const axios = require('axios');
const dotenv = require("dotenv"); 
const twilio = require("twilio");

// Load environment variables from .env file
dotenv.config();

// Create a Twilio client
const smsClient = new twilio(
  process.env.TWILIO_SID,
  process.env.TWILIO_AUTH_TOKEN
);

// Create a logger instance
const logger = winston.createLogger({
  level: "info",
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
  transports: [new winston.transports.Console()],
});

async function getTeeTimes() {
  const url = `https://book.rguest.com/wbe-golf-service/golf/tenants/711/propertyId/Kiawah-Island-Golf/getAvailableTeeSlots?fromDate=2024-09-17&toDate=2024-09-19&courseId=2&playerTypeId=38&holes=0&appName=golf`;
  
  let config = {
    headers: {}
  };
  config.headers["Authorization"] = `Bearer eyJhbGciOiJSUzI1NiIsImtpZCI6InpPT3VQekpQb0w3SG80RGhiUmZYaVBJX1Z3VnQzWEROdjhyYkd5ejM4QjAiLCJ0eXAiOiJKV1QifQ.eyJhdWQiOiI3NTQ1ODVlMC00OGYwLTQ3NmUtOGIwNS1mMTc5OTc1OGU5OGQiLCJpc3MiOiJodHRwczovL2FnaWx5c3lzcHJvZC5iMmNsb2dpbi5jb20vMzMwNTdmYjgtYmNiNS00ZGJkLThlZjQtZGZjMmEzMTAzYzEyL3YyLjAvIiwiZXhwIjoxNzIzNDk1MzA4LCJuYmYiOjE3MjM0OTE3MDgsInN1YiI6ImYzY2RiOGUxLTI0NDYtNDBiZi04MTc2LTRkNmNlMjQ2MzIwOSIsIm5hbWUiOiJhcGlfdXNlcl83MTFfcHJvZF91cyIsImV4dGVuc2lvbl90ZW5hbnRJZCI6IjcxMV9wcm9kX3VzIiwiYXpwIjoiNzU0NTg1ZTAtNDhmMC00NzZlLThiMDUtZjE3OTk3NThlOThkIiwidmVyIjoiMS4wIiwiaWF0IjoxNzIzNDkxNzA4fQ.Tkzc8Y6y4iV9pcirXoHDpSDWjggrmdcSJGggCSkBYr9fJgWz8p5o9_R7M4fLfpzSTduD-g-q1O6-3xn-kYj_PSgbUwjKrSm2K3QZsm_NGvWbTXXdc0BYhUA0gaOUHAVgLrGUiuVmtsJGOY2Mjv-iaM7GSN4p9EJ_KmmVRGaZ39SGVuemSyiL5CfNV7Vvl6S9cdUZahJfDTAKonj8uZnJXzXQHhrN05br11icL3wQ7UerX3nNNLjLgXzQSp-ajxgEYM1JslI2VKuZGDgtxfIdceecP524HcYIKYqppIRc0BaFjdQ5ABfn2gwGnlyTvxTvAHCtu0dkEoQOFGhZRdm_Bw`;

  try {
    const response = await axios.get(url, config);

    console.log(response);

    const teeTimes = response.data.availableTeeSlots;

    for (const item of teeTimes) {
      for (const dateEntry of item.slots) {
        if (dateEntry.availability >= 2) {
          console.log(dateEntry.scheduleDateTime);
          await sendSMS(dateEntry.scheduleDateTime, dateEntry.availability);
        }
      }
    }

  } catch (error) {
    console.error(error);
  }
}

const sendSMS = async (teeTime, availability) => {
  try {
    // Send the SMS
    await smsClient.messages.create({
      body: `Kiawah Ocean Course Tee Time at ${teeTime} for ${availability} is now available`,
      to: '+18023737297', // Recipient's phone number
      from: '+18449764183'//process.env.TWILIO_FROM, // Your Twilio number
    });
    console.log(`Tee Time Found! SMS sent`);
  } catch (error) {
    console.log(`Error sending SMS:`, error);
  }
};


// Check tee times and notify users
const checkTeeTimes = async () => {
  try {
    var courseTeeTimes = await getTeeTimes();
  } catch (err) {
    logger.error("Error getting database connection:", err);
  }
};

//Run the function if this script is executed directly
if (require.main === module) {
  (async () => {
    const start = Date.now(); // Record the start time
    await checkTeeTimes();
    const end = Date.now(); // Record the end time
    const duration = (end - start) / 1000; // Calculate the duration
    console.log(`checkTeeTimesDuration: ${duration}s`); // Log the duration
    process.exit();
  })();
}

// Export the checkTeeTimes function for use in other modules
module.exports = {
  checkTeeTimes,
};
