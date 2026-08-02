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
    // If file doesn't exist, return empty array
    if (error.name === 'NoSuchKey') {
      return [];
    }
    console.error(`Error reading ${fileName} from S3:`, error);
    return [];
  }
};

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
