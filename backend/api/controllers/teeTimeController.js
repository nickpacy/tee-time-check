const pool = require('../database');
const axios = require('axios');
const cheerio = require("cheerio");
const moment = require('moment');
const path = require("path"); 
const dotenv = require("dotenv"); 
require('moment-timezone');

// Construct the path to the .env file one level up
const dotenvPath = path.resolve(__dirname, '..', '.env');

// Load the environment variables from the .env file
const result = dotenv.config({ path: dotenvPath });

if (result.error) {
  console.error('Error loading .env file:', result.error);
} else {
  console.log('.env file loaded successfully');
}

// API to search for TEE TIMES
const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

const searchTeeTimes = async (req, res) => {
    try {
        const { courseIds, date, startTime, endTime, numPlayers } = req.body;

        // Query the courses table for the provided courseIds
        const courses = await getCoursesByIds(courseIds);

        const promises = [];

        for (const course of courses) {
            switch (course.Method) {
                case 'foreup':
                    promises.push(getTeeTimes_foreup(date, course.BookingClass, course.ScheduleId));
                    break;
                case 'jcgolf':
                    const lastPromise = promises[promises.length - 1] || Promise.resolve();
                    const delayedPromise = lastPromise
                        .then(() => delay(1200))
                        .then(() => getTeeTimes_jcgolf(date, course.BookingClass, course.BookingPrefix, course.WebsiteId));
                    promises.push(delayedPromise);
                    break;
                case 'navy':
                    promises.push(getTeeTimes_navy(date, course.BookingClass, numPlayers, startTime)
                        .then(navyTimes => {
                            course.BookingUrl = navyTimes[1];
                            return navyTimes[0];
                        }));
                    break;
                case 'teeitup':
                    promises.push(getTeeTimes_teeitup(date, course.BookingPrefix));
                    break;
                case 'coronado':
                  const currentDate = moment().startOf('day'); // This will include the current time
                  const twoDaysOut = moment().add(3, 'days').startOf('day'); // Set it to the start of the day (midnight) three days from now
                  
                  if (moment(date).isSameOrAfter(currentDate) && moment(date).isBefore(twoDaysOut)) {
                      promises.push(getTeeTimes_coronado(date, course.BookingClass)
                          .then(coronadoTimes => {
                              if (!coronadoTimes[1]) {
                                  return getTeeTimes_coronado(date, '20066').then(times => times[0]);
                              } else {
                                return coronadoTimes[0];
                              }
                          }));
                  } else {
                      promises.push(getTeeTimes_coronado(date, '20066').then(times => times[0]));
                  }
                  break;
                default:
                    promises.push(Promise.resolve([]));
                    break;
            }
        }

        const teeTimesArrays = await Promise.all(promises);

        let teeTimesResults = [];
        teeTimesArrays.forEach((teeTimes, idx) => {
            teeTimes = teeTimes.map(item => ({
                ...item,
                course: courses[idx]
            }));
            teeTimesResults.push(...teeTimes);
        });

        // Filtering logic 
        const filteredTeeTimes = teeTimesResults.filter(teeTime => {
            const startDateTime = moment(`${date} ${startTime}`, 'YYYY-MM-DD HH:mm');
            const endDateTime = moment(`${date} ${endTime}`, 'YYYY-MM-DD HH:mm');
            const teeTimeMoment = moment(teeTime.time, 'YYYY-MM-DD HH:mm');

            return teeTimeMoment.isSameOrAfter(startDateTime)
                && teeTimeMoment.isSameOrBefore(endDateTime)
                && teeTime.available_spots >= numPlayers;
        });

        res.json(filteredTeeTimes);

    } catch (error) {
        res.status(500).json({ error: 'Failed to get tee times', details: error.message });
    }
};


async function getCoursesByIds(courseIds) {
    if (!Array.isArray(courseIds) || courseIds.length === 0) {
        throw new Error('Invalid courseIds');
    }

    try {
        // Construct the query with the appropriate number of placeholders based on courseIds length
        const query = `SELECT * FROM courses WHERE Active = 1 AND CourseId IN (${Array(courseIds.length).fill('?').join(',')})`;

        const rows = await pool.query(query, courseIds);
        if (rows.length === 0) {
            throw new Error('Courses not found');
        }
        return rows;
    } catch (error) {
        console.error('Error getting courses: ', error);
        throw error;
    }
}



async function getTeeTimes_foreup(date, bookingClass, scheduleId) {
    const formattedClosestDay = moment(date).format('MM-DD-YYYY');
    const url = `https://foreupsoftware.com/index.php/api/booking/times?time=all&date=${formattedClosestDay}&holes=all&booking_class=${bookingClass}&schedule_id=${scheduleId}&api_key=no_limits`;
    
    const headers = {
      'X-Authorization': `Bearer ${process.env.FOREUP_BEARER}`
    };
  
    try {
      const response = await axios.get(url, { headers });
      const teeTimes = response.data.map(item => {
        return {
          time: item.time,
          available_spots: item.available_spots,
          green_fee: item.green_fee
        };
      });
      
      return teeTimes;
    } catch (error) {
      console.error(error);
      return []; // Return an empty array in case of an error
    }
}

async function getTeeTimes_jcgolf(date, bookingClass, bookingPrefix, websiteId) {

    const formattedClosestDay = moment(date).format('MM-DD-YYYY');

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
          available_spots: teeTime.maxPlayer,
          green_fee: teeTime.shItemPrices[0].price
        }));
  
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

async function getTeeTimes_navy(date, bookingClass, numPlayers, startTime) {
  const formattedClosestDay = moment(date).format('MM/DD/YYYY');
  const formattedStartTime = moment(startTime, 'HH:mm').format('hh:mm A');
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

async function getTeeTimes_teeitup(date, bookingPrefix) {
  const formattedClosestDay = moment(date).format('YYYY-MM-DD');
  const url = `https://phx-api-be-east-1b.kenna.io/v2/tee-times?date=${formattedClosestDay}`;
  
  const headers = {
    'x-be-alias': bookingPrefix
  };

  try {
    const response = await axios.get(url, { headers });

    if (response.status === 200) {
        
        const formattedData = response.data[0].teetimes.map(teetime => {
            let greenFee = teetime.rates[0].greenFeeWalking ? teetime.rates[0].greenFeeWalking : teetime.rates[0].greenFeeCart;
            greenFee = Math.floor(greenFee / 100);
            
            return {
                time: moment(teetime.teetime).tz('America/Los_Angeles').format('YYYY-MM-DD HH:mm'),
                available_spots: teetime.maxPlayers,
                green_fee: greenFee
            }
        });

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

async function getTeeTimes_coronado(date, bookingClass) {
  const formattedClosestDay = moment(date).format('YYYY-MM-DD');
  const url = `https://go.teeitup.golf/bookajax.pl?ct=dt&engid=${bookingClass}&d=${formattedClosestDay}`;

  try {
    const response = await axios.get(url);
    if (response.status === 200) {
        if (response.data.code == '403') {
            // console.log(`Coronado: ${response.data.message}. Trying the Booking fees.`);
            return [[], false];
        } else {
            const teeTimes = response.data.times.map(item => {
                return {
                    time: moment(formattedClosestDay + ' ' + item.time).format('YYYY-MM-DD HH:mm'),
                    available_spots: item.qty,
                    green_fee: item.Rates[0].formprice.replace("$", "")
                };
            });
            return [teeTimes, true];
        }
    } else {
        console.error("Error from Coronado", error);
        return [[], true];
    }
  } catch (error) {
    console.error(error);
    return [[], true]; // Return an empty array in case of an error
  }
}

// // Mock the request object with the required body properties.
// const mockReq = {
//     body: {
//         courseIds: [1,2,3,4,5,7],  // Example course IDs
//         date: '2023-08-09',   // Example date
//         startTime: '08:00',   // Example start time
//         endTime: '12:00',     // Example end time
//         numPlayers: 1         // Example number of players
//     }
// };

// // Mock the response object.
// const mockRes = {
//     status: function(statusCode) {
//         this.statusCode = statusCode;
//         return this;
//     },
//     json: function(data) {
//         console.log('Response:', data);
//         return data;
//     }
// };

// // Call the searchTeeTimes function with the mock request and response.
// searchTeeTimes(mockReq, mockRes);

module.exports = {
    searchTeeTimes
}


