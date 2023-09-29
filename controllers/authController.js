//Very Important
require("../models/database");
const argon2 = require('argon2');
const User = require('../models/User');
const generateAccessToken = require('../utils/authUtils'); // Import the generateAccessToken function
exports.register = async (req, res) => {
    try {
        const { name, password, email } = req.body;

        // Check if user already exists
        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.status(400).json({ message: 'User already exists' });
        }

        // Hash the password using Argon2
        const hashedPassword = await argon2.hash(password);

        // Create a new user
        const user = new User({ name, email, password: hashedPassword });

        // Save the user to the database
        await user.save();

        res.status(201).json({ success: true, data: user, message: 'User registration successful' });
    } catch (err) {
        console.error(err);
        res.status(400).json({ error: err.message, message: 'User registration failed' });
    }
};
exports.login = async (req, res) => {
    try {
        const { email, password } = req.body;

        // Find the user by name
        const user = await User.findOne({ email });
        if (!user) {
            return res.status(401).json({ error: 'Invalid email!' });
        }

        // Compare the password using Argon2
        const isPasswordValid = await argon2.verify(user.password, password);
        if (!isPasswordValid) {
            return res.status(401).json({ error: 'Invalid password, Provide the correct Password!' });
        }

        // Generate the access token and refresh token
        const accessToken = generateAccessToken(user);
        const refreshToken = generateRefreshToken(user); // Call the new function here

        // Send both tokens in the response
        res.status(200).json({ success: "You Logged In Successfully!", accessToken, refreshToken });
    } catch (err) {
        res.status(400).json({ success: false, error: err.message });
    }
};

exports.refreshToken = async (req, res) => {
    const { refreshToken } = req.body;

    try {
        // Verify the refresh token
        const decoded = jwt.verify(refreshToken, process.env.JWT_SECRET);

        // Generate a new access token
        const user = await User.findById(decoded.userId);
        const accessToken = generateAccessToken(user);

        res.status(200).json({ accessToken });
    } catch (err) {
        res.status(401).json({ error: 'Invalid refresh token' });
    }
};

exports.logout = async (req, res) => {
    try {
      // Clear the token cookie
      res.clearCookie('token');
  
      res.status(200).json({ message: 'Logged out successfully! Thank You for using our Application' });
    } catch (err) {
      res.status(400).json({ success: false, error: err.message });
    }
  };