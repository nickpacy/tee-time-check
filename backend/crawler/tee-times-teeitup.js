const axios = require('axios');
const moment = require("moment");
const util = require('./utility');

async function getTeeTimes(bookingAlias, dayOfWeek, numPlayers) {
  const formattedClosestDay = util.getClosestDayOfWeek(dayOfWeek, 'YYYY-MM-DD');
  const url = `https://phx-api-be-east-1b.kenna.io/v2/tee-times?date=${formattedClosestDay}`;
  
  const headers = {
    'x-be-alias': bookingAlias
  };

  try {
    const response = await axios.get(url, { headers });

    console.log(response);

    if (response.status === 200) {
        const formattedData = response.data[0].teetimes.map(teetime => ({
            time: moment(teetime.teetime).tz('America/Los_Angeles').format('YYYY-MM-DD HH:mm'),
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