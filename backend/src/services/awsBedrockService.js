import { BedrockRuntimeClient, InvokeModelCommand } from "@aws-sdk/client-bedrock-runtime";
import pdfParse from 'pdf-parse';

// Initialize the Bedrock Runtime Client
// AWS credentials (AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY, AWS_REGION) 
// must be set in the .env file or environment variables.
const bedrockClient = new BedrockRuntimeClient({ 
  region: process.env.AWS_REGION || "us-east-1" 
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

  console.log("🧠 Step 2: Sending parsed text to Amazon Bedrock (Claude 3 Sonnet)...");
  
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

  // AWS Bedrock payload for Meta Llama 3.3 70B Instruct
  const payload = {
    prompt: `<|begin_of_text|><|start_header_id|>user<|end_header_id|>\n\n${prompt}<|eot_id|><|start_header_id|>assistant<|end_header_id|>\n\n`,
    max_gen_len: 2048,
    temperature: 0.1,
    top_p: 0.9
  };

  try {
    const command = new InvokeModelCommand({
      modelId: "meta.llama3-3-70b-instruct-v1:0",
      contentType: "application/json",
      accept: "application/json",
      body: JSON.stringify(payload)
    });

    const response = await bedrockClient.send(command);
    
    // Decode response
    const responseBody = JSON.parse(new TextDecoder().decode(response.body));
    const aiResponseText = (responseBody.generation || "").trim();

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
       throw new Error("Llama 3.3 did not return a valid JSON array.");
    }
    return jsonData;
  } catch (error) {
    console.error("AWS Bedrock Llama 3.3 Error:", error);
    throw new Error(`AWS Bedrock extraction failed: ${error.message}`);
  }
};
