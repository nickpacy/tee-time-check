const express = require('express');
const jwt = require('jsonwebtoken');
const router = express.Router();
const authController = require('../controllers/authController');

// Register a new user
router.post('/register', async (req, res) => {
  try {
    const { username, password, email } = req.body;
    const user = await authController.registerUser(username, password, email);
    res.json(user);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Log in a user
router.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    const user = await authController.loginUser(username, password);

    if (!user) {
      res.status(401).json({ error: 'Invalid username or password' });
      return;
    }

    // Generate a JSON Web Token (JWT)
    const token = jwt.sign({ userId: user.userId }, 'your_secret_key', { expiresIn: '1h' });

    res.json({ token });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Log out a user (invalidates JWT)
router.post('/logout', (req, res) => {
  // Set the 'Authorization' header to an invalid token value
  res.set('Authorization', 'Bearer invalid-token-value');

  res.sendStatus(200);
});

// Refresh route - generate a new access token for the user
router.post('/refresh', async (req, res) => {
  // TODO: Add any necessary validation and error handling

  const refreshToken = req.body.refreshToken;

  try {
    // Verify the refresh token and get the user ID
    const { userId } = jwt.verify(refreshToken, process.env.REFRESH_TOKEN_SECRET);

    // Generate a new access token for the user
    const accessToken = jwt.sign({ userId }, process.env.ACCESS_TOKEN_SECRET, { expiresIn: '15m' });

    // Send the new access token in the response
    res.json({ accessToken });
  } catch (err) {
    // If the refresh token is invalid, return an error response
    res.sendStatus(401);
  }
});