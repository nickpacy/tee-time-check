const dotenv = require("dotenv"); // Environment variable management library
const main = require("./tee-times-main");

dotenv.config();

if (process.env.STATIC == "true") {
  exports.handler = async (event, context) => {
    console.log("Package started");
    const config = {
      IS_JCGOLF: event.IS_JCGOLF == "true",
      COURSE_FILTER: event.COURSE_FILTER || null
    };
    console.log(`Running job with config: ${JSON.stringify(config)}`);
    try {
      await main.checkTeeTimes(config);
    } catch (e) {
      console.error(e);
    }
  };
} else {
  const cron = require("node-cron"); // Cron job scheduler
  const config = {
    IS_JCGOLF: process.env.IS_JCGOLF == "true",
    COURSE_FILTER: process.env.COURSE_FILTER || null,
  };
  main.checkTeeTimes(config);
  const startCronJob = () => {
    const task = cron.schedule(`* * * * *`, () => {
      console.log("Cron scheduler running at: " + new Date().toLocaleString());
      main.checkTeeTimes(config);
    });
    task.start();
  };
  startCronJob();
}
