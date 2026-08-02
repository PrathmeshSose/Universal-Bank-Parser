import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";

// Initialize the S3 Client
// AWS credentials (AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY, AWS_REGION) 
// must be set in the .env file or environment variables.
const s3Client = new S3Client({ 
  region: process.env.AWS_REGION || "us-east-1" 
});

/**
 * Converts a JSON array of objects into a CSV string.
 */
const convertJsonToCsv = (jsonArray) => {
  if (!jsonArray || jsonArray.length === 0) return "";
  
  // Extract headers
  const headers = Object.keys(jsonArray[0]);
  const csvRows = [];
  
  // Add headers row
  csvRows.push(headers.join(","));
  
  // Add data rows
  for (const row of jsonArray) {
    const values = headers.map(header => {
      let val = row[header] === null || row[header] === undefined ? "" : String(row[header]);
      // Escape commas and quotes for CSV
      if (val.includes(",") || val.includes('"') || val.includes("\n")) {
        val = `"${val.replace(/"/g, '""')}"`;
      }
      return val;
    });
    csvRows.push(values.join(","));
  }
  
  return csvRows.join("\n");
};

/**
 * Uploads a JSON array as a CSV file to an AWS S3 Bucket.
 * 
 * @param {Array} jsonArray - The AI-extracted transaction data.
 * @param {String} userId - The ID of the user uploading the file (for tenant isolation tracking).
 * @param {String} bankName - The name of the bank for file naming.
 * @returns {String} - The public or pre-signed URL of the uploaded S3 file.
 */
export const uploadDataToS3 = async (jsonArray, userId, bankName) => {
  try {
    const bucketName = process.env.AWS_S3_BUCKET_NAME;
    if (!bucketName) {
      throw new Error("AWS_S3_BUCKET_NAME is not defined in your environment variables.");
    }

    console.log("🔄 Converting JSON to CSV format...");
    const csvString = convertJsonToCsv(jsonArray);

    // Create a unique, secure file name using the user ID and timestamp
    const timestamp = Date.now();
    const sanitizedBankName = bankName.replace(/[^a-zA-Z0-9]/g, "_").toLowerCase();
    const fileName = `transactions/${userId}/${sanitizedBankName}_${timestamp}.csv`;

    console.log(`☁️ Uploading CSV to S3 Bucket: ${bucketName}/${fileName}`);

    const command = new PutObjectCommand({
      Bucket: bucketName,
      Key: fileName,
      Body: csvString,
      ContentType: "text/csv",
      // Optional: Set Server-Side Encryption
      ServerSideEncryption: "AES256"
    });

    await s3Client.send(command);

    // Construct the URL. If the bucket is private, this would be swapped out for a getSignedUrl function.
    // For this architecture, we return the object URI format.
    const s3Url = `https://${bucketName}.s3.${process.env.AWS_REGION || "us-east-1"}.amazonaws.com/${fileName}`;
    
    console.log("✅ Successfully uploaded to S3!");
    return s3Url;

  } catch (error) {
    console.error("AWS S3 Upload Error:", error);
    throw new Error(`Failed to upload to S3: ${error.message}`);
  }
};
