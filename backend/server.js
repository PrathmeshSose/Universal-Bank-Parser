import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import mongoose from 'mongoose';
import uploadRoutes from './src/routes/upload.js';
import exportRoutes from './src/routes/export.js';
import BankTemplate from './src/models/BankTemplate.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// Database Connection & Dummy Seeding
mongoose.connect(process.env.MONGODB_URI)
  .then(async () => {
    console.log('✅ Connected to MongoDB successfully');
    
    // Quick script to insert a Dummy Template if the DB is empty (so you don't have to wait for the DB dev!)
    const count = await BankTemplate.countDocuments();
    if (count === 0) {
      await BankTemplate.create({
        bankName: 'HDFC',
        documentType: 'Credit Card Statement',
        extractionRules: {
          columnsRequired: ['Date', 'Description', 'Debit', 'Credit', 'Balance'],
          geminiPrompt: 'Extract the transactions from this HDFC bank statement. Ignore the summary headers at the top.'
        }
      });
      console.log('🌱 Dummy HDFC Bank Template injected into MongoDB!');
    }
  })
  .catch((err) => console.error('❌ MongoDB connection error:', err));

// Basic Health Check Route
app.get('/api/health', (req, res) => {
  res.json({ status: 'success', message: 'Universal Bank Statement Parser API is running' });
});

app.use('/api/upload', uploadRoutes);
app.use('/api/export', exportRoutes);

app.listen(PORT, () => {
  console.log(`🚀 Server is running on http://localhost:${PORT}`);
});
