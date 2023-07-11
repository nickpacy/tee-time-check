const cheerio = require("cheerio");
const axios = require("axios");
const moment = require("moment");
const util = require('./utility');


async function getTeeTimes(bookingClass, dayOfWeek, numPlayers, startTime) {
  const formattedClosestDay = util.getClosestDayOfWeek(dayOfWeek, 'MM/DD/YYYY');
  const formattedStartTime = moment.utc(startTime, 'HH:mm:ss').clone().tz('America/Los_Angeles').format('hh:mm A');
  const url = `https://myffr.navyaims.com/navywest/wbwsc/navywest.wsc/search.html?Action=Start&secondarycode=${bookingClass}&numberofplayers=${numPlayers}&begindate=${formattedClosestDay}&begintime=${formattedStartTime}&numberofholes=18&reservee=&display=Listing&sort=Time&search=yes&page=1&module=GR&multiselectlist_value=&grwebsearch_buttonsearch=yes`;

  try {
    const response = await axios.get(url);
    if (response.status === 200) {
      const html = response.data;
      const $ = cheerio.load(html);

      const tableRows = $('#grwebsearch_output_table tbody tr');
      const teeTimes = [];

      tableRows.each((index, element) => {
        const row = $(element);
        const time = row.find('[data-title="Time"]').text().trim();
        const date = row.find('[data-title="Date"]').text().trim();
        const holes = row.find('[data-title="Holes"]').text().trim();
        const course = row.find('[data-title="Course"]').text().trim();
        const openSlots = row.find('[data-title="Open Slots"]').text().trim();
        const availableSlots = row.find('[data-title="Available Slots"]').text().trim();
        
        const mappedTeeTime = {
          time: moment(date + ' ' + time, 'MM/DD/YYYY h:mm a').format('YYYY-MM-DD HH:mm'),
          available_spots: openSlots
        };

      
        teeTimes.push(mappedTeeTime);
      });

      return [teeTimes, url];
    } else {
      console.error(response.status);
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