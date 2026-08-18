import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
} from "@aws-sdk/client-s3";

const s3Client =
  new S3Client({
    region:
      process.env.AWS_REGION ||
      "us-east-1",
  });

const escapeCsv = (value) => {
  if (
    value === null ||
    value === undefined
  ) {
    return "";
  }

  const text = String(value);

  if (
    text.includes(",") ||
    text.includes('"') ||
    text.includes("\n") ||
    text.includes("\r")
  ) {
    return `"${text.replace(
      /"/g,
      '""'
    )}"`;
  }

  return text;
};

const convertJsonToCsv =
  (jsonArray) => {
    if (
      !Array.isArray(
        jsonArray
      ) ||
      jsonArray.length === 0
    ) {
      return "";
    }

    const headers = [
      "Date",
      "Description",
      "Previous Balance",
      "Debit",
      "Credit",
      "Current Balance",
    ];

    const rows =
      jsonArray.map(
        (row) => [
          row.Date ?? row.date ?? "",
          row.Description ?? row.description ?? "",
          row.PrevBalance ?? row.prevBalance ?? "",
          row.Debit ?? row.debit ?? "",
          row.Credit ?? row.credit ?? "",
          row.Balance ?? row.currBalance ?? "",
        ]
      );

    return [
      headers,
      ...rows,
    ]
      .map((row) =>
        row
          .map(escapeCsv)
          .join(",")
      )
      .join("\r\n");
  };

export const uploadDataToS3 =
  async (
    jsonArray,
    userId,
    bankName
  ) => {
    const bucketName =
      process.env
        .AWS_S3_BUCKET_NAME;

    if (!bucketName) {
      throw new Error(
        "AWS_S3_BUCKET_NAME is not configured."
      );
    }

    const csvString =
      convertJsonToCsv(
        jsonArray
      );

    const timestamp =
      Date.now();

    const sanitizedBankName =
      bankName
        .replace(
          /[^a-zA-Z0-9]/g,
          "_"
        )
        .toLowerCase();

    const fileName =
      `transactions/${userId}/${sanitizedBankName}_${timestamp}.csv`;

    const command =
      new PutObjectCommand({
        Bucket: bucketName,
        Key: fileName,
        Body: csvString,
        ContentType:
          "text/csv",
        ServerSideEncryption:
          "AES256",
      });

    await s3Client.send(
      command
    );

    return `s3://${bucketName}/${fileName}`;
  };

export const uploadPdfToS3 = async (pdfBuffer, userId, originalName) => {
  const bucketName = process.env.AWS_S3_BUCKET_NAME;
  if (!bucketName) return null; // Graceful degradation if S3 not configured

  try {
    const timestamp = Date.now();
    const sanitizedName = originalName.replace(/[^a-zA-Z0-9.]/g, "_");
    const key = `pdf-archive/${userId}/${timestamp}_${sanitizedName}`;

    const command = new PutObjectCommand({
      Bucket: bucketName,
      Key: key,
      Body: pdfBuffer,
      ContentType: "application/pdf",
      ServerSideEncryption: "AES256",
    });

    await s3Client.send(command);
    return key;
  } catch (error) {
    console.error("S3 PDF upload error:", error);
    return null;
  }
};

export const getPdfStreamFromS3 = async (s3Key) => {
  const bucketName = process.env.AWS_S3_BUCKET_NAME;
  if (!bucketName) throw new Error("AWS_S3_BUCKET_NAME is not configured.");

  const command = new GetObjectCommand({
    Bucket: bucketName,
    Key: s3Key,
  });

  const response = await s3Client.send(command);
  return response.Body;
};