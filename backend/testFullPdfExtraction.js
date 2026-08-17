import 'dotenv/config';
import fs from 'fs';
import path from 'path';
import { extractBankData } from './src/services/extractionService.js';

const PDF_FILE = process.argv[2] || 'statement.pdf';
const BANK_NAME = process.argv[3] || 'HDFC';
const PDF_PASSWORD = process.argv[4] || '';

// Sample extraction rules prompt for testing
const defaultPrompt = `
Extract transaction rows from the bank statement text.
Each transaction object MUST have exact keys: Date, Description, Debit, Credit, Balance.
Format amounts with decimal points (e.g. 2000.00). Use empty string if value is missing.
`;

async function testFullPdfExtraction() {
  console.log("\n====================================================");
  console.log("🧪 FULL PDF EXTRACTION TEST (PDF → OCR/Text → AI)");
  console.log("====================================================\n");

  const filePath = path.resolve(PDF_FILE);
  console.log(`📁 Target PDF: ${filePath}`);

  if (!fs.existsSync(filePath)) {
    console.error(`\n❌ PDF file not found: ${filePath}`);
    console.log("\n📋 Usage:");
    console.log("   node testFullPdfExtraction.js <filename.pdf> [bankName] [password]");
    console.log("   node testFullPdfExtraction.js statement.pdf HDFC\n");
    process.exit(1);
  }

  const fileSize = (fs.statSync(filePath).size / 1024).toFixed(1);
  console.log(`📏 File Size:  ${fileSize} KB`);
  console.log(`🏦 Bank Name:  ${BANK_NAME}\n`);

  try {
    const fileBuffer = fs.readFileSync(filePath);

    // Call the unified extraction engine (PDF parse + OCR fallback + Bedrock/Groq AI)
    const result = await extractBankData(
      fileBuffer,
      'application/pdf',
      defaultPrompt,
      PDF_PASSWORD
    );

    console.log("\n✅ FULL PDF EXTRACTION COMPLETED SUCCESSFULLY!");
    console.log("────────────────────────────────────────────────────");
    console.log(`🤖 AI Provider Used: ${result.provider?.toUpperCase()}`);
    
    const transactions = result.transactions || result;
    console.log(`📊 Transactions Extracted: ${Array.isArray(transactions) ? transactions.length : 0}`);
    console.log("────────────────────────────────────────────────────\n");

    console.log("📋 Extracted JSON Transactions:\n");
    console.dir(transactions, { depth: null, colors: true });

    console.log("\n🎉 TEST COMPLETE!");

  } catch (error) {
    console.error("\n❌ Extraction Test Failed:", error.message);
  }
}

testFullPdfExtraction();
