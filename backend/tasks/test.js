// Download the helper library from https://www.twilio.com/docs/node/install
// Find your Account SID and Auth Token at twilio.com/console
// and set the environment variables. See http://twil.io/secure
const dotenv = require("dotenv");
const twilio = require('twilio')
const fs = require('fs');
dotenv.config();
const smsClient = new twilio(
    process.env.TWILIO_SID,
    process.env.TWILIO_AUTH_TOKEN
  );

  // Define the start and end dates for filtering
  const startDate = new Date('2024-01-01'); // Example: Start date
  const endDate = new Date('2024-05-01');   // Example: End date

  const messagesPromise = smsClient.messages.list({
    dateSentAfter: startDate.toISOString(), // Convert dates to ISO format
    dateSentBefore: endDate.toISOString()
  });

  messagesPromise.then(messages => {
      const messageLogs = messages.map(message => {
          return {
              sid: message.sid,
              dateSent: message.dateSent,
              from: message.from,
              to: message.to,
              body: message.body,
              price: message.price
          };
      });
  
      const logFilePath = 'twilio_messages.log';
      fs.writeFile(logFilePath, JSON.stringify(messageLogs, null, 2), err => {
          if (err) {
              console.error('Error writing to file:', err);
          } else {
              console.log('Messages written to', logFilePath);
          }
      });
  }).catch(error => {
      console.error('Error retrieving messages:', error);
  });