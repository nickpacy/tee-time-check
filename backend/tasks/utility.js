const moment = require('moment-timezone');

const getClosestDayOfWeek = (dayOfWeek, dateFormat = 'MM-DD-YYYY') => {
  const currentDate = moment().tz('America/Los_Angeles');

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

module.exports = {
    getClosestDayOfWeek
};