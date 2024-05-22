const { loginToBooker } = require('./lambda-playwright');

// Simulate the event object that AWS Lambda would receive
const event = {
  body: JSON.stringify({
    courseName: "Torrey Pines South",
    courseAbbr: "TPS",
    date: "04-18-2024",
    time: "4:50pm",
    available_spots: 2,
    userId: 1,
    bookingLink: "https://foreupsoftware.com/index.php/booking/19347/1487#/teetimes"
  })
};

async function runTest() {
    // Parse the event body to simulate the input
    const teeTimeData = JSON.parse(event.body);
    
    // Call the function with the parsed data
    try {
        await loginToBooker(teeTimeData);
    } catch (error) {
        console.error("Error during function execution:", error);
    }
}

runTest();
