const express = require('express');
const cors = require('cors');
const serverless = require('serverless-http')

const authRoutes = require('./routes/authRoutes');
const usersRoutes = require('./routes/usersRoutes');
const coursesRoutes = require('./routes/coursesRoutes');
const timechecksRoutes = require('./routes/timechecksRoutes');
const notificationsRoutes = require('./routes/notificationsRoutes');

const app = express();
app.use(express.json());
app.use(cors());

// Stage environment for server
const stage = process.env.STAGE;

app.use(`${stage}/auth`, authRoutes);
app.use(`${stage}/users`, usersRoutes);
app.use(`${stage}/courses`, coursesRoutes);
app.use(`${stage}/timechecks`, timechecksRoutes);
app.use(`${stage}/notifications`, notificationsRoutes);

if (process.env.STATIC == 'true') {
    module.exports.handler = serverless(app) 
} else {
    const PORT = process.env.PORT || 5050;
    app.listen(PORT, () => {
      console.log(`Server listening on port ${PORT}`);
    });
}