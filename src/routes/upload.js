import express from 'express';
import multer from 'multer';
import { authenticate } from '../middleware/authMiddleware.js';
import { extractBankData } from '../services/extractionService.js';
import { uploadDataToS3, uploadPdfToS3 } from '../services/awsS3Service.js';
import { getJsonFromS3, updateJsonInS3 } from '../services/s3DatabaseService.js';

const router = express.Router();

/* =========================================================
   ZERO DISK STORAGE (Multer Memory Storage)
========================================================= */

const storage = multer.memoryStorage();

const fileFilter = (req, file, cb) => {
  if (file.mimetype === "application/pdf") {
    cb(null, true);
  } else {
    cb(new Error("Only PDF files are allowed."), false);
  }
};

const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: { fileSize: 10 * 1024 * 1024 } // 10MB limit
});

/* =========================================================
   POST /api/upload
========================================================= */

router.post("/", authenticate, upload.single("document"), async (req, res) => {
  try {
    console.log("");
    console.log("======================================");
    console.log("📥 NEW PDF UPLOAD RECEIVED");
    console.log("======================================");

    if (!req.file) {
      return res.status(400).json({
        status: "error",
        message: "No PDF file was uploaded.",
      });
    }

    // Set fallback user if not set via auth middleware
    const userId = req.user?.id || "local-dev-user";
    const userEmail = req.user?.email || req.user?.id || "analyst@sbi.co.in";
    let bankName = req.body.bankName || "HDFC";
    bankName = bankName.trim();
    const pdfPassword = req.body.password || "";

    // BUG-32 FIX: Sanitize free-text inputs to prevent Stored XSS
    const sanitize = (str) => String(str || '').replace(/<[^>]*>/g, '').trim().substring(0, 200);
    const clientName = sanitize(req.body.clientName);
    const statementPeriod = sanitize(req.body.statementPeriod);

    // BUG-21 FIX: Duplicate upload check
    if (clientName && statementPeriod) {
      let existingRecords = [];
      try { existingRecords = await getJsonFromS3('records.json'); } catch (_) { existingRecords = []; }
      const isDuplicate = existingRecords.some(
        r => r.userId === userId &&
             r.clientName?.toLowerCase() === clientName.toLowerCase() &&
             r.bankName?.toLowerCase() === bankName.toLowerCase() &&
             r.statementPeriod === statementPeriod
      );
      if (isDuplicate) {
        return res.status(400).json({
          status: 'error',
          message: `Duplicate upload detected: A statement for '${clientName}' (${bankName}, ${statementPeriod}) has already been processed.`
        });
      }
    }

    console.log(`📄 File: ${req.file.originalname} (${(req.file.size / 1024).toFixed(1)} KB)`);
    console.log(`🏦 Bank Name: ${bankName}`);

    // 1. Fetch Bank Template from S3 Database
    let geminiPrompt = "Extract all transaction rows into a JSON array with Date, Description, Debit, Credit, Balance.";
    try {
      const templates = await getJsonFromS3('templates.json');
      const template = templates.find(t => t.bankName.toLowerCase() === bankName.toLowerCase());
      if (template?.extractionRules?.geminiPrompt) {
        geminiPrompt = template.extractionRules.geminiPrompt;
      }
    } catch (tmplErr) {
      console.log("⚠️ Could not load template from S3, using default prompt:", tmplErr.message);
    }

    // 2. AI EXTRACTION: Bedrock first, auto-fallback to Groq
    console.log(`🧠 Step 2: AI Extraction starting...`);
    const extractionResult = await extractBankData(
      req.file.buffer,
      req.file.mimetype,
      geminiPrompt,
      pdfPassword
    );

    const extractedJson = extractionResult.transactions || extractionResult;
    const aiProvider    = extractionResult.provider || "unknown";

    // 3. DATA LAKE STORAGE: Upload to AWS S3 Bucket
    console.log(`☁️ Step 3: Archiving CSV and PDF to AWS S3 Bucket`);
    let s3Url = "";
    let pdfS3Key = "";
    try {
      s3Url = await uploadDataToS3(extractedJson, userId, bankName);
      pdfS3Key = await uploadPdfToS3(req.file.buffer, userId, req.file.originalname);
    } catch (s3Err) {
      console.log("⚠️ S3 upload warning:", s3Err.message);
    }

    // 4. RECORD LOGGING: Append record to S3 database log
    // BUG-C1 FIX: Hoist recordId so fallback response can also return it
    const recordId = `rec_${Date.now()}`;
    try {
      console.log(`🗄️ Step 4: Logging document record in S3`);
      
      // Calculate totals
      let totalCredit = 0;
      let totalDebit = 0;
      let transactionCount = 0;
      
      if (Array.isArray(extractedJson)) {
        transactionCount = extractedJson.length;
        extractedJson.forEach(tx => {
          const cred = parseFloat((tx.Credit || tx.credit || '').replace(/,/g, ''));
          const deb = parseFloat((tx.Debit || tx.debit || '').replace(/,/g, ''));
          if (!isNaN(cred)) totalCredit += cred;
          if (!isNaN(deb)) totalDebit += deb;
        });
      }

      // ACID: Atomic append — prevents lost log entries on concurrent uploads
      await updateJsonInS3('records.json', (records) => {
        records.push({
          id: recordId,
          userId: userId,
          processedBy: userEmail,
          clientName: clientName,
          statementPeriod: statementPeriod,
          bankName: bankName,
          s3FileUrl: s3Url,
          pdfS3Key: pdfS3Key,
          aiProvider: aiProvider,
          status: "pending",
          transactionCount: transactionCount,
          totalCredit: totalCredit,
          totalDebit: totalDebit,
          processedAt: new Date().toISOString()
        });
        return records;
      });

      res.json({
        status: 'success',
        message: 'Document processed and securely archived in AWS S3.',
        aiProvider: aiProvider,
        data: extractedJson,
        downloadUrl: s3Url,
        recordId: recordId
      });
    } catch (recErr) {
      console.log("⚠️ Record logging warning:", recErr.message);
      // BUG-F2 FIX: Include recordId in fallback so Approve & Lock still works
      res.json({
        status: 'success',
        message: 'Document processed but record logging failed.',
        aiProvider: aiProvider,
        data: extractedJson,
        downloadUrl: s3Url,
        recordId: recordId
      });
    }

  } catch (error) {
    console.error('Upload Pipeline Error:', error.message);
    res.status(500).json({ status: 'error', message: error.message || 'Internal server error.' });
  }
});

export default router;