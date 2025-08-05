const moment = require('moment-timezone');
const crypto = require("crypto");

const ENCRYPTION_KEY = crypto.scryptSync('AlgoteeEncyrpt', 'andthesaltis', 32); // change 'Your Super Secret Passphrase' and 'salt'
const IV_LENGTH = 16; // For AES, this is always 16

const getClosestDayOfWeek = (dayOfWeek, dateFormat = 'MM-DD-YYYY', timeZone = 'America/Los_Angeles') => {
  const currentDate = moment().tz(timeZone);

  let closestDayOfWeek = currentDate.clone().isoWeekday(dayOfWeek);

  // If the closest day is in the past or today after 7 PM,
  // add 7 days to get the next closest day of the week
  if (
    closestDayOfWeek.isSameOrBefore(currentDate) ||
    (closestDayOfWeek.isSame(currentDate, 'day') && currentDate.hours() >= 19)
  ) {
    closestDayOfWeek.add(7, 'days');
  }

  return closestDayOfWeek.format(dateFormat);
};

// Format start and end times based on timezone
const formatTimesForTimezone = (startTime, endTime, timeZone) => {
  const formattedStartTime = moment.utc(startTime, "HH:mm:ss").clone().tz(timeZone).format("HH:mm:ss");
  const formattedEndTime = moment.utc(endTime, "HH:mm:ss").clone().tz(timeZone).format("HH:mm:ss");
  return [formattedStartTime, formattedEndTime];
};

// Format tee time dates
const getTeeTimeDateRange = (closestDate, formattedStartTime, formattedEndTime) => {
  const teeTimeStartDate = moment(`${closestDate} ${formattedStartTime}`, "MM-DD-YYYY HH:mm:ss").format("YYYY-MM-DD HH:mm");
  let teeTimeEndDate = moment(`${closestDate} ${formattedEndTime}`, "MM-DD-YYYY HH:mm:ss").format("YYYY-MM-DD HH:mm");
  if (moment(teeTimeEndDate).isBefore(teeTimeStartDate)) {
    teeTimeEndDate = moment(teeTimeEndDate).add(1, "day").format("YYYY-MM-DD HH:mm");
  }
  return [teeTimeStartDate, teeTimeEndDate];
};

function encrypt(text) {
    let iv = crypto.randomBytes(IV_LENGTH);
    let cipher = crypto.createCipheriv('aes-256-gcm', ENCRYPTION_KEY, iv);
    let encrypted = cipher.update(text);
    let finalBuffer = Buffer.concat([encrypted, cipher.final()]);
    let authTag = cipher.getAuthTag();
    return Buffer.concat([iv, finalBuffer, authTag]).toString('base64'); // returns base64 string
}

function decrypt(text) {
    let buffer = Buffer.from(text, 'base64');
    let iv = buffer.slice(0, IV_LENGTH);
    let encryptedText = buffer.slice(IV_LENGTH, buffer.length - 16); // excluding auth tag
    let authTag = buffer.slice(buffer.length - 16);
    let decipher = crypto.createDecipheriv('aes-256-gcm', ENCRYPTION_KEY, iv);
    decipher.setAuthTag(authTag);
    let decrypted = decipher.update(encryptedText);
    return Buffer.concat([decrypted, decipher.final()]).toString();
}


module.exports = {
    getClosestDayOfWeek,
    formatTimesForTimezone,
    getTeeTimeDateRange,
    encrypt,
    decrypt
};