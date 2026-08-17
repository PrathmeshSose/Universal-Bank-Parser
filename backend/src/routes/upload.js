import express from "express";
import multer from "multer";

import {
  extractBankDataWithBedrock,
} from "../services/awsBedrockService.js";

import {
  uploadDataToS3,
} from "../services/awsS3Service.js";

import {
  getJsonFromS3,
  saveJsonToS3,
} from "../services/s3DatabaseService.js";

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
  storage,
  fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024,
  },
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

      console.log(
        "Size:",
        req.file.size,
        "bytes"
      );

      console.log(
        "Type:",
        req.file.mimetype
      );

      /* =====================================================
         BANK
      ===================================================== */

      let bankName = req.body.bankName;

      if (!bankName) {
        return res.status(400).json({
          status: "error",
          message:
            "bankName is required.",
        });
      }

      bankName = bankName.trim();

      console.log(
        "Bank:",
        bankName
      );

      /* =====================================================
         TEMPLATE
      ===================================================== */

      const templates =
        await getJsonFromS3(
          "templates.json"
        );

      const template =
        templates.find(
          (template) =>
            template.bankName
              .toLowerCase() ===
            bankName.toLowerCase()
        );

      if (!template) {
        return res.status(404).json({
          status: "error",
          message:
            `No parsing template found for bank: ${bankName}`,
        });
      }

      /* =====================================================
         PASSWORD
      ===================================================== */

      const pdfPassword =
        req.body.password || "";

      /* =====================================================
         BEDROCK
      ===================================================== */

      console.log(
        "STEP 1: Sending PDF to extraction service..."
      );

      const extractedJson =
        await extractBankDataWithBedrock(
          req.file.buffer,
          req.file.mimetype,
          template.extractionRules
            .geminiPrompt,
          pdfPassword
        );

      if (
        !Array.isArray(extractedJson)
      ) {
        throw new Error(
          "AI extraction did not return an array."
        );
      }

      console.log(
        "EXTRACTED TRANSACTIONS:",
        extractedJson.length
      );

      /* =====================================================
         S3 CSV
      ===================================================== */

      let s3Url = null;

      if (
        process.env.AWS_S3_BUCKET_NAME
      ) {
        console.log(
          "STEP 2: Uploading extracted CSV to S3..."
        );

        s3Url =
          await uploadDataToS3(
            extractedJson,
            req.user.id,
            bankName
          );
      } else {
        console.warn(
          "AWS_S3_BUCKET_NAME missing. Skipping S3 archive."
        );
      }

      /* =====================================================
         RECORD LOG
      ===================================================== */

      if (
        process.env.AWS_S3_BUCKET_NAME
      ) {
        const records =
          await getJsonFromS3(
            "records.json"
          );

        records.push({
          id: `rec_${Date.now()}`,
          userId: req.user.id,
          bankName,
          originalFileName:
            req.file.originalname,
          transactionCount:
            extractedJson.length,
          s3FileUrl: s3Url,
          uploadDate:
            new Date().toISOString(),
        });

        await saveJsonToS3(
          "records.json",
          records
        );
      }

      /* =====================================================
         RESPONSE
      ===================================================== */

      return res.status(200).json({
        status: "success",
        message:
          `PDF processed successfully. ${extractedJson.length} transactions extracted.`,
        data: {
          transactions:
            extractedJson,
          bankName,
          originalFileName:
            req.file.originalname,
          transactionCount:
            extractedJson.length,
        },
        transactions:
          extractedJson,
        downloadUrl: s3Url,
      });
    } catch (error) {
      console.error("");
      console.error(
        "======================================"
      );
      console.error(
        "PDF PROCESSING FAILED"
      );
      console.error(
        "======================================"
      );
      console.error(error);

      return res.status(500).json({
        status: "error",
        message:
          error?.message ||
          "Failed to process PDF.",
      });
    }
  }
);

export default router;