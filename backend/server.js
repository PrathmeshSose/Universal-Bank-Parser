import "dotenv/config";

import express from "express";
import cors from "cors";

import uploadRoutes from "./src/routes/upload.js";
import exportRoutes from "./src/routes/export.js";
import banksRoutes from "./src/routes/banks.js";
import authRoutes from "./src/routes/auth.js";
import recordsRoutes from "./src/routes/records.js";
import statsRoutes from "./src/routes/stats.js";

const app = express();

const PORT = process.env.PORT || 5000;

// BUG-39 FIX: Restrict CORS to known origins instead of reflecting all
const allowedOrigins = process.env.ALLOWED_ORIGINS
  ? process.env.ALLOWED_ORIGINS.split(',')
  : ['http://localhost:5173', 'http://localhost:3000', 'http://127.0.0.1:5173'];

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow non-browser requests (curl, Postman) and whitelisted origins
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error(`CORS: Origin '${origin}' not allowed.`));
      }
    },
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
    bedrockConfigured: Boolean(process.env.AWS_REGION)
  });
});

app.use("/api/upload", uploadRoutes);
app.use("/api/export", exportRoutes);
app.use("/api/banks", banksRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/records", recordsRoutes);
app.use("/api/stats", statsRoutes);

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
    // BUG-42 FIX: Validate critical environment variables on startup
    const missingVars = [];
    if (!process.env.JWT_SECRET) missingVars.push('JWT_SECRET');
    if (!process.env.AWS_S3_BUCKET_NAME) missingVars.push('AWS_S3_BUCKET_NAME');
    if (!process.env.AWS_REGION) missingVars.push('AWS_REGION');
    if (!process.env.MASTER_ADMIN_PASSWORD) missingVars.push('MASTER_ADMIN_PASSWORD');

    if (missingVars.length > 0) {
      console.error('\n❌ STARTUP BLOCKED: Missing required environment variables:');
      missingVars.forEach(v => console.error(`   - ${v}`));
      console.error('Please add these to your backend/.env file and restart.\n');
      process.exit(1);
    }

    app.listen(PORT, () => {
      console.log(
        `Universal Bank Parser API running on http://localhost:${PORT}`
      );
      console.log(`Operating in Zero Storage (S3 Data Lake) Mode.`);
      console.log(`CORS allowed origins: ${allowedOrigins.join(', ')}`);
    });
  } catch (error) {
    console.error("Server startup failed:", error.message);
    process.exit(1);
  }
}

startServer();