const axios = require('axios');
const moment = require("moment");
const util = require('./utility');

async function getTeeTimes(bookingClass, dayOfWeek, numPlayers) {
  const formattedClosestDay = util.getClosestDayOfWeek(dayOfWeek, 'MMM D YYYY');
  const url = `https://www.golfnow.com/api/tee-times/tee-time-results`;
  
  const headers = {};

  const data = {
    "SearchType": "Facility",
    "Date": formattedClosestDay,
    "FacilityId": bookingClass,
    "View": "Grouping"
  };

  try {
    const response = await axios.post(url, data, { headers });

    // console.log(response.data.ttResults.teeTimes);
    // return false;

    if (response.status === 200) {
        const formattedData = response.data.ttResults.teeTimes.map(teetime => ({
            time: moment(teetime.time).format('YYYY-MM-DD HH:mm'),
            available_spots: teetime.maxPlayers,
            green_fee: teetime.minTeeTimeRate
        }));

        // const filteredTimes = formattedData.filter(({ available_spots }) => available_spots >= numPlayers);
        console.log(formattedData)
        return formattedData;
    } else {
        console.error(`Error retrieving tee times. Status code: ${response}`);
        return []; // Return an empty array in case of an error
    }

  } catch (error) {
    console.error(error);
    return []; // Return an empty array in case of an error
  }
}

// module.exports = {
//   getTeeTimes
// };

let i = getTeeTimes(3069, 6, 0);
console.log(i);