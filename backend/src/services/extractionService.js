/**
 * extractionService.js
 * 
 * Smart AI Extraction with automatic fallback:
 *   1st → AWS Bedrock (Amazon Nova Lite)
 *   2nd → Groq (Llama 3.3 70B) [if Bedrock fails]
 * 
 * Console clearly shows which provider is active or failed.
 */

import { BedrockRuntimeClient, InvokeModelCommand } from "@aws-sdk/client-bedrock-runtime";
import Groq from 'groq-sdk';

// ─── Clients ─────────────────────────────────────────────────────────────────

const bedrockClient = new BedrockRuntimeClient({
  region: process.env.AWS_REGION || "us-east-1",
  credentials: process.env.AWS_ACCESS_KEY_ID ? {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
  } : undefined
});

// ─── PDF Parser ───────────────────────────────────────────────────────────────

async function parsePdf(fileBuffer, pdfPassword) {
  let pdfText = '';
  try {
    const { default: pdfParse } = await import('pdf-parse/lib/pdf-parse.js');
    const pdfConfig = pdfPassword ? { data: fileBuffer, password: pdfPassword } : fileBuffer;
    const pdfData = await pdfParse(pdfConfig);
    pdfText = (pdfData.text || '').trim();
  } catch (error) {
    if (error.message.includes('No password given')) {
      throw new Error('This PDF is password protected! Please enter the password.');
    } else if (error.message.includes('Incorrect Password')) {
      throw new Error('Incorrect PDF password. Please try again.');
    }
    console.log(`⚠️ Text extraction warning: ${error.message}`);
  }

  // If text extraction yielded enough text, return it
  if (pdfText.length > 50) {
    return pdfText;
  }

  // Otherwise, fallback to OCR (scanned PDF)
  console.log("⚠️ Very little text found via standard parser. Attempting OCR (Tesseract.js)...");
  try {
    const { pdf } = await import('pdf-to-img');
    const { createWorker } = await import('tesseract.js');

    const worker = await createWorker('eng');
    let fullText = '';
    let pageNum = 0;

    const document = await pdf(fileBuffer, { scale: 2 });
    for await (const image of document) {
      pageNum++;
      console.log(`   🔍 OCR processing page ${pageNum}...`);
      const { data: { text } } = await worker.recognize(image);
      fullText += text + '\n';
    }

    await worker.terminate();
    pdfText = fullText.trim();
    if (!pdfText) {
      throw new Error("OCR could not extract any text from the document images.");
    }
    console.log(`✅ OCR successful (${pageNum} pages scanned, ${pdfText.length} chars extracted)`);
    return pdfText;
  } catch (ocrErr) {
    console.error("❌ OCR Error:", ocrErr.message);
    throw new Error(`Failed to parse PDF text (Standard & OCR both failed): ${ocrErr.message}`);
  }
}

// ─── Helper: Clean AI JSON response ──────────────────────────────────────────

function cleanJsonResponse(text) {
  let cleaned = text.trim();
  // Strip markdown code fences
  if (cleaned.startsWith('```json')) cleaned = cleaned.replace(/^```json/, '').replace(/```$/, '').trim();
  if (cleaned.startsWith('```'))     cleaned = cleaned.replace(/^```/, '').replace(/```$/, '').trim();

  // If response has a "transactions" wrapper key, unwrap it
  try {
    const parsed = JSON.parse(cleaned);
    if (parsed.transactions && Array.isArray(parsed.transactions)) return parsed;
    if (Array.isArray(parsed)) return { transactions: parsed };
    return parsed;
  } catch {
    // Try extracting JSON array from raw text
    const startIdx = cleaned.indexOf('[');
    const endIdx   = cleaned.lastIndexOf(']');
    if (startIdx !== -1 && endIdx !== -1 && endIdx > startIdx) {
      const arr = JSON.parse(cleaned.substring(startIdx, endIdx + 1));
      return { transactions: arr };
    }
    throw new Error("Could not parse valid JSON from AI response.");
  }
}

// ─── Provider 1: AWS Bedrock ──────────────────────────────────────────────────

async function extractWithBedrock(pdfText, extractionRulesPrompt) {
  console.log("┌─────────────────────────────────────────");
  console.log("│ 🟡 [BEDROCK] Attempting AWS Bedrock...");
  console.log("│    Model: us.amazon.nova-lite-v1:0");
  console.log("└─────────────────────────────────────────");

  const prompt = `You are an expert financial data extractor. Extract transaction rows from the bank statement below.

EXTRACTION RULES:
${extractionRulesPrompt}

RAW BANK STATEMENT TEXT:
${pdfText}

CRITICAL: Return ONLY a JSON object: { "transactions": [ { "Date": "", "Description": "", "Debit": "", "Credit": "", "Balance": "" } ] }
No markdown, no extra text.`;

  const payload = {
    messages: [{ role: "user", content: [{ text: prompt }] }],
    inferenceConfig: { maxTokens: 4096, temperature: 0.1, topP: 0.9 }
  };

  const command = new InvokeModelCommand({
    modelId: "us.amazon.nova-lite-v1:0",
    contentType: "application/json",
    accept: "application/json",
    body: JSON.stringify(payload)
  });

  const response     = await bedrockClient.send(command);
  const responseBody = JSON.parse(new TextDecoder().decode(response.body));
  const aiText       = (responseBody.output?.message?.content?.[0]?.text || "").trim();

  if (!aiText) throw new Error("Bedrock returned an empty response.");

  const result = cleanJsonResponse(aiText);

  console.log("✅ [BEDROCK] SUCCESS — Extraction complete via AWS Bedrock");
  return result;
}

// ─── Provider 2: Groq (Fallback) ─────────────────────────────────────────────

async function extractWithGroq(pdfText, extractionRulesPrompt) {
  if (!process.env.GROQ_API_KEY) {
    throw new Error("GROQ_API_KEY is not set in .env — cannot use Groq fallback.");
  }

  const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

  const enforcedPrompt = `${extractionRulesPrompt}

CRITICAL: Return ONLY a JSON object with key "transactions" containing an array.
Each item MUST have: Date, Description, Debit, Credit, Balance.
Example: { "transactions": [ { "Date": "01/07/26", "Description": "SALARY", "Debit": "", "Credit": "85000", "Balance": "235000" } ] }`;

  const modelsToTry = [
    "openai/gpt-oss-120b",
    "qwen/qwen3.6-27b",
    "groq/compound",
    "groq/compound-mini",
    "openai/gpt-oss-20b"
  ];

  let lastError = null;

  for (const modelId of modelsToTry) {
    console.log("┌─────────────────────────────────────────");
    console.log(`│ 🟡 [GROQ] Attempting Groq fallback (${modelId})...`);
    console.log("└─────────────────────────────────────────");

    try {
      const chatCompletion = await groq.chat.completions.create({
        messages: [
          { role: "system", content: "You are a financial data extraction AI. Always output strict JSON only." },
          { role: "user",   content: `INSTRUCTIONS:\n${enforcedPrompt}\n\nBANK STATEMENT TEXT:\n${pdfText}` }
        ],
        model: modelId,
        response_format: { type: "json_object" },
        temperature: 0,
        max_tokens: 4096,
      });

      const responseText = chatCompletion.choices[0]?.message?.content;
      if (!responseText) throw new Error(`Groq model ${modelId} returned an empty response.`);

      const result = cleanJsonResponse(responseText);
      console.log(`✅ [GROQ] SUCCESS — Extraction complete via Groq (${modelId})`);
      return result;
    } catch (err) {
      console.log(`   ❌ Groq model ${modelId} failed: ${err.message}`);
      lastError = err;
    }
  }

  throw lastError || new Error("All Groq models failed.");
}

// ─── Main Export: Smart Fallback Extractor ────────────────────────────────────

/**
 * Extracts bank transactions from a PDF using AI with automatic fallback.
 * Tries AWS Bedrock first → falls back to Groq if Bedrock fails.
 * 
 * @param {Buffer} fileBuffer            - Raw PDF buffer
 * @param {String} mimeType              - Must be 'application/pdf'
 * @param {String} extractionRulesPrompt - Bank-specific extraction instructions
 * @param {String} pdfPassword           - Optional PDF password
 * @returns {Object}                     - { transactions: [...], provider: "bedrock"|"groq" }
 */
export const extractBankData = async (fileBuffer, mimeType, extractionRulesPrompt, pdfPassword = "") => {
  if (mimeType !== 'application/pdf') {
    throw new Error('Only PDF files are supported.');
  }

  console.log("\n====================================================");
  console.log("🚀 AI EXTRACTION ENGINE STARTING");
  console.log("   Strategy: Bedrock → Groq (auto-fallback)");
  console.log("====================================================");

  // Step 1: Parse PDF
  console.log("\n📄 [PDF] Parsing PDF text...");
  const pdfText = await parsePdf(fileBuffer, pdfPassword);
  if (!pdfText || pdfText.trim() === '') {
    throw new Error("No text found in PDF. It may be a scanned image (no OCR).");
  }
  console.log(`✅ [PDF] Parsed successfully (${pdfText.length} characters)`);

  // Step 2: Try Bedrock
  try {
    const result = await extractWithBedrock(pdfText, extractionRulesPrompt);
    console.log("====================================================\n");
    return { ...result, provider: "bedrock" };
  } catch (bedrockError) {
    console.log(`❌ [BEDROCK] FAILED — Reason: ${bedrockError.message}`);
    console.log("   ↳ Switching to Groq fallback...\n");
  }

  // Step 3: Fallback to Groq
  try {
    const result = await extractWithGroq(pdfText, extractionRulesPrompt);
    console.log("====================================================\n");
    return { ...result, provider: "groq" };
  } catch (groqError) {
    console.log(`❌ [GROQ] FAILED — Reason: ${groqError.message}`);
    console.log("====================================================\n");
    throw new Error(`All AI providers failed.\n  Bedrock: see above\n  Groq: ${groqError.message}`);
  }
};
