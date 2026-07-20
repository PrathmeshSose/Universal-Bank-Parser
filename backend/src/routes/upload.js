import express from 'express';
import multer from 'multer';
import { extractBankData } from '../services/groqService.js';
import BankTemplate from '../models/BankTemplate.js';

const router = express.Router();

// CRITICAL: We use memoryStorage() to enforce the "Zero Storage" rule.
// The uploaded PDF is held in RAM (Buffer) and never written to the hard drive.
const storage = multer.memoryStorage();
// Security: Only allow PDF files to be uploaded
const fileFilter = (req, file, cb) => {
  if (file.mimetype === 'application/pdf') {
    cb(null, true);
  } else {
    cb(new Error('Only PDF files are allowed!'), false);
  }
};

const upload = multer({ 
  storage: storage,
  fileFilter: fileFilter,
  limits: { fileSize: 5 * 1024 * 1024 } // 5MB limit
});

// Helper to prevent ReDoS attacks in MongoDB queries
const escapeRegExp = (string) => string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

// POST /api/upload
// The frontend will send the PDF file under the field name 'document'
router.post('/', upload.single('document'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ status: 'error', message: 'No valid PDF file uploaded.' });
    }

    // req.file.buffer contains the raw PDF data in RAM!
    console.log(`✅ Received file: ${req.file.originalname} (Size: ${req.file.size} bytes)`);

    // 1. Get the bank name from the frontend request (e.g., 'HDFC')
    let bankName = req.body.bankName;
    if (!bankName) {
      return res.status(400).json({ status: 'error', message: 'bankName is required in the request.' });
    }
    bankName = bankName.trim(); // Remove accidental spaces

    // 2. Fetch the specific template for this bank from MongoDB (Case-Insensitive & Escaped)
    const escapedBankName = escapeRegExp(bankName);
    const template = await BankTemplate.findOne({ bankName: { $regex: new RegExp(`^${escapedBankName}$`, 'i') } });
    if (!template) {
      return res.status(404).json({ status: 'error', message: `No parsing template found for bank: ${bankName}` });
    }

    // 3. Extract optional password from the frontend
    const pdfPassword = req.body.password || "";

    // 4. Send the file and template to the AI Service (Groq)
    console.log(`Sending to AI. Template ID: ${template._id}`);
    const extractedData = await extractBankData(req.file.buffer, req.file.mimetype, template.extractionRules.geminiPrompt, pdfPassword);

    // Send the real, AI-extracted data back to the frontend!
    res.json({
      status: 'success',
      data: extractedData
    });

  } catch (error) {
    console.error('Upload Error:', error);
    res.status(500).json({ status: 'error', message: error.message || 'Internal server error.' });
  }
});

export default router;
