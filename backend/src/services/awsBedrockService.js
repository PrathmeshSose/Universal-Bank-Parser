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
      // Create a custom data object to bypass pdf-parse limitations for encrypted files
      options.password = pdfPassword;
    }
    
    // We pass { data: pdfBuffer, password: pdfPassword } directly into pdfParse
    // due to the specific workaround we discovered in Phase 1 for encrypted PDFs.
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

  // Amazon Bedrock payload for Anthropic Claude 3 models
  const payload = {
    anthropic_version: "bedrock-2023-05-31",
    max_tokens: 4000,
    temperature: 0.0, // Strict extraction, no creative hallucination
    messages: [
      {
        role: "user",
        content: [
          {
            type: "text",
            text: prompt
          }
        ]
      }
    ]
  };

  try {
    const command = new InvokeModelCommand({
      // We use Claude 3 Sonnet for a perfect balance of speed, cost, and high intelligence
      modelId: "anthropic.claude-3-sonnet-20240229-v1:0",
      contentType: "application/json",
      accept: "application/json",
      body: JSON.stringify(payload)
    });

    const response = await bedrockClient.send(command);
    
    // Decode the Uint8Array response back into a string
    const responseBody = JSON.parse(new TextDecoder().decode(response.body));
    const aiResponseText = responseBody.content[0].text.trim();

    // Parse the JSON array
    try {
      const jsonData = JSON.parse(aiResponseText);
      if (!Array.isArray(jsonData)) {
         throw new Error("Bedrock did not return a JSON array.");
      }
      return jsonData;
    } catch (parseError) {
      console.error("JSON Parsing Error from AI Output:", aiResponseText);
      throw new Error("Failed to parse the AI output into JSON. The AI might have returned malformed data.");
    }
  } catch (error) {
    console.error("AWS Bedrock Error:", error);
    throw new Error(`AWS Bedrock extraction failed: ${error.message}`);
  }
};
