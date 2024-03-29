const axios = require('axios');
const moment = require("moment");
const util = require('./utility');
require('moment-timezone');

async function getTeeTimes(bookingAlias, dayOfWeek, numPlayers, timeZone) {
  const formattedClosestDay = util.getClosestDayOfWeek(dayOfWeek, 'YYYY-MM-DD');
  const url = `https://phx-api-be-east-1b.kenna.io/v2/tee-times?date=${formattedClosestDay}`;
  
  const twoDaysOut = moment().tz(timeZone).add(3, 'days').startOf('day');
  
  // Convert both dates to 'YYYY-MM-DD' format for comparison
  const formattedInputDate = moment.utc(formattedClosestDay).format('YYYY-MM-DD');
  const formattedTwoDaysOut = twoDaysOut.format('YYYY-MM-DD');
  
  const isSameOrAfter = formattedInputDate >= formattedTwoDaysOut;

  let bp  = bookingAlias;

  if (isSameOrAfter && bp == "coronado-gc-0-1-be") {
    bp = "coronado-gc-3-14-be"
  }

  const headers = {
    'x-be-alias': bp
  };

  try {
    const response = await axios.get(url, { headers });

    if (response.status === 200) {
        const formattedData = response.data[0].teetimes.map(teetime => ({
            time: moment(teetime.teetime).tz(timeZone).format('YYYY-MM-DD HH:mm'),
            available_spots: teetime.maxPlayers
        }));

        const filteredTimes = formattedData.filter(({ available_spots }) => available_spots >= numPlayers);
        return filteredTimes;
    } else {
        console.error(`Error retrieving tee times. Status code: ${response}`);
        return []; // Return an empty array in case of an error
    }

  } catch (error) {
    console.error(error);
    return []; // Return an empty array in case of an error
  }
}

module.exports = {
  getTeeTimes
};