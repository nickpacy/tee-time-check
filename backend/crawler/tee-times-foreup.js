const axios = require('axios');

const util = require('./utility');

async function getTeeTimes(bookingClass, dayOfWeek, numPlayers, scheduleId) {

  const formattedClosestDay = util.getClosestDayOfWeek(dayOfWeek);
  const url = `https://foreupsoftware.com/index.php/api/booking/times?time=all&date=${formattedClosestDay}&holes=all&players=${numPlayers}&booking_class=${bookingClass}&schedule_id=${scheduleId}&api_key=no_limits`;
  
  const headers = {
    // Accept: 'application/json, text/javascript, */*; q=0.01',
    // 'Accept-Encoding': 'gzip, deflate, br',
    // 'Accept-Language': 'en-US,en;q=0.9',
    // 'Api-key': 'no_limits',
    // Connection: 'keep-alive',
    // Cookie: '__stripe_mid=34c0315b-9c51-40d2-9c40-d80718da421b17c605; _ga=GA1.1.1702671108.1688783591; _ga_Y0N3BHPPWG=GS1.1.1689050375.6.1.1689050952.0.0.0; _gid=GA1.2.190563413.1688962853; _ga_YQELGE3154=GS1.1.1688790903.2.1.1688790966.0.0.0; _gcl_au=1.1.399978935.1688783591; _ga_JW6P39ZCJ8=GS1.2.1688780584.2.1.1688780725.0.0.0; PHPSESSID=6hn846784vmdccsu3biqf54rub',
    // Host: 'foreupsoftware.com',
    // Referer: 'https://foreupsoftware.com/index.php/booking/19347/1487',
    // 'Sec-Fetch-Dest': 'empty',
    // 'Sec-Fetch-Mode': 'cors',
    // 'Sec-Fetch-Site': 'same-origin',
    // 'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.5.1 Safari/605.1.15',
    'X-Authorization': 'Bearer eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzUxMiJ9.eyJpc3MiOiJmb3JldXBzb2Z0d2FyZS5jb20iLCJhdWQiOiJmb3JldXBzb2Z0d2FyZS5jb20iLCJpYXQiOjE2ODkwNTExNjMsImV4cCI6MTY5MTY0MzE2MywidWlkIjoiMTM3NzAyMTMiLCJsZXZlbCI6MCwiY2lkIjoiMTkzNDgiLCJlbXBsb3llZSI6ZmFsc2UsImlzX3Zpc2l0b3IiOnRydWV9.ghwkhM9u5xsUq0bVIaDpQV7Sn8apwDOOghgGL--kHz4P2h2Ul4t29IAwp_4qmuCRDO_Kg68Ml6RQLxHcNtJDRA',
    // 'X-Fu-Golfer-Location': 'foreup',
    // 'X-Requested-With': 'XMLHttpRequest'
  };

  try {
    const response = await axios.get(url, { headers });
    const teeTimes = response.data.map(item => {
      return {
        time: item.time,
        available_spots: item.available_spots
      };
    });
    
    return teeTimes;
  } catch (error) {
    console.error(error);
    return []; // Return an empty array in case of an error
  }
}

module.exports = {
    getTeeTimes
};


// '1', 'Torrey Pines South', '1138', '1487', 'foreup', 'torrey-pines-south.png'
// '2', 'Torrey Pines North', '1138', '1468', 'foreup', 'torrey-pines-north.png'
