const axios = require('axios');
const moment = require("moment");
const util = require('./utility');

async function getTeeTimes(bookingClass, dayOfWeek, numPlayers, bookingPrefix, websiteId, isFirstJCGolf) {

  // If it's not the first call to jcgolf, wait for 1.2 seconds
  if (!isFirstJCGolf) {
    await new Promise(resolve => setTimeout(resolve, 1200));
  }

  const formattedClosestDay = util.getClosestDayOfWeek(dayOfWeek, 'ddd MMM D YYYY');

  try {
    const url = `https://jcg${bookingPrefix}.cps.golf/onlineres/onlineapi/api/v1/onlinereservation/TeeTimes?searchDate=${formattedClosestDay}&holes=18&numberOfPlayer=0&courseIds=${bookingClass}&searchTimeType=0&teeOffTimeMin=0&teeOffTimeMax=23&teeSheetSearchView=5&classCode=R`;
    const headers = {
      'x-apiKey': '8ea2914e-cac2-48a7-a3e5-e0f41350bf3a',
      'x-componentid': '1',
      'x-websiteid': websiteId
    };

    const response = await axios.get(url, { headers });
    if (response.status === 200) {
        const teeTimes = response.data;

        if (teeTimes.messageKey == 'NO_TEETIMES') {
          return [];
        }
  
        // Extract desired fields
        const formattedData = teeTimes.map(teeTime => ({
          time: moment(teeTime.startTime).format('YYYY-MM-DD HH:mm'),
          available_spots: teeTime.maxPlayer
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