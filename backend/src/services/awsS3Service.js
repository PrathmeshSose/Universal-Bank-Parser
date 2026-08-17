import {
  S3Client,
  PutObjectCommand,
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
          row.date ?? "",
          row.description ?? "",
          row.prevBalance ?? "",
          row.debit ?? "",
          row.credit ?? "",
          row.currBalance ?? "",
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