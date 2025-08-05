const axios = require('axios');
const moment = require("moment");
const util = require('./utility');
require('moment-timezone');

async function getTeeTimes(websiteId, bookingClass, scheduleId, dayOfWeek, numPlayers) {
  const formattedClosestDay = util.getClosestDayOfWeek(dayOfWeek, 'YYYY-MM-DD');
  var url = `https://www.chronogolf.com/marketplace/clubs/${websiteId}/teetimes?date=${formattedClosestDay}&course_id=${scheduleId}&nb_holes=18`;
  for (let index = 0; index < numPlayers; index++) {
    url += `&affiliation_type_ids%5B%5D=${bookingClass}`;
  }


  const headers = {};

  try {
    const response = await axios.get(url, { headers });

    if (response.status === 200) {
        const formattedData = response.data.map(teetime => ({
          time: moment(teetime.date + ' ' + teetime.start_time).format("YYYY-MM-DD HH:mm"),
          available_spots: teetime.green_fees?.length
        }));

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