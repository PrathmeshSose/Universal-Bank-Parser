import { S3Client, GetObjectCommand, PutObjectCommand } from "@aws-sdk/client-s3";

const s3Client = new S3Client({ 
  region: process.env.AWS_REGION || "us-east-1" 
});

/**
 * Helper: Converts S3 Stream to String
 */
const streamToString = (stream) =>
  new Promise((resolve, reject) => {
    const chunks = [];
    stream.on("data", (chunk) => chunks.push(chunk));
    stream.on("error", reject);
    stream.on("end", () => resolve(Buffer.concat(chunks).toString("utf8")));
  });

/**
 * Reads a JSON array from S3
 */
export const getJsonFromS3 = async (fileName) => {
  try {
    const bucketName = process.env.AWS_S3_BUCKET_NAME;
    if (!bucketName) return [];

    const command = new GetObjectCommand({
      Bucket: bucketName,
      Key: `database/${fileName}`
    });

    const response = await s3Client.send(command);
    const bodyContents = await streamToString(response.Body);
    return JSON.parse(bodyContents);
  } catch (error) {
    // If file doesn't exist, return default templates for templates.json or empty array
    if (error.name === 'NoSuchKey' || error.Code === 'NoSuchKey') {
      if (fileName === 'templates.json') {
        return DEFAULT_BANK_TEMPLATES;
      }
      return [];
    }
    console.error(`Error reading ${fileName} from S3:`, error);
    if (fileName === 'templates.json') {
      return DEFAULT_BANK_TEMPLATES;
    }
    return [];
  }
};

const DEFAULT_BANK_TEMPLATES = [
  {
    bankName: 'HDFC',
    documentType: 'Savings & Credit Card Statement',
    extractionRules: {
      columnsRequired: ['Date', 'Description', 'Debit', 'Credit', 'Balance'],
      geminiPrompt: 'Extract transactions from this HDFC bank statement. Ignore summary headers and footers.'
    }
  },
  {
    bankName: 'SBI',
    documentType: 'Savings Account Statement',
    extractionRules: {
      columnsRequired: ['Date', 'Description', 'Debit', 'Credit', 'Balance'],
      geminiPrompt: 'Extract transactions from this SBI (State Bank of India) statement. Ignore account summary metadata.'
    }
  },
  {
    bankName: 'ICICI',
    documentType: 'Current Account Statement',
    extractionRules: {
      columnsRequired: ['Date', 'Description', 'Debit', 'Credit', 'Balance'],
      geminiPrompt: 'Extract transactions from this ICICI bank statement. Exclude opening and closing balance rows.'
    }
  },
  {
    bankName: 'Axis',
    documentType: 'Savings Account Statement',
    extractionRules: {
      columnsRequired: ['Date', 'Description', 'Debit', 'Credit', 'Balance'],
      geminiPrompt: 'Extract transactions from this Axis Bank statement. Ignore footer notes.'
    }
  }
];

/**
 * Saves a JSON array to S3
 */
export const saveJsonToS3 = async (fileName, dataArray) => {
  try {
    const bucketName = process.env.AWS_S3_BUCKET_NAME;
    if (!bucketName) return false;

    const command = new PutObjectCommand({
      Bucket: bucketName,
      Key: `database/${fileName}`,
      Body: JSON.stringify(dataArray, null, 2),
      ContentType: "application/json"
    });

    await s3Client.send(command);
    return true;
  } catch (error) {
    console.error(`Error saving ${fileName} to S3:`, error);
    return false;
  }
};
