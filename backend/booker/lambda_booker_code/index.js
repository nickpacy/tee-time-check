const { loginToBooker } = require('./lambda-playwright');

exports.handler = async (event) => {
    const { userId, bookingLink, date, time } = event;

    try {
        await loginToBooker({ userId, bookingLink, date, time });
        return {
            statusCode: 200,
            body: JSON.stringify({ message: 'Booking process completed successfully.' }),
        };
    } catch (error) {
        console.error('Error processing booking:', error);
        return {
            statusCode: 500,
            body: JSON.stringify({ message: 'An error occurred during the booking process.', error: error.message }),
        };
    }
};
