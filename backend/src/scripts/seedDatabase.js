import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import BankTemplate from '../models/BankTemplate.js';

// Setup paths to find the .env file in the parent directory
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '../../.env') });

const seedTemplates = [
  {
    bankName: 'SBI',
    documentType: 'Savings Account Statement',
    extractionRules: {
      columnsRequired: ['Date', 'Description', 'Debit', 'Credit', 'Balance'],
      geminiPrompt: 'Extract the transactions from this SBI (State Bank of India) statement. Ignore the account summary and header details. Ensure the output strictly follows the required columns.'
    }
  },
  {
    bankName: 'Axis',
    documentType: 'Credit Card Statement',
    extractionRules: {
      columnsRequired: ['Date', 'Description', 'Debit', 'Credit', 'Balance'],
      geminiPrompt: 'Extract the transactions from this Axis Bank statement. Pay special attention to international transactions if present, but only output the standard columns.'
    }
  },
  {
    bankName: 'ICICI',
    documentType: 'Current Account Statement',
    extractionRules: {
      columnsRequired: ['Date', 'Description', 'Debit', 'Credit', 'Balance'],
      geminiPrompt: 'Extract the transactions from this ICICI Bank statement. Ignore the opening balance row and closing balance row, only extract the actual transaction rows.'
    }
  },
  {
    bankName: 'Kotak Mahindra',
    documentType: 'Savings Account Statement',
    extractionRules: {
      columnsRequired: ['Date', 'Description', 'Debit', 'Credit', 'Balance'],
      geminiPrompt: 'Extract transactions from this Kotak Mahindra bank statement. Note that date formats might differ, ensure dates are standardized. Ignore UPI summary metadata.'
    }
  },
  {
    bankName: 'Punjab National Bank',
    documentType: 'Savings Account Statement',
    extractionRules: {
      columnsRequired: ['Date', 'Description', 'Debit', 'Credit', 'Balance'],
      geminiPrompt: 'Extract transactions from this PNB (Punjab National Bank) statement. Carefully distinguish between deposits (credit) and withdrawals (debit) as headers might vary.'
    }
  },
  {
    bankName: 'Bank of Baroda',
    documentType: 'Current Account Statement',
    extractionRules: {
      columnsRequired: ['Date', 'Description', 'Debit', 'Credit', 'Balance'],
      geminiPrompt: 'Extract transactions from this Bank of Baroda statement. Discard any page footer or header text, and only parse the tabular transaction data.'
    }
  },
  {
    bankName: 'Yes Bank',
    documentType: 'Savings Account Statement',
    extractionRules: {
      columnsRequired: ['Date', 'Description', 'Debit', 'Credit', 'Balance'],
      geminiPrompt: 'Extract transactions from this Yes Bank statement. If the description spans multiple lines in the PDF, combine them into a single string.'
    }
  },
  {
    bankName: 'HDFC Bank',
    documentType: 'Savings Account Statement',
    extractionRules: {
      columnsRequired: ['Date', 'Description', 'Debit', 'Credit', 'Balance'],
      geminiPrompt: 'Extract transactions from this HDFC Bank statement. Ignore the summary headers at the top.'
    }
  },
  {
    bankName: 'Canara Bank',
    documentType: 'Savings Account Statement',
    extractionRules: {
      columnsRequired: ['Date', 'Description', 'Debit', 'Credit', 'Balance'],
      geminiPrompt: 'Extract transactions from this Canara Bank statement. Filter out any promotional text at the bottom of pages.'
    }
  },
  {
    bankName: 'Union Bank of India',
    documentType: 'Savings Account Statement',
    extractionRules: {
      columnsRequired: ['Date', 'Description', 'Debit', 'Credit', 'Balance'],
      geminiPrompt: 'Extract transactions from this Union Bank statement. Focus strictly on the table data.'
    }
  },
  {
    bankName: 'IDFC First Bank',
    documentType: 'Savings Account Statement',
    extractionRules: {
      columnsRequired: ['Date', 'Description', 'Debit', 'Credit', 'Balance'],
      geminiPrompt: 'Extract transactions from this IDFC First statement. Ignore standard interest rate disclaimers.'
    }
  },
  {
    bankName: 'Bank of India',
    documentType: 'Savings Account Statement',
    extractionRules: {
      columnsRequired: ['Date', 'Description', 'Debit', 'Credit', 'Balance'],
      geminiPrompt: 'Extract transactions from this Bank of India statement. Ensure opening and closing balances are not mixed into the transaction list.'
    }
  },
  {
    bankName: 'Indian Bank',
    documentType: 'Savings Account Statement',
    extractionRules: {
      columnsRequired: ['Date', 'Description', 'Debit', 'Credit', 'Balance'],
      geminiPrompt: 'Extract transactions from this Indian Bank statement. Pay attention to multi-line descriptions.'
    }
  },
  {
    bankName: 'Central Bank of India',
    documentType: 'Savings Account Statement',
    extractionRules: {
      columnsRequired: ['Date', 'Description', 'Debit', 'Credit', 'Balance'],
      geminiPrompt: 'Extract transactions from this Central Bank of India statement. Strictly output only the required columns.'
    }
  }
];

const runSeed = async () => {
  try {
    if (!process.env.MONGODB_URI) {
      throw new Error('MONGODB_URI is not defined in .env');
    }

    console.log('🔄 Connecting to MongoDB Atlas...');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected successfully to Cloud Database!');

    console.log('🌱 Injecting highly-tuned AI templates...');
    
    for (const template of seedTemplates) {
      // We use upsert so it updates existing ones or creates new ones without duplicating
      await BankTemplate.findOneAndUpdate(
        { bankName: template.bankName },
        template,
        { upsert: true, new: true }
      );
      console.log(`✅ Successfully injected AI Template for: ${template.bankName}`);
    }

    console.log('🎉 Database seeding 100% complete!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error seeding database:', error.message);
    process.exit(1);
  }
};

runSeed();
