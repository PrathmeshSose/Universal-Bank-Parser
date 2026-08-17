import 'dotenv/config';
import { extractBankData } from './src/services/extractionService.js';

const samplePdfText = `
STATEMENT OF ACCOUNT - HDFC BANK
Account No: 5010029481023
Period: 01-JUL-2026 to 15-JUL-2026

Date        Narration                             Chq/Ref No   Debit       Credit      Balance
01/07/26    OPENING BALANCE                                                           150,000.00
03/07/26    NEFT CR-SALARY JULY 2026-CORP         N07039481                85,000.00   235,000.00
05/07/26    ATM WDL-HDFC ATM MUMBAI              49102834     10,000.00                225,000.00
08/07/26    UPI-VENDOR SUPPLIES PVT LTD-8491      94821039     45,250.00                179,750.00
12/07/26    RTGS INWARD-DIVIDEND CREDIT          R12079482                32,400.00   212,150.00
14/07/26    BILLPAY-ELECTRICITY CHARGES          BP9482103     4,150.00                208,000.00
`;

const extractionRules = `
Extract each transaction row. Each object must have:
- Date: transaction date as shown
- Description: narration/description text
- Debit: debit amount (empty string if none)
- Credit: credit amount (empty string if none)
- Balance: running balance after transaction
`;

// Create a fake PDF buffer from the sample text for testing
// In production, this would be a real PDF buffer from multer
import { Buffer } from 'buffer';

async function runTest() {
  console.log("\n🧪 TEST: Bank Statement Extraction (Bedrock → Groq Fallback)\n");

  // We'll test the service logic directly by monkey-patching parsePdf
  // Since we don't have a real PDF, we simulate extraction with the Groq fallback directly
  try {
    // Import Groq directly for this test since we don't have a real PDF
    const Groq = (await import('groq-sdk')).default;

    if (!process.env.GROQ_API_KEY || process.env.GROQ_API_KEY === 'your_groq_api_key_here') {
      console.log("⚠️  GROQ_API_KEY not set — testing Bedrock only\n");
    }

    const { BedrockRuntimeClient, InvokeModelCommand } = await import("@aws-sdk/client-bedrock-runtime");

    const bedrockClient = new BedrockRuntimeClient({
      region: process.env.AWS_REGION || "us-east-1",
      credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
      }
    });

    // ── Try Bedrock ────────────────────────────────────
    console.log("┌─────────────────────────────────────────");
    console.log("│ 🟡 [BEDROCK] Attempting AWS Bedrock...");
    console.log("│    Model: us.amazon.nova-lite-v1:0");
    console.log("└─────────────────────────────────────────");

    let bedrockSuccess = false;
    try {
      const payload = {
        messages: [{ role: "user", content: [{ text: `Extract transactions from:\n${samplePdfText}\nReturn JSON: { "transactions": [{Date,Description,Debit,Credit,Balance}] }` }] }],
        inferenceConfig: { maxTokens: 2048, temperature: 0.1 }
      };

      const response = await bedrockClient.send(new InvokeModelCommand({
        modelId: "us.amazon.nova-lite-v1:0",
        contentType: "application/json",
        accept: "application/json",
        body: JSON.stringify(payload)
      }));

      const body    = JSON.parse(new TextDecoder().decode(response.body));
      const aiText  = body.output?.message?.content?.[0]?.text || "";
      const parsed  = JSON.parse(aiText);

      console.log("✅ [BEDROCK] SUCCESS!\n");
      console.dir(parsed, { depth: null, colors: true });
      bedrockSuccess = true;

    } catch (err) {
      console.log(`❌ [BEDROCK] FAILED — ${err.message}`);
      console.log("   ↳ Switching to Groq fallback...\n");
    }

    // ── Try Groq (if Bedrock failed) ───────────────────
    if (!bedrockSuccess) {
      console.log("┌─────────────────────────────────────────");
      console.log("│ 🟡 [GROQ] Attempting Groq fallback...");
      console.log("│    Model: llama-3.3-70b-versatile");
      console.log("└─────────────────────────────────────────");

      const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

      const chatCompletion = await groq.chat.completions.create({
        messages: [
          { role: "system", content: "You are a financial data extraction AI. Always output strict JSON." },
          { role: "user",   content: `Extract transactions from:\n${samplePdfText}\n\nReturn: { "transactions": [{"Date":"","Description":"","Debit":"","Credit":"","Balance":""}] }` }
        ],
        model: "llama-3.3-70b-versatile",
        response_format: { type: "json_object" },
        temperature: 0,
      });

      const result = JSON.parse(chatCompletion.choices[0]?.message?.content);
      console.log("✅ [GROQ] SUCCESS!\n");
      console.dir(result, { depth: null, colors: true });
      console.log(`\n✅ Total transactions: ${result.transactions?.length}`);
    }

    console.log("\n🎉 TEST COMPLETE!");

  } catch (error) {
    console.error("\n❌ ALL PROVIDERS FAILED:", error.message);
  }
}

runTest();
