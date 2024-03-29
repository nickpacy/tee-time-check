const dotenv = require("dotenv"); // Environment variable management library
const main = require("./tee-times-main");

dotenv.config();

if (process.env.STATIC == "true") {
  exports.handler = async (event, context) => {
    console.log("Package started");
    try {
      await main.checkTeeTimes();
    } catch (e) {
      console.error(e);
    }
  };
} else {
  const cron = require("node-cron"); // Cron job scheduler
  main.checkTeeTimes();
  const startCronJob = () => {
    const task = cron.schedule(`* * * * *`, () => {
      console.log("Cron scheduler running at: " + new Date().toLocaleString());
      main.checkTeeTimes();
    });
    task.start();
  };
  startCronJob();
}
