const express = require('express');
const cors = require('cors');
const serverless = require('serverless-http')
const bodyParser = require('body-parser');

const errorHandler = require('./middlewares/errorHandler');
const authRoutes = require('./routes/authRoutes');
const usersRoutes = require('./routes/usersRoutes');
const coursesRoutes = require('./routes/coursesRoutes');
const metricsRoutes = require('./routes/metricsRoutes');
const timechecksRoutes = require('./routes/timechecksRoutes');
const notificationsRoutes = require('./routes/notificationsRoutes');
const teeTimeRoutes = require('./routes/teeTimeRoutes');

const app = express();
app.use(express.json());
app.use(cors());
app.use(bodyParser.json());

// Stage environment for server
const stage = process.env.STAGE;

app.use(`${stage}/auth`, authRoutes);
app.use(`${stage}/users`, usersRoutes);
app.use(`${stage}/courses`, coursesRoutes);
app.use(`${stage}/metrics`, metricsRoutes);
app.use(`${stage}/timechecks`, timechecksRoutes);
app.use(`${stage}/notifications`, notificationsRoutes);
app.use(`${stage}/teetimes`, teeTimeRoutes);
app.use(errorHandler);

if (process.env.STATIC == 'true') {
    module.exports.handler = serverless(app) 
} else {
    const PORT = process.env.PORT || 5050;
    app.listen(PORT, () => {
      const date = new Date();
      console.log(`Server started on ${date.toString()}`);
      console.log(`Server is running in ${stage} environment`);
      console.log(`Server listening on port ${PORT}`);
      console.log(`App Version: ${require('./package.json').version}`);
      console.log(`Express Version: ${require('express/package.json').version}`);
    });    
}