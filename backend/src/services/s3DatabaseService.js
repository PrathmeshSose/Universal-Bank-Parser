import {
  S3Client,
  GetObjectCommand,
  PutObjectCommand,
} from "@aws-sdk/client-s3";

const s3Client =
  new S3Client({
    region:
      process.env.AWS_REGION ||
      "us-east-1",
  });

const DEFAULT_BANK_TEMPLATES = [
  {
    bankName: "HDFC",
    documentType:
      "Savings & Credit Card Statement",
    extractionRules: {
      columnsRequired: [
        "Date",
        "Description",
        "Debit",
        "Credit",
        "Balance",
      ],
      geminiPrompt:
        "Extract actual transaction rows from this HDFC bank statement. Ignore headers, summaries, opening balance, closing balance, and footers. Do not invent transactions.",
    },
  },
  {
    bankName: "SBI",
    documentType:
      "Savings Account Statement",
    extractionRules: {
      columnsRequired: [
        "Date",
        "Description",
        "Debit",
        "Credit",
        "Balance",
      ],
      geminiPrompt:
        "Extract actual transaction rows from this SBI bank statement. Ignore headers, summaries, opening balance, closing balance, and footers. Do not invent transactions.",
    },
  },
  {
    bankName: "ICICI",
    documentType:
      "Current Account Statement",
    extractionRules: {
      columnsRequired: [
        "Date",
        "Description",
        "Debit",
        "Credit",
        "Balance",
      ],
      geminiPrompt:
        "Extract actual transaction rows from this ICICI bank statement. Ignore headers, summaries, opening balance, closing balance, and footers. Do not invent transactions.",
    },
  },
  {
    bankName: "Axis",
    documentType:
      "Savings Account Statement",
    extractionRules: {
      columnsRequired: [
        "Date",
        "Description",
        "Debit",
        "Credit",
        "Balance",
      ],
      geminiPrompt:
        "Extract actual transaction rows from this Axis Bank statement. Ignore headers, summaries, opening balance, closing balance, and footers. Do not invent transactions.",
    },
  },
];

const streamToString = (stream) =>
  new Promise(
    (resolve, reject) => {
      const chunks = [];

      stream.on(
        "data",
        (chunk) =>
          chunks.push(chunk)
      );

      stream.on(
        "error",
        reject
      );

      stream.on(
        "end",
        () =>
          resolve(
            Buffer.concat(
              chunks
            ).toString("utf8")
          )
      );
    }
  );

/* =========================================================
   READ JSON
========================================================= */

export const getJsonFromS3 =
  async (fileName) => {
    const bucketName =
      process.env
        .AWS_S3_BUCKET_NAME;

    if (!bucketName) {
      if (
        fileName ===
        "templates.json"
      ) {
        return DEFAULT_BANK_TEMPLATES;
      }

      return [];
    }

    try {
      const command =
        new GetObjectCommand({
          Bucket: bucketName,
          Key: `database/${fileName}`,
        });

      const response =
        await s3Client.send(
          command
        );

      const body =
        await streamToString(
          response.Body
        );

      const parsed =
        JSON.parse(body);

      return Array.isArray(
        parsed
      )
        ? parsed
        : [];
    } catch (error) {
      if (
        error?.name ===
          "NoSuchKey" ||
        error?.Code ===
          "NoSuchKey" ||
        error?.$metadata
          ?.httpStatusCode === 404
      ) {
        if (
          fileName ===
          "templates.json"
        ) {
          return DEFAULT_BANK_TEMPLATES;
        }

        return [];
      }

      console.error(
        `S3 read error for ${fileName}:`,
        error
      );

      if (
        fileName ===
        "templates.json"
      ) {
        return DEFAULT_BANK_TEMPLATES;
      }

      return [];
    }
  };

/* =========================================================
   SAVE JSON
========================================================= */

export const saveJsonToS3 =
  async (
    fileName,
    dataArray
  ) => {
    const bucketName =
      process.env
        .AWS_S3_BUCKET_NAME;

    if (!bucketName) {
      return false;
    }

    try {
      const command =
        new PutObjectCommand({
          Bucket: bucketName,
          Key: `database/${fileName}`,
          Body: JSON.stringify(
            dataArray,
            null,
            2
          ),
          ContentType:
            "application/json",
        });

      await s3Client.send(
        command
      );

      return true;
    } catch (error) {
      console.error(
        `S3 save error for ${fileName}:`,
        error
      );

      return false;
    }
  };