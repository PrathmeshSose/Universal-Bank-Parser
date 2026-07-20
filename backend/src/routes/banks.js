import express from 'express';
import BankTemplate from '../models/BankTemplate.js';

const router = express.Router();

// GET /api/banks
// Returns a list of all supported bank names from the database
router.get('/', async (req, res) => {
  try {
    const templates = await BankTemplate.find({}, 'bankName').sort({ bankName: 1 });
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
