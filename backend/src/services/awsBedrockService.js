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

/**
 * Parses a PDF buffer into raw text.
 */
async function parsePdf(pdfBuffer, pdfPassword) {
  try {
    const options = {};
    if (pdfPassword && pdfPassword.trim() !== "") {
      options.password = pdfPassword;
    }
    
    const pdfData = await pdfParse(pdfPassword ? { data: pdfBuffer, password: pdfPassword } : pdfBuffer, options);
    return pdfData.text;
  } catch (error) {
    console.error("PDF Parsing Error:", error.message);
    throw new Error("Failed to parse the PDF document. If it is password protected, please provide the correct password.");
  }
}

/**
 * Extracts tabular bank data using Amazon Bedrock (Anthropic Claude 3 Sonnet).
 * 
 * @param {Buffer} fileBuffer - The raw PDF file buffer.
 * @param {String} mimeType - Expected to be 'application/pdf'.
 * @param {String} extractionRulesPrompt - The specific prompt for this bank format.
 * @param {String} pdfPassword - Optional password for encrypted PDFs.
 * @returns {Array} - The extracted JSON array of transactions.
 */
export const extractBankDataWithBedrock = async (fileBuffer, mimeType, extractionRulesPrompt, pdfPassword = "") => {
  if (mimeType !== 'application/pdf') {
    throw new Error('Only PDF files are supported for extraction.');
  }

  console.log("📄 Step 1: Parsing PDF text...");
  const pdfText = await parsePdf(fileBuffer, pdfPassword);
  
  if (!pdfText || pdfText.trim() === '') {
    throw new Error("Could not extract any text from the PDF. It might be a scanned image without OCR.");
  }

  console.log("🧠 Step 2: Sending parsed text to Amazon Nova Lite (amazon.nova-lite-v1:0)...");
  
  // Construct the prompt strictly asking for a JSON array
  const prompt = `
You are an expert financial data extractor. I am providing you with the raw text extracted from a bank statement PDF.
Your task is to extract the transaction rows exactly as requested and return ONLY a valid JSON array.

EXTRACTION RULES:
${extractionRulesPrompt}

RAW BANK STATEMENT TEXT:
${pdfText}

CRITICAL INSTRUCTIONS:
- Return ONLY a valid JSON array containing the transaction objects.
- Do NOT wrap the JSON in markdown formatting like \`\`\`json.
- Do NOT include any introductory or concluding text. 
- The very first character of your response must be '[' and the last must be ']'.
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
