const { bookTeeTime } = require('./book-torrey-script');

async function runMultipleBookings() {
    const bookingParameters = [
        { time: "3:15pm", courseClass: "1468" }, //North
        { time: "3:00pm", courseClass: "1468" }, //North
        { time: "2:00pm", courseClass: "1468" }, //North
        
        { time: "3:15pm", courseClass: "1467" }, //South
        { time: "3:00pm", courseClass: "1467" }, //South
        { time: "2:00pm", courseClass: "1467" } //South
    ];

    const bookingPromises = bookingParameters.map(params => bookTeeTime(params.time, params.courseClass));

    await Promise.all(bookingPromises);
}

runMultipleBookings();