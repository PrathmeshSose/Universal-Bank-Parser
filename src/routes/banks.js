import express from 'express';
import { getJsonFromS3 } from '../services/s3DatabaseService.js';

const router = express.Router();

// GET /api/banks
// Returns a list of all supported bank names from S3 database
router.get('/', async (req, res) => {
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
