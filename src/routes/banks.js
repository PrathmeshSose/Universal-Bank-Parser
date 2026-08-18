import express from 'express';
import { getJsonFromS3 } from '../services/s3DatabaseService.js';
import { authenticate } from '../middleware/authMiddleware.js';

const router = express.Router();

// GET /api/banks - BUG-45 FIX: Added authentication guard
router.get('/', authenticate, async (req, res) => {
  try {
    const templates = await getJsonFromS3('templates.json');
    const bankNames = templates.map(t => t.bankName);
    
    res.json({
      status: 'success',
      data: bankNames
    });
  } catch (error) {
    console.error('Error fetching banks:', error);
    res.status(500).json({ status: 'error', message: 'Failed to fetch supported banks.' });
  }
});

export default router;
