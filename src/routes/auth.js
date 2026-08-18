import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { getJsonFromS3, saveJsonToS3 } from '../services/s3DatabaseService.js';

const router = express.Router();

// @route   POST /api/auth/register
// @desc    Register a new user in S3 Database
// @access  Public
router.post('/register', async (req, res) => {
  try {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ error: 'Name, email, and password are required.' });
    }

    // Read current users list from S3
    let users = await getJsonFromS3('users.json');
    const existingUser = users.find(u => u.email.toLowerCase() === email.toLowerCase());
    
    if (existingUser) {
      return res.status(400).json({ error: 'User already exists with this email.' });
    }

    // Hash the password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const newUser = {
      id: `usr_${Date.now()}`,
      name,
      email: email.toLowerCase(),
      password: hashedPassword,
      role: 'user',
      createdAt: new Date().toISOString()
    };

    users.push(newUser);
    await saveJsonToS3('users.json', users);

    res.status(201).json({ message: 'User registered successfully!' });
  } catch (error) {
    console.error('Registration Error:', error.message);
    res.status(500).json({ error: 'Server error during registration.' });
  }
});

// @route   POST /api/auth/login
// @desc    Authenticate user & get token via S3 Database
// @access  Public
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required.' });
    }

    // Read users from S3
    const users = await getJsonFromS3('users.json');
    const user = users.find(u => u.email.toLowerCase() === email.toLowerCase());
    
    if (!user) {
      return res.status(400).json({ error: 'Invalid credentials.' });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ error: 'Invalid credentials.' });
    }

    // Generate JWT Token
    const payload = {
      user: {
        id: user.id,
        role: user.role
      }
    };

    const jwtSecret = process.env.JWT_SECRET || 'fallback_secret_key_123';

    jwt.sign(
      payload,
      jwtSecret,
      { expiresIn: '1d' },
      (err, token) => {
        if (err) throw err;
        res.json({ 
          token, 
          user: { 
            id: user.id, 
            name: user.name, 
            email: user.email, 
            role: user.role 
          } 
        });
      }
    );
  } catch (error) {
    console.error('Login Error:', error.message);
    res.status(500).json({ error: 'Server error during login.' });
  }
});

export default router;
