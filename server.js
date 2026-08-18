import "dotenv/config";

import express from "express";
import cors from "cors";
import mongoose from "mongoose";

import uploadRoutes from "./src/routes/upload.js";
import exportRoutes from "./src/routes/export.js";
import banksRoutes from "./src/routes/banks.js";
import authRoutes from "./src/routes/auth.js";

const app = express();

const PORT = process.env.PORT || 5000;
const MONGODB_URI =
  process.env.MONGODB_URI || "mongodb://localhost:27017/bank_parser_dev";

app.use(
  cors({
    origin: true,
    credentials: true,
  })
);

app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true }));

console.log("Universal Bank Parser API starting...");

app.get("/api/health", (req, res) => {
  res.status(200).json({
    status: "success",
    message: "Universal Bank Statement Parser API is running",
    timestamp: new Date().toISOString(),
    awsRegion: process.env.AWS_REGION || "us-east-1",
    s3Configured: Boolean(process.env.AWS_S3_BUCKET_NAME),
    bedrockConfigured: Boolean(process.env.AWS_REGION),
    mongodbConnected: mongoose.connection.readyState === 1,
  });
});

app.use("/api/upload", uploadRoutes);
app.use("/api/export", exportRoutes);
app.use("/api/banks", banksRoutes);
app.use("/api/auth", authRoutes);

app.use((req, res) => {
  res.status(404).json({
    status: "error",
    message: `Route not found: ${req.method} ${req.originalUrl}`,
  });
});

app.use((error, req, res, next) => {
  console.error("GLOBAL SERVER ERROR:", error);

  res.status(error.status || 500).json({
    status: "error",
    message: error.message || "Internal server error.",
  });
});

async function startServer() {
  try {
    console.log("Connecting to MongoDB...");

    await mongoose.connect(MONGODB_URI);

    console.log("MongoDB connected successfully.");

    app.listen(PORT, () => {
      console.log(
        `Universal Bank Parser API running on http://localhost:${PORT}`
      );
    });
  } catch (error) {
    console.error("MongoDB connection failed:", error.message);
    process.exit(1);
  }
}

startServer();