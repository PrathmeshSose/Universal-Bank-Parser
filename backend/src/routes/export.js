import express from 'express';
import { appendToSheet } from '../services/sheetsService.js';

const router = express.Router();

// POST /api/export
// The frontend will send the verified JSON data here to push to Google Sheets
router.post('/', async (req, res) => {
  try {
    const { sheetId, verifiedData } = req.body;

    // Validate the request format from the frontend
    if (!sheetId || !verifiedData || !Array.isArray(verifiedData)) {
      return res.status(400).json({ 
        status: 'error', 
        message: 'sheetId and an array of verifiedData are required.' 
      });
    }

    console.log(`📤 Pushing ${verifiedData.length} verified transactions to Google Sheets...`);
    
    // Call our Google Sheets Service to append the rows
    await appendToSheet(sheetId, verifiedData);

    // Send success response back to the frontend
    res.json({
      status: 'success',
      message: 'Successfully exported data to Google Sheets'
    });

  } catch (error) {
    console.error('Export Error:', error);
    res.status(500).json({ 
      status: 'error', 
      message: 'Failed to export to Google Sheets. Ensure Service Account is configured.' 
    });
  }
});

export default router;
