const AWS = require('aws-sdk');
const lambda = new AWS.Lambda();

const booker = require("../booker/lambda-booker");

const invokeBooker = async (teeTimeData) => {
    const reformattedData = reformatTeeTimeData(teeTimeData);

    console.log(reformattedData);
    const invokeParams = {
        FunctionName: 'LambdaBFunctionName',
        InvocationType: 'Event', // This invokes the function asynchronously. Use 'RequestResponse' for synchronous execution.
        Payload: JSON.stringify(reformattedData)
    };

    try {
        booker.loginToBooker(reformattedData);
        // const response = await lambda.invoke(invokeParams).promise();
        // console.log('LambdaB invoked:', response);
        // return response;
    } catch (error) {
        console.error('Failed to invoke LambdaB:', error);
        throw error;
    }
};

const reformatTeeTimeData = (teeTimeData) => {
    // Split the teeTime string into date and time components
    const [dateStr, timeStr] = teeTimeData.teeTime.split(' ');

    // Convert date format to MM-dd-yyyy
    const [year, month, day] = dateStr.split('-');
    const formattedDate = `${month}-${day}-${year}`;

    // Convert 24-hour time format to 12-hour format with AM/PM
    let [hours, minutes] = timeStr.split(':');
    hours = parseInt(hours, 10);
    const suffix = hours >= 12 ? 'pm' : 'am';
    hours = (hours > 12) ? hours - 12 : hours;
    const formattedTime = `${hours}:${minutes}${suffix}`;

    return {
        date: formattedDate,
        time: formattedTime,
        bookingLink: teeTimeData.bookingLink,
        userId: teeTimeData.userId
    };
};

module.exports = {
    invokeBooker
};