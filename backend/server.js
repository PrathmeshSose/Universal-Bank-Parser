import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import uploadRoutes from './src/routes/upload.js';
import exportRoutes from './src/routes/export.js';
import banksRoutes from './src/routes/banks.js';
import authRoutes from './src/routes/auth.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

console.log('☁️ Universal Bank Parser API running in Pure AWS S3 Serverless mode.');

// Basic Health Check Route
app.get('/api/health', (req, res) => {
  res.json({ status: 'success', message: 'Universal Bank Statement Parser API is running' });
});

app.use('/api/upload', uploadRoutes);
app.use('/api/export', exportRoutes);
app.use('/api/banks', banksRoutes);
app.use('/api/auth', authRoutes);

app.listen(PORT, () => {
  console.log(`🚀 Server is running on http://localhost:${PORT}`);
});
