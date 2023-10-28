const { loginToBooker } = require('./lambda-booker'); // Rename 'your_script_name' to the actual name of your script

exports.handler = async (event, context) => {
    // AWS Lambda now uses Node.js' async/await. The runtime waits until the event loop is empty before freezing the process and returning the results to the caller.

    console.log("Lambda invoked with event:", event);

    // Assuming teeTimeData is passed in the event body as JSON
    let teeTimeData;
    try {
        teeTimeData = JSON.parse(event.body);
    } catch (error) {
        return {
            statusCode: 400,
            body: JSON.stringify({
                message: "Invalid input format. Expected JSON."
            })
        };
    }

    try {
        await loginToBooker(teeTimeData);
        return {
            statusCode: 200,
            body: JSON.stringify({
                message: "Successfully executed loginToBooker."
            })
        };
    } catch (error) {
        console.error("Error executing loginToBooker:", error);
        return {
            statusCode: 500,
            body: JSON.stringify({
                message: `Error: ${error.message}`
            })
        };
    }
};