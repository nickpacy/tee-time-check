const axios = require('axios');
const moment = require("moment");
const util = require('./utility');

async function getTeeTimes(bookingClass, dayOfWeek, numPlayers) {
  const formattedClosestDay = util.getClosestDayOfWeek(dayOfWeek, 'YYYY-MM-DD');
  const url = `https://go.teeitup.golf/bookajax.pl?ct=dt&engid=${bookingClass}&d=${formattedClosestDay}`;

  // Check if the date is not the current date or tomorrow
  const today = new Date();
  const tomorrow = new Date(today);
  tomorrow.setDate(today.getDate() + 1);

  if (!isCurrentOrTomorrow(formattedClosestDay, today, tomorrow)) {
    return []; // Return an empty array if the date is not the current date or tomorrow
  }

  try {
    const response = await axios.get(url);
    const teeTimes = response.data.times.map(item => {
      return {
        time: moment(formattedClosestDay + ' ' + item.time).format('YYYY-MM-DD HH:mm'),
        available_spots: item.qty
      };
    });

    // const filteredTimes = teeTimes.filter(({ available_spots }) => available_spots >= numPlayers);
    
    return teeTimes;
  } catch (error) {
    console.error(error);
    return []; // Return an empty array in case of an error
  }
}

// Function to check if a date is the current date or tomorrow
function isCurrentOrTomorrow(checkingDate, today, tomorrow) {
    const formattedToday = moment(today).format('YYYY-MM-DD');
    const formattedTomorrow = moment(tomorrow).format('YYYY-MM-DD');
  
    const isToday = checkingDate === formattedToday;
    const isTomorrow = checkingDate === formattedTomorrow;
    const isPast6PM = today.getHours() >= 18; // 6 PM (24-hour format)
  
    const nextDay = moment(tomorrow).add(1, 'day');
    const isDayAfterTomorrow = checkingDate === nextDay.format('YYYY-MM-DD');
  
    return isToday || isTomorrow || (isPast6PM && isDayAfterTomorrow);
}

module.exports = {
    getTeeTimes
};


// # 0-2 Days Out
// # engid=20610

// # 3-14 Days Out
// # engid=20066