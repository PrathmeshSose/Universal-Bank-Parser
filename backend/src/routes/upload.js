import express from 'express';
import multer from 'multer';
import { authenticate } from '../middleware/authMiddleware.js';
import { extractBankData } from '../services/extractionService.js';
import { uploadDataToS3 } from '../services/awsS3Service.js';
import { getJsonFromS3, saveJsonToS3 } from '../services/s3DatabaseService.js';

const router = express.Router();

/* =========================================================
   ZERO DISK STORAGE
========================================================= */

const storage = multer.memoryStorage();

const fileFilter = (req, file, cb) => {
  if (file.mimetype === "application/pdf") {
    cb(null, true);
  } else {
    cb(
      new Error("Only PDF files are allowed."),
      false
    );
  }
};

const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: { fileSize: 5 * 1024 * 1024 } // 5MB limit
});

/* =========================================================
   POST /api/upload
========================================================= */

router.post(
  "/",
  upload.single("document"),
  async (req, res) => {
    try {
      console.log("");
      console.log("======================================");
      console.log("NEW PDF UPLOAD");
      console.log("======================================");

      if (!req.file) {
        return res.status(400).json({
          status: "error",
          message:
            "No PDF file was uploaded.",
        });
      }

      /* LOCAL DEVELOPMENT USER */

      req.user = {
        id: "local-dev-user",
      };

      console.log(
        "File:",
        req.file.originalname
      );

    // 3. AI EXTRACTION: Bedrock first, auto-fallback to Groq
    console.log(`🧠 Step 3: Starting AI Extraction for ${bankName}...`);
    const extractionResult = await extractBankData(
      req.file.buffer,
      req.file.mimetype,
      template.extractionRules.geminiPrompt,
      pdfPassword
    );

    const extractedJson = extractionResult.transactions || extractionResult;
    const aiProvider    = extractionResult.provider || "unknown";

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
      aiProvider: aiProvider,
      uploadDate: new Date().toISOString()
    });
    await saveJsonToS3('records.json', records);

    // 6. Return response to UI
    res.json({
      status: 'success',
      message: 'Document processed and securely archived in AWS S3.',
      aiProvider: aiProvider,
      data: extractedJson,
      downloadUrl: s3Url
    });

  } catch (error) {
    console.error('Upload Pipeline Error:', error);
    res.status(500).json({ status: 'error', message: error.message || 'Internal server error.' });
  }
);

export default router;