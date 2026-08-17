
const region =
  process.env.AWS_REGION ||
  process.env.AWS_DEFAULT_REGION ||
  "us-east-1";

const bedrock = new BedrockRuntimeClient({
  region,
import { BedrockRuntimeClient, InvokeModelCommand } from "@aws-sdk/client-bedrock-runtime";
import pdfParse from 'pdf-parse';

// Initialize the Bedrock Runtime Client
// AWS credentials (AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY, AWS_REGION) 
// must be set in the .env file or environment variables.
const bedrockClient = new BedrockRuntimeClient({ 
  region: process.env.AWS_REGION || "us-east-1",
  credentials: process.env.AWS_ACCESS_KEY_ID ? {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
  } : undefined
});

/* =========================================================
   HELPERS
========================================================= */

function cleanText(text) {
  if (!text) return "";

  return String(text)
    .replace(/\r/g, "\n")
    .replace(/[ \t]+/g, " ")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

function extractJsonFromResponse(text) {
  if (!text) {
    throw new Error("AI returned an empty response.");
  }

  let cleaned = String(text).trim();

  // Remove markdown fences if AI added them.
  cleaned = cleaned
    .replace(/^```json\s*/i, "")
    .replace(/^```\s*/i, "")
    .replace(/\s*```$/i, "")
    .trim();

  // Find JSON array.
  const firstArray = cleaned.indexOf("[");
  const lastArray = cleaned.lastIndexOf("]");

  if (
    firstArray !== -1 &&
    lastArray !== -1 &&
    lastArray > firstArray
  ) {
    cleaned = cleaned.slice(
      firstArray,
      lastArray + 1
    );
  }

  try {
    const options = {};
    if (pdfPassword && pdfPassword.trim() !== "") {
      options.password = pdfPassword;
    }
    
    const pdfData = await pdfParse(pdfPassword ? { data: pdfBuffer, password: pdfPassword } : pdfBuffer, options);
    return pdfData.text;
  } catch (error) {
    console.error(
      "Unable to parse AI JSON response:"
    );

    console.error(cleaned);

    throw new Error(
      "AI extraction returned invalid JSON."
    );
  }
}

/* =========================================================
   PDF TEXT EXTRACTION
   pdf-parse v2 API
========================================================= */

export async function extractPdfText(
  fileBuffer,
  pdfPassword = ""
) {
  if (!Buffer.isBuffer(fileBuffer)) {
    throw new Error(
      "Uploaded PDF buffer is invalid."
    );
  }

  if (fileBuffer.length === 0) {
    throw new Error(
      "Uploaded PDF is empty."
    );
  }

  console.log("");
  console.log(
    "=========================================="
  );
  console.log(
    "PDF TEXT EXTRACTION"
  );
  console.log(
    "=========================================="
  );

  console.log(
    "Buffer size:",
    fileBuffer.length,
    "bytes"
  );

  let parser;

  try {
    /*
     * pdf-parse v2 uses:
     *
     *   new PDFParse({ data: buffer })
     *
     * and then:
     *
     *   await parser.getText()
     */

    const options = {
      data: fileBuffer,
    };

    /*
     * Password support.
     *
     * pdf-parse v2 passes PDF.js options through.
     */
    if (pdfPassword) {
      options.password = pdfPassword;
    }

    parser = new PDFParse(options);

    const pdfData = await parser.getText();

    const text = cleanText(
      pdfData?.text || ""
    );

    console.log(
      "Extracted text length:",
      text.length
    );

    console.log(
      "Extracted text preview:"
    );

    console.log(
      text.substring(0, 2000)
    );

    console.log(
      "=========================================="
    );

    if (!text) {
      throw new Error(
        "PDF contains no readable text. This may be a scanned/image-only PDF."
      );
    }

    return text;
  } catch (error) {
    console.error(
      "PDF PARSE ERROR:"
    );

    console.error(error);

    const errorMessage =
      error?.message ||
      String(error);

    const lower =
      errorMessage.toLowerCase();

    if (
      lower.includes("password") ||
      lower.includes("encrypted") ||
      lower.includes("encryption")
    ) {
      throw new Error(
        "This PDF is password protected or encrypted. Please provide the correct password."
      );
    }

    throw new Error(
      `PDF parsing failed: ${errorMessage}`
    );
  } finally {
    /*
     * pdf-parse v2 exposes destroy().
     * Always clean up the parser.
     */
    if (
      parser &&
      typeof parser.destroy === "function"
    ) {
      try {
        await parser.destroy();
      } catch {
        // Ignore cleanup errors.
      }
    }
  }
}

/* =========================================================
   BEDROCK EXTRACTION
========================================================= */

export const extractBankDataWithBedrock =
  async (
    fileBuffer,
    mimeType,
    extractionPrompt,
    pdfPassword = ""
  ) => {
    console.log("");
    console.log(
      "=========================================="
    );
    console.log(
      "START BANK STATEMENT EXTRACTION"
    );
    console.log(
      "=========================================="
    );

    console.log(
      "MIME:",
      mimeType
    );

    console.log(
      "Buffer:",
      fileBuffer?.length,
      "bytes"
    );

  console.log("🧠 Step 2: Sending parsed text to Amazon Nova Lite (amazon.nova-lite-v1:0)...");
  
  // Construct the prompt strictly asking for a JSON array
  const prompt = `
You are an expert financial data extractor. I am providing you with the raw text extracted from a bank statement PDF.
Your task is to extract the transaction rows exactly as requested and return ONLY a valid JSON array.

    const pdfText =
      await extractPdfText(
        fileBuffer,
        pdfPassword
      );

    if (!pdfText) {
      throw new Error(
        "No text could be extracted from the uploaded PDF."
      );
    }

    /*
     * Prevent an accidentally enormous AI prompt.
     */

    const MAX_TEXT_LENGTH = 120000;

    const statementText =
      pdfText.length >
      MAX_TEXT_LENGTH
        ? pdfText.substring(
            0,
            MAX_TEXT_LENGTH
          )
        : pdfText;

    console.log(
      "Text sent to AI:",
      statementText.length,
      "characters"
    );

    /* =====================================================
       PROMPT
    ===================================================== */

    const prompt = `
You are a bank statement transaction extraction system.

Extract EVERY transaction from the bank statement text below.

IMPORTANT RULES:

1. Use ONLY the statement text provided below.
2. Do NOT invent transactions.
3. Do NOT use example/demo transactions.
4. Do NOT reuse transactions from previous requests.
5. Return EVERY transaction present in the statement.
6. If the statement contains 10 transaction rows, return 10 transaction objects.
7. Preserve the transaction order.
8. Do not skip rows simply because descriptions are unusual.
9. Do not combine two transactions into one.
10. Do not create extra transactions.
11. Return ONLY valid JSON.
12. Return a JSON array.
13. Do not wrap the JSON in markdown.

Each transaction must have exactly these fields:

{
  "date": "",
  "description": "",
  "prevBalance": 0,
  "debit": 0,
  "credit": 0,
  "currBalance": 0
}

Rules for numeric values:

- Remove commas from amounts.
- Remove currency symbols.
- Use numbers, not strings.
- If debit is empty, use 0.
- If credit is empty, use 0.
- Preserve balance values exactly as shown when possible.

The extraction instructions supplied by the bank template are:

${
  extractionPrompt ||
  "Extract all bank statement transactions."
}

BANK STATEMENT TEXT:

${statementText}
`;

  // Amazon Nova Lite payload — uses the "messages" API format
  const payload = {
    messages: [
      {
        role: "user",
        content: [{ text: prompt }]
      }
    ],
    inferenceConfig: {
      maxTokens: 2048,
      temperature: 0.1,
      topP: 0.9
    }
  };

  try {
    const command = new InvokeModelCommand({
      modelId: "amazon.nova-lite-v1:0",
      contentType: "application/json",
      accept: "application/json",
      body: JSON.stringify(payload)
    });

    const response = await bedrockClient.send(command);
    
    // Decode response
    const responseBody = JSON.parse(new TextDecoder().decode(response.body));
    const aiResponseText = (responseBody.output?.message?.content?.[0]?.text || "").trim();

    // Clean and parse JSON array
    let cleaned = aiResponseText;
    if (cleaned.startsWith('```json')) cleaned = cleaned.replace(/^```json/, '').replace(/```$/, '').trim();
    if (cleaned.startsWith('```')) cleaned = cleaned.replace(/^```/, '').replace(/```$/, '').trim();

    const startIdx = cleaned.indexOf('[');
    const endIdx = cleaned.lastIndexOf(']');
    if (startIdx !== -1 && endIdx !== -1 && endIdx > startIdx) {
      cleaned = cleaned.substring(startIdx, endIdx + 1);
    }

    const jsonData = JSON.parse(cleaned);
    if (!Array.isArray(jsonData)) {
       throw new Error("Nova Lite did not return a valid JSON array.");
    }
    return jsonData;
  } catch (error) {
    console.error("AWS Bedrock Nova Lite Error:", error);
    throw new Error(`AWS Bedrock extraction failed: ${error.message}`);
  }
};
