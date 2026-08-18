import {
  S3Client,
  GetObjectCommand,
  PutObjectCommand,
} from "@aws-sdk/client-s3";

const s3Client = new S3Client({
  region: process.env.AWS_REGION || "us-east-1"
});

// Duplicated functions removed.

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

      throw error;
    }
  };

/* =========================================================
   ACID MUTEX — Prevents race conditions on concurrent writes
   Uses a per-file promise queue so only ONE read-modify-write
   runs at a time on this server instance.
========================================================= */

class Mutex {
  constructor() {
    this._queue = [];
    this._locked = false;
  }

  lock() {
    return new Promise((resolve) => {
      if (!this._locked) {
        this._locked = true;
        resolve();
      } else {
        this._queue.push(resolve);
      }
    });
  }

  unlock() {
    if (this._queue.length > 0) {
      const next = this._queue.shift();
      next();
    } else {
      this._locked = false;
    }
  }
}

// One mutex per S3 JSON file — fine-grained locking
const mutexes = {};
const getMutex = (fileName) => {
  if (!mutexes[fileName]) {
    mutexes[fileName] = new Mutex();
  }
  return mutexes[fileName];
};

/**
 * ACID-safe atomic read-modify-write for S3 JSON files.
 *
 * Usage:
 *   await updateJsonInS3('users.json', (users) => {
 *     users.push(newUser);
 *     return users; // must return updated array
 *   });
 *
 * The callback receives the LATEST data freshly read from S3
 * and must return the updated array to be persisted.
 * All concurrent calls for the same file are serialised.
 */
export const updateJsonInS3 = async (fileName, updateCallback) => {
  const mutex = getMutex(fileName);
  await mutex.lock();
  try {
    // Always read fresh from S3 inside the lock
    const current = await getJsonFromS3(fileName);
    const updated = await updateCallback(current);
    await saveJsonToS3(fileName, updated);
    return updated;
  } finally {
    // ALWAYS release the lock, even on error
    mutex.unlock();
  }
};