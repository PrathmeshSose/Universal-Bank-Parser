import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { getJsonFromS3, updateJsonInS3 } from '../services/s3DatabaseService.js';
import { authenticate, requireRole } from '../middleware/authMiddleware.js';

const router = express.Router();

// @route   POST /api/auth/register
// @desc    Register a new user in S3 Database
// @access  Public
router.post('/register', async (req, res) => {
  try {
    const { name, email, password, role } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ error: 'Name, email, and password are required.' });
    }

    // BUG-49 FIX: Enforce minimum password strength for banking compliance
    if (password.length < 8) {
      return res.status(400).json({ error: 'Password must be at least 8 characters long.' });
    }
    const hasUpper = /[A-Z]/.test(password);
    const hasNumber = /[0-9]/.test(password);
    if (!hasUpper || !hasNumber) {
      return res.status(400).json({ error: 'Password must contain at least one uppercase letter and one number.' });
    }

    // Hash password BEFORE entering the lock so the lock is held as briefly as possible
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // ACID: Atomic read-check-write — prevents duplicate email race condition
    await updateJsonInS3('users.json', (users) => {
      const existingUser = users.find(u => u.email.toLowerCase() === email.toLowerCase());
      if (existingUser) {
        const err = new Error('User already exists with this email.');
        err.status = 400;
        throw err;
      }
      users.push({
        id: `usr_${Date.now()}`,
        name: name.trim(),
        email: email.toLowerCase().trim(),
        password: hashedPassword,
        role: 'user', // SECURITY FIX: Public registration must always default to 'user'
        status: 'active',
        createdAt: new Date().toISOString()
      });
      return users;
    });

    res.status(201).json({ message: 'User registered successfully!' });
  } catch (error) {
    console.error('Registration Error:', error.message);
    res.status(500).json({ error: 'Server error during registration.' });
  }
});

// @route   POST /api/auth/users/create
// @desc    Admin creates a new user. Super Admin can assign any role. Admin can only create 'user' role.
// @access  Private (Admin / Super Admin)
router.post('/users/create', authenticate, requireRole('admin'), async (req, res) => {
  try {
    const { name, email, password, role } = req.body;
    if (!name || !email || !password) {
      return res.status(400).json({ error: 'Name, email, and password are required.' });
    }
    // Super Admin and Admin can both create 'user' or 'admin' accounts.
    let assignedRole = 'user';
    if (role === 'admin' || role === 'user') {
      assignedRole = role;
    }
    // Hash password BEFORE entering the lock
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);
    const newUserData = {
      id: `usr_${Date.now()}`,
      name: name.trim(),
      email: email.toLowerCase().trim(),
      password: hashedPassword,
      role: assignedRole,
      status: 'active',
      createdAt: new Date().toISOString(),
      createdBy: req.user.id
    };

    // ACID: Atomic read-check-write
    await updateJsonInS3('users.json', (users) => {
      const existing = users.find(u => u.email.toLowerCase() === email.toLowerCase().trim());
      if (existing) {
        const err = new Error('A user with this email already exists.');
        err.status = 400;
        throw err;
      }
      users.push(newUserData);
      return users;
    });

    res.status(201).json({
      status: 'success',
      message: `User '${newUserData.name}' created with role '${assignedRole}'.`,
      user: { id: newUserData.id, name: newUserData.name, email: newUserData.email, role: newUserData.role }
    });
  } catch (error) {
    console.error('Create User Error:', error.message);
    res.status(500).json({ error: 'Server error during user creation.' });
  }
});

// @route   POST /api/auth/login
// @desc    Authenticate user & get token via S3 Database
// @access  Public

// BUG-48 FIX: Simple in-memory brute-force rate limiter (no extra deps needed)
const loginAttempts = new Map(); // key: IP, value: { count, firstAttempt }
const RATE_LIMIT_MAX = 10;        // max attempts
const RATE_LIMIT_WINDOW = 15 * 60 * 1000; // 15 minutes in ms

const loginRateLimiter = (req, res, next) => {
  const ip = req.ip || req.connection?.remoteAddress || 'unknown';
  const now = Date.now();
  const entry = loginAttempts.get(ip);

  if (entry) {
    if (now - entry.firstAttempt < RATE_LIMIT_WINDOW) {
      if (entry.count >= RATE_LIMIT_MAX) {
        const retryAfterMin = Math.ceil((RATE_LIMIT_WINDOW - (now - entry.firstAttempt)) / 60000);
        return res.status(429).json({ error: `Too many login attempts. Try again in ${retryAfterMin} minute(s).` });
      }
      entry.count++;
    } else {
      // Window expired, reset
      loginAttempts.set(ip, { count: 1, firstAttempt: now });
    }
  } else {
    loginAttempts.set(ip, { count: 1, firstAttempt: now });
  }
  next();
};

router.post('/login', loginRateLimiter, async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required.' });
    }

    const cleanEmail = email.toLowerCase().trim();

    // Master Super Admin bypass (requires MASTER_ADMIN_PASSWORD in .env)
    const masterPassword = process.env.MASTER_ADMIN_PASSWORD;
    if (masterPassword && cleanEmail === 'admin@universalparser.com' && password === masterPassword) {
      const superAdminUser = {
        id: 'usr_master_super_admin',
        name: 'Master Super Admin',
        email: 'admin@universalparser.com',
        role: 'super_admin',
        status: 'active'
      };

      if (!process.env.JWT_SECRET) {
        return res.status(500).json({ error: 'Server misconfiguration: JWT_SECRET is not set.' });
      }
      const token = jwt.sign({ user: { id: superAdminUser.id, role: superAdminUser.role } }, process.env.JWT_SECRET, { expiresIn: '1d' });

      return res.json({ token, user: superAdminUser });
    }

    // Read users from S3
    let users = [];
    try {
      users = await getJsonFromS3('users.json');
    } catch (_) {
      users = [];
    }

    const user = users.find(u => u.email.toLowerCase() === cleanEmail);
    if (!user) {
      return res.status(400).json({ error: 'Invalid credentials.' });
    }

    if (user.status === 'disabled') {
      return res.status(403).json({ error: 'Your account has been disabled by an administrator.' });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ error: 'Invalid credentials.' });
    }

    // Generate JWT Token
    const payload = {
      user: {
        id: user.id,
        role: user.role,
        name: user.name,
        email: user.email
      }
    };

    if (!process.env.JWT_SECRET) {
      return res.status(500).json({ error: 'Server misconfiguration: JWT_SECRET is not set.' });
    }

    jwt.sign(
      payload,
      process.env.JWT_SECRET,
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

// @route   GET /api/auth/users
// @desc    List all registered users (Admin & Super Admin only)
// @access  Private (Admin / Super Admin)
router.get('/users', authenticate, requireRole('admin'), async (req, res) => {
  try {
    let users = await getJsonFromS3('users.json');
    const sanitized = users.map(u => ({
      id: u.id,
      name: u.name,
      email: u.email,
      role: u.role,
      status: u.status || 'active',
      createdAt: u.createdAt
    }));
    res.json({ status: 'success', data: sanitized });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch users' });
  }
});

// @route   PATCH /api/auth/users/:id/role
// @desc    Update user role (Admin & Super Admin)
// @access  Private
router.patch('/users/:id/role', authenticate, requireRole('admin'), async (req, res) => {
  try {
    const { role, status } = req.body;
    const targetId = req.params.id;

    // ACID: Atomic read-modify-write to prevent concurrent role update conflicts
    let updatedUser;
    await updateJsonInS3('users.json', (users) => {
      const userIndex = users.findIndex(u => u.id === targetId);
      if (userIndex === -1) {
        const err = new Error('User not found');
        err.status = 404;
        throw err;
      }
      const targetUser = users[userIndex];
      // SECURITY CHECK: Admins cannot modify Super Admin accounts
      if (req.user.role === 'admin' && targetUser.role === 'super_admin') {
        const err = new Error('Access Denied: Admins cannot modify Super Admin accounts.');
        err.status = 403;
        throw err;
      }
      // SECURITY CHECK: Admins cannot elevate a role to Super Admin
      if (req.user.role === 'admin' && role === 'super_admin') {
        const err = new Error('Access Denied: Admins cannot grant Super Admin privileges.');
        err.status = 403;
        throw err;
      }
      if (role) users[userIndex].role = role;
      if (status) users[userIndex].status = status;
      updatedUser = users[userIndex];
      return users;
    });

    res.json({ status: 'success', message: 'User updated successfully', user: updatedUser });
  } catch (err) {
    res.status(err.status || 500).json({ error: err.message || 'Failed to update user' });
  }
});

// @route   DELETE /api/auth/users/:id
// @desc    Delete user account (SUPER ADMIN ONLY)
// @access  Private (Super Admin Only)
router.delete('/users/:id', authenticate, async (req, res) => {
  try {
    if (req.user.role !== 'super_admin') {
      return res.status(403).json({ error: 'Only Super Admin can permanently delete user accounts.' });
    }
    if (req.params.id === req.user.id) {
      return res.status(400).json({ error: 'Self-deletion is not permitted. Please contact another Super Admin.' });
    }

    const targetId = req.params.id;
    // ACID: Atomic delete — read latest list, filter, write back
    await updateJsonInS3('users.json', (users) => {
      const exists = users.some(u => u.id === targetId);
      if (!exists) {
        const err = new Error('User not found.');
        err.status = 404;
        throw err;
      }
      return users.filter(u => u.id !== targetId);
    });

    res.json({ status: 'success', message: 'User permanently deleted by Super Admin' });
  } catch (err) {
    res.status(err.status || 500).json({ error: err.message || 'Failed to delete user' });
  }
});

export default router;
