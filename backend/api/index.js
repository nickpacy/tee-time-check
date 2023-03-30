const express = require('express');
const cors = require('cors');
const authRoutes = require('./routes/authRoutes');
const usersRoutes = require('./routes/usersRoutes');
const coursesRoutes = require('./routes/coursesRoutes');
const timechecksRoutes = require('./routes/timechecksRoutes');
const notificationsRoutes = require('./routes/notificationsRoutes');

const app = express();
app.use(express.json());
app.use(cors());

const PORT = process.env.PORT || 5050;

app.use('/auth', authRoutes);
app.use('/users', usersRoutes);
app.use('/courses', coursesRoutes);
app.use('/timechecks', timechecksRoutes);
app.use('/notifications', notificationsRoutes);

app.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`);
});