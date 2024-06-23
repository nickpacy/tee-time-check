const axios = require('axios');
const moment = require("moment");
const util = require('./utility');

async function getTeeTimes(bookingClass, dayOfWeek, numPlayers) {
  const formattedClosestDay = util.getClosestDayOfWeek(dayOfWeek, 'MMM D YYYY');
  const url = `https://www.golfnow.com/api/tee-times/tee-time-results`;
  
  const headers = {};

  const data = {
    "SearchType": 1,
    "Date": formattedClosestDay,
    "FacilityId": bookingClass,
    "View": "Grouping"
  };

  try {
    const response = await axios.post(url, data, { headers });

    if (response.status === 200) {
      const formattedData = response.data.ttResults.teeTimes.map(teetime => {

        var availableSpots;

        switch (teetime.playerRule) {
            case 1:
                availableSpots = 1;
                break;
            case 3:
                availableSpots = 2;
                break;
            case 7:
                availableSpots = 3;
                break;
            case 14:
            case 15:
                availableSpots = 4;
                break;
            default:
                availableSpots = 5; // Or handle the default case as needed
                break;
        }

        return {
          time: moment(teetime.time).format('YYYY-MM-DD HH:mm'),
          available_spots: availableSpots
        }
      });

      // const filteredTimes = formattedData.filter(({ available_spots }) => available_spots >= numPlayers);
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

module.exports = {
  getTeeTimes
};