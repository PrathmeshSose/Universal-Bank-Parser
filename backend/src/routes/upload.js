import express from 'express';
import multer from 'multer';
import { authenticate } from '../middleware/authMiddleware.js';
import { extractBankDataWithBedrock } from '../services/awsBedrockService.js';
import { uploadDataToS3 } from '../services/awsS3Service.js';
import { getJsonFromS3, saveJsonToS3 } from '../services/s3DatabaseService.js';

const router = express.Router();

// CRITICAL: We use memoryStorage() to enforce the "Zero Storage" rule for raw PDFs in RAM.
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

// POST /api/upload
// Pure AWS S3 Serverless Endpoint
router.post('/', authenticate, upload.single('document'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ status: 'error', message: 'No valid PDF file uploaded.' });
    }

    console.log(`✅ Received file: ${req.file.originalname} from User ID: ${req.user.id}`);

    // 1. Validate Bank Name
    let bankName = req.body.bankName;
    if (!bankName) {
      return res.status(400).json({ status: 'error', message: 'bankName is required in the request.' });
    }
    bankName = bankName.trim();

    // 2. Fetch Bank Template from S3 Database
    const templates = await getJsonFromS3('templates.json');
    const template = templates.find(t => t.bankName.toLowerCase() === bankName.toLowerCase());

    if (!template) {
      return res.status(404).json({ status: 'error', message: `No parsing template found for bank: ${bankName}` });
    }

    const pdfPassword = req.body.password || "";

    // 3. AI EXTRACTION: Send to Amazon Bedrock (Claude 3)
    console.log(`🧠 Step 3: AI Extraction via Amazon Bedrock (Claude 3) for ${bankName}`);
    const extractedJson = await extractBankDataWithBedrock(
      req.file.buffer,
      req.file.mimetype,
      template.extractionRules.geminiPrompt,
      pdfPassword
    );

    // 4. DATA LAKE STORAGE: Convert JSON to CSV and upload to AWS S3 Bucket
    console.log(`☁️ Step 4: Archiving CSV to AWS S3 Bucket`);
    const s3Url = await uploadDataToS3(extractedJson, req.user.id, bankName);

    // 5. RECORD LOGGING: Append record to S3 database log
    console.log(`🗄️ Step 5: Logging document record in S3`);
    let records = await getJsonFromS3('records.json');
    records.push({
      id: `rec_${Date.now()}`,
      userId: req.user.id,
      bankName: bankName,
      s3FileUrl: s3Url,
      uploadDate: new Date().toISOString()
    });
    await saveJsonToS3('records.json', records);

    // 6. Return response to UI
    res.json({
      status: 'success',
      message: 'Document processed and securely archived in AWS S3.',
      data: extractedJson,
      downloadUrl: s3Url
    });

  } catch (error) {
    console.error('Upload Pipeline Error:', error);
    res.status(500).json({ status: 'error', message: error.message || 'Internal server error.' });
  }
});

export default router;
