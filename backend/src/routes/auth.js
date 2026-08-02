import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import User from '../models/User.js';

const router = express.Router();

// @route   POST /api/auth/register
// @desc    Register a new user
// @access  Public
// @route   POST /api/auth/register
// @desc    Register a new user
// @access  Public
router.post('/register', async (req, res) => {
  try {
    const { name, email, password } = req.body;

    let userId = "";
    let role = "user";

    // Hash the password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // DYNAMIC DATABASE ROUTING
    if (mongoose.connection.readyState === 1) {
      // -----------------------------
      // MONGODB MODE
      // -----------------------------
      let user = await User.findOne({ email });
      if (user) {
        return res.status(400).json({ error: 'User already exists with this email.' });
      }

      user = new User({ name, email, password: hashedPassword });
      await user.save();
      
      userId = user.id;
      role = user.role;

    } else {
      // -----------------------------
      // SERVERLESS S3 MODE
      // -----------------------------
      console.log('⚠️ Using S3 Database for Registration');
      const { getJsonFromS3, saveJsonToS3 } = await import('../services/s3DatabaseService.js');
      
      let users = await getJsonFromS3('users.json');
      const existingUser = users.find(u => u.email === email);
      
      if (existingUser) {
        return res.status(400).json({ error: 'User already exists with this email (S3 Database).' });
      }

      const newUser = {
        id: Date.now().toString(), // Simple unique ID
        name,
        email,
        password: hashedPassword,
        role: 'user',
        createdAt: new Date().toISOString()
      };

      users.push(newUser);
      await saveJsonToS3('users.json', users);
      
      userId = newUser.id;
      role = newUser.role;
    }

    res.status(201).json({ message: 'User registered successfully!' });
  } catch (error) {
    console.error('Registration Error:', error.message);
    res.status(500).json({ error: 'Server error during registration.' });
  }
});

// @route   POST /api/auth/login
// @desc    Authenticate user & get token
// @access  Public
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    let userId = "";
    let role = "user";
    let isMatch = false;

    // DYNAMIC DATABASE ROUTING
    if (mongoose.connection.readyState === 1) {
      // -----------------------------
      // MONGODB MODE
      // -----------------------------
      const user = await User.findOne({ email });
      if (!user) {
        return res.status(400).json({ error: 'Invalid credentials.' });
      }

      isMatch = await bcrypt.compare(password, user.password);
      if (!isMatch) {
        return res.status(400).json({ error: 'Invalid credentials.' });
      }

      userId = user.id;
      role = user.role;
    } else {
      // -----------------------------
      // SERVERLESS S3 MODE
      // -----------------------------
      console.log('⚠️ Using S3 Database for Login');
      const { getJsonFromS3 } = await import('../services/s3DatabaseService.js');
      
      const users = await getJsonFromS3('users.json');
      const user = users.find(u => u.email === email);
      
      if (!user) {
        return res.status(400).json({ error: 'Invalid credentials (S3 Database).' });
      }

      isMatch = await bcrypt.compare(password, user.password);
      if (!isMatch) {
        return res.status(400).json({ error: 'Invalid credentials (S3 Database).' });
      }

      userId = user.id;
      role = user.role;
    }

    // Generate JWT Token
    const payload = {
      user: {
        id: userId,
        role: role
      }
    };

    const jwtSecret = process.env.JWT_SECRET || 'fallback_secret_key_123';

    jwt.sign(
      payload,
      jwtSecret,
      { expiresIn: '1d' },
      (err, token) => {
        if (err) throw err;
        res.json({ token, user: { id: userId, email: email, role: role } });
      }
    );
  } catch (error) {
    console.error('Login Error:', error.message);
    res.status(500).json({ error: 'Server error during login.' });
  }
});

export default router;
