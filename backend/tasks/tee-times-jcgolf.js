const axios = require('axios');
const moment = require("moment");
const util = require('./utility');
const crypto = require('crypto');

async function getJCToken(websiteId, bookingPrefix) {
  const tokenUrl = `https://jcg${bookingPrefix}.cps.golf/identityapi/myconnect/token/short`;
  const tokenHeaders = {
    "Content-Type": "application/x-www-form-urlencoded",
    "x-websiteid": websiteId
  };
  const body = new URLSearchParams({
    grant_type: "client_credentials",
    client_id: "onlinereswebshortlived",
    scope: "onlinereservation references",
  });

  try {
    const tokenResponse = await axios.post(tokenUrl, body, { headers: tokenHeaders });
    const token = tokenResponse.data.access_token;

     const url = `https://jcg${bookingPrefix}.cps.golf/onlineres/onlineapi/api/v1/onlinereservation/RegisterTransactionId`;

      const headers = {
        "x-apiKey": "8ea2914e-cac2-48a7-a3e5-e0f41350bf3a",
        "x-componentid": "1",
        "x-productid": "1",
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`,
      };
      const transactionId = crypto.randomUUID();
      const bodyData = {
        "transactionId": transactionId,
      };

      try {
        const response = await axios.post(url, bodyData, { headers });

        if (response.status === 200) {
          // return bearerToken and transactionId;
          return { token, transactionId };
        } else {
          console.error(`Error retrieving JC Golf token. Status code: ${response}`);
          return null; // Return null in case of an error
        }
      } catch (error) {
        console.error(error);
        return null; // Return null in case of an error
      }

    // return token;
  } catch (error) {
    console.error(error);
    return null; // Return null in case of an error
  }

 
}

async function getTeeTimes(bookingClass, dayOfWeek, numPlayers, bookingPrefix, websiteId, isFirstJCGolf, jcGolfAuth) {
  if (!jcGolfAuth?.token || !jcGolfAuth?.transactionId) {
    console.error("Missing JC Golf auth (token/transactionId)");
    return [];
  }
  // If it's not the first call to jcgolf, wait for 1.2 seconds
  if (!isFirstJCGolf) {
    await new Promise(resolve => setTimeout(resolve, 1200));
  } else {
    // Get Token for the first call to jcgolf
  }

  const formattedClosestDay = util.getClosestDayOfWeek(dayOfWeek, 'ddd MMM D YYYY');
  const bearerToken = jcGolfAuth.token;
  const transactionId = jcGolfAuth.transactionId;

  try {
    const url = `https://jcg${bookingPrefix}.cps.golf/onlineres/onlineapi/api/v1/onlinereservation/TeeTimes?searchDate=${formattedClosestDay}&holes=18&numberOfPlayer=0&courseIds=${bookingClass}&searchTimeType=0&teeOffTimeMin=0&teeOffTimeMax=23&teeSheetSearchView=5&classCode=R&transactionId=${transactionId}`;
    const headers = {
      "Content-Type": "application/json",
      "client-id": "onlineresweb",
      "X-Terminalid": "3",
      "x-siteid": "16",
      "x-Componentid": "1",
      "x-Productid": "1",
      "x-Requestid": crypto.randomUUID(),
      // "x-Websiteid": websiteId, // "x-Requestid": websiteId, Need to figure this part out, need to get the JC token.
      "x-terminalid": 3,
      "x-timezone-offset": 480,
      "Authorization": `Bearer ${bearerToken}`,
    };

    const response = await axios.get(url, { headers });
    if (response.status === 200) {
        const teeTimes = response.data;

        if (teeTimes.messageKey == 'NO_TEETIMES') {
          return [];
        }

        const rawList = Array.isArray(teeTimes?.content)
        ? teeTimes.content
        : Array.isArray(teeTimes)
          ? teeTimes
          : [];

        if (!Array.isArray(rawList)) {
          console.error("Unexpected JC Golf payload shape", teeTimes);
          return [];
        }

        return rawList.map(teeTime => ({
          time: moment(teeTime.startTime).format('YYYY-MM-DD HH:mm'),
          available_spots: teeTime.maxPlayer
        }));
  
        // Extract desired fields
        // const formattedData = teeTimes.content.map(teeTime => ({
        //   time: moment(teeTime.startTime).format('YYYY-MM-DD HH:mm'),
        //   available_spots: teeTime.maxPlayer
        // }));
  
        // const filteredTimes = formattedData.filter(({ available_spots }) => available_spots >= numPlayers);
  


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
    getTeeTimes,
    getJCToken
};
