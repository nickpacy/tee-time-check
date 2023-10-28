const dotenv = require("dotenv"); // Environment variable management library
const cron = require("node-cron"); // Cron job scheduler
const main = require("./tee-times-main");

exports.handler = async (event, context) => {
    // Your code here
    console.log("Package started");
    
    try {
        await main.checkTeeTimes();
    } catch (e) {
        console.error(e);
    }
};

main.checkTeeTimes();

// // Load environment variables from .env file
// dotenv.config();

// if (process.env.STATIC == 'true') {
//     // Your Lambda handler
    
//   } else {
//     }
    
//     const testCheckTeeTimes = async () => {
//             try {
//                     await main.checkTeeTimes();
//                     console.log("Completed checkTeeTimes successfully.");
//                 } catch (err) {
//                         console.error("An error occurred while running checkTeeTimes:", err);
//                     }
//                 };
                
//                 testCheckTeeTimes();
//     Create a cron job to schedule tee time checks
    // const startCronJob = () => {
    //   const task = cron.schedule(`* 7-23,0-2 * * *`, () => {
    //     // logger.info("Cron scheduler running at: " + new Date().toLocaleString());
    //     main.checkTeeTimes();
    //   });
    
    //   main.checkTeeTimes();
    //   task.start();
    // };
    
    // // Start the cron job
    // startCronJob();