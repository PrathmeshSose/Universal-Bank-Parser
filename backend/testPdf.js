import 'dotenv/config';
import fs from 'fs';
import path from 'path';
import pdfParse from 'pdf-parse';

const PDF_FILE = process.argv[2] || 'test.pdf';
const PDF_PASSWORD = process.argv[3] || '';

async function testPdfParse() {
  console.log("\n🧪 PDF PARSING TEST (Text + OCR)");
  console.log("====================================================\n");

  // 1. Check if file exists
  const filePath = path.resolve(PDF_FILE);
  console.log(`📁 File: ${filePath}`);

  if (!fs.existsSync(filePath)) {
    console.error(`\n❌ File not found: ${filePath}`);
    console.log("\n📋 Usage:");
    console.log("   node testPdf.js <filename.pdf> [password]");
    process.exit(1);
  }

  const fileSize = (fs.statSync(filePath).size / 1024).toFixed(1);
  console.log(`📏 Size: ${fileSize} KB\n`);

  const pdfBuffer = fs.readFileSync(filePath);

  // ── Step 1: Try text-based extraction first ──
  console.log("📄 [Method 1] Trying text-based extraction (pdf-parse)...");
  let pdfText = '';
  try {
    let pdfConfig = pdfBuffer;
    if (PDF_PASSWORD) {
      pdfConfig = { data: pdfBuffer, password: PDF_PASSWORD };
    }
    const pdfData = await pdfParse(pdfConfig);
    pdfText = pdfData.text.trim();
    console.log(`   Characters extracted: ${pdfText.length}`);
  } catch (error) {
    if (error.message.includes('No password given')) {
      console.error("\n🔒 PDF is PASSWORD PROTECTED!");
      console.log(`   Run: node testPdf.js ${PDF_FILE} <password>\n`);
      return;
    }
    console.log(`   ❌ Text extraction failed: ${error.message}`);
  }

  // ── Step 2: If text extraction got very little, use OCR ──
  if (pdfText.length > 50) {
    console.log("\n✅ Text-based extraction successful!\n");
    showResults(pdfText);
    return;
  }

  console.log("   ⚠️  Very little text found — this is a SCANNED/IMAGE PDF");
  console.log("\n📷 [Method 2] Trying OCR (Tesseract.js)...");
  console.log("   ⏳ This may take 30-60 seconds on first run (downloading OCR data)...\n");

  try {
    // Convert PDF to images
    const { pdf } = await import('pdf-to-img');
    const { createWorker } = await import('tesseract.js');

    const worker = await createWorker('eng');

    let fullText = '';
    let pageNum = 0;

    const document = await pdf(pdfBuffer, { scale: 2 }); // scale 2 for better OCR

    for await (const image of document) {
      pageNum++;
      console.log(`   🔍 OCR processing page ${pageNum}...`);
      const { data: { text } } = await worker.recognize(image);
      fullText += text + '\n';
    }

    await worker.terminate();

    pdfText = fullText.trim();
    console.log(`\n✅ OCR extraction successful! (${pageNum} pages scanned)\n`);
    showResults(pdfText);

  } catch (ocrError) {
    console.error(`\n❌ OCR Failed: ${ocrError.message}`);
    console.log("\n💡 Try installing: npm install tesseract.js pdf-to-img");
    console.log("   Or use a text-based PDF (not a scanned image).\n");
  }
}

function showResults(text) {
  console.log("────────────────────────────────────────────");
  console.log(`📝 Characters: ${text.length}`);
  console.log(`📖 Words:      ${text.split(/\s+/).length}`);
  console.log("────────────────────────────────────────────");
  console.log("\n📃 EXTRACTED TEXT (first 2000 chars):\n");
  console.log("─".repeat(50));
  console.log(text.substring(0, 2000));
  console.log("─".repeat(50));
  if (text.length > 2000) {
    console.log(`\n... (${text.length - 2000} more characters)`);
  }
  console.log("\n🎉 Ready for AI extraction!\n");
}

testPdfParse();
