import express from 'express';
import multer from 'multer';
import BankTemplate from '../models/BankTemplate.js';
import DocumentRecord from '../models/DocumentRecord.js';
import { authenticate } from '../middleware/authMiddleware.js';
import { extractBankDataWithBedrock } from '../services/awsBedrockService.js';
import { uploadDataToS3 } from '../services/awsS3Service.js';

const router = express.Router();

// CRITICAL: We use memoryStorage() to enforce the "Zero Storage" rule for PDFs.
const storage = multer.memoryStorage();
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

const escapeRegExp = (string) => string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

// POST /api/upload
// Fully orchestrated Phase 2 endpoint
router.post('/', authenticate, upload.single('document'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ status: 'error', message: 'No valid PDF file uploaded.' });
    }

    console.log(`✅ Received file: ${req.file.originalname} from User: ${req.user.id}`);

    // 1. Validate Bank Name
    let bankName = req.body.bankName;
    if (!bankName) {
      return res.status(400).json({ status: 'error', message: 'bankName is required in the request.' });
    }
    bankName = bankName.trim();

    // 2. Fetch the specific template for this bank
    let template = null;
    if (mongoose.connection.readyState === 1) {
      // --- MONGODB MODE ---
      const escapedBankName = escapeRegExp(bankName);
      template = await BankTemplate.findOne({ bankName: { $regex: new RegExp(`^${escapedBankName}$`, 'i') } });
    } else {
      // --- S3 DATABASE MODE ---
      console.log('⚠️ Using S3 Database for Templates');
      const { getJsonFromS3 } = await import('../services/s3DatabaseService.js');
      const templates = await getJsonFromS3('templates.json');
      template = templates.find(t => t.bankName.toLowerCase() === bankName.toLowerCase());
    }

    if (!template) {
      return res.status(404).json({ status: 'error', message: `No parsing template found for bank: ${bankName}` });
    }

    const pdfPassword = req.body.password || "";

    // 3. AI EXTRACTION: Send to Amazon Bedrock (Claude 3)
    console.log(`🧠 Step 3: AI Extraction via Amazon Bedrock for template ID: ${template._id || 'S3_Template'}`);
    const extractedJson = await extractBankDataWithBedrock(req.file.buffer, req.file.mimetype, template.extractionRules.geminiPrompt, pdfPassword);

    // 4. DATA LAKE STORAGE: Convert to CSV and upload to AWS S3
    console.log(`☁️ Step 4: Storing data in AWS S3 Bucket`);
    const s3Url = await uploadDataToS3(extractedJson, req.user.id, bankName);

    // 5. MONGODB / S3 RECORD: Save the secure S3 URL tied to this specific user
    console.log(`🗄️ Step 5: Saving DocumentRecord`);
    if (mongoose.connection.readyState === 1) {
      const documentRecord = new DocumentRecord({
        userId: req.user.id,
        s3FileUrl: s3Url,
        bankName: bankName
      });
      await documentRecord.save();
    } else {
      const { getJsonFromS3, saveJsonToS3 } = await import('../services/s3DatabaseService.js');
      let records = await getJsonFromS3('records.json');
      records.push({
        userId: req.user.id,
        s3FileUrl: s3Url,
        bankName: bankName,
        uploadDate: new Date().toISOString()
      });
      await saveJsonToS3('records.json', records);
    }

    // 6. Return the JSON data for immediate UI rendering AND the S3 URL for downloading
    res.json({
      status: 'success',
      message: 'Document processed and securely archived in S3.',
      data: extractedJson,
      downloadUrl: s3Url
    });

  } catch (error) {
    console.error('Upload Pipeline Error:', error);
    res.status(500).json({ status: 'error', message: error.message || 'Internal server error.' });
  }
});

export default router;
