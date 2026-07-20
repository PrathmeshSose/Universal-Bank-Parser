import Groq from 'groq-sdk';
import pdfParse from 'pdf-parse';

/**
 * Service to handle data extraction using Groq
 * @param {Buffer} fileBuffer - The raw PDF file held in memory
 * @param {String} mimeType - The file type (e.g., 'application/pdf')
 * @param {String} templatePrompt - The specific instructions for this bank format
 */
export const extractBankData = async (fileBuffer, mimeType, templatePrompt, pdfPassword = "") => {
  if (mimeType !== 'application/pdf') {
    throw new Error('Groq extraction currently only supports PDF files.');
  }

  // 1. Extract raw text from the PDF buffer
  console.log('📄 Extracting text from PDF...');
  let pdfText = '';
  try {
    // pdf-parse doesn't use options.password properly. 
    // We must pass it inside the dataBuffer object for the underlying PDF.js to catch it.
    let pdfConfig = fileBuffer;
    if (pdfPassword) {
      pdfConfig = { data: fileBuffer, password: pdfPassword };
    }
    
    const data = await pdfParse(pdfConfig);
    pdfText = data.text;
  } catch (error) {
    if (error.message.includes('No password given')) {
      throw new Error('This PDF is password protected! Please enter the password before uploading.');
    } else if (error.message.includes('Incorrect Password')) {
      throw new Error('Incorrect PDF Password. Please try again.');
    }
    throw new Error(`Failed to parse PDF text: ${error.message}`);
  }

  if (!pdfText || pdfText.trim() === '') {
    throw new Error('Could not extract any text from the PDF. It might be an image-based scanned PDF.');
  }

  // 2. Initialize Groq SDK
  const groq = new Groq({
    apiKey: process.env.GROQ_API_KEY
  });

  console.log('🧠 Sending text to Groq (llama3-70b-8192) for extraction...');
  
  const enforcedPrompt = `${templatePrompt}
  
CRITICAL INSTRUCTION: You MUST return a JSON object with a single key "transactions" containing an array of objects.
Each object MUST have these exact keys (case-sensitive): Date, Description, Debit, Credit, Balance.
Example: { "transactions": [ { "Date": "2023-10-01", "Description": "Deposit", "Debit": "", "Credit": "100", "Balance": "100" } ] }`;

  // 3. Send text and instructions to Groq
  const chatCompletion = await groq.chat.completions.create({
    messages: [
      {
        role: "system",
        content: "You are a financial data extraction AI. Always output strict JSON."
      },
      {
        role: "user",
        content: `INSTRUCTIONS:\n${enforcedPrompt}\n\nBANK STATEMENT TEXT:\n${pdfText}`
      }
    ],
    model: "llama-3.3-70b-versatile",
    response_format: { type: "json_object" },
    temperature: 0,
  });

  const responseText = chatCompletion.choices[0]?.message?.content;
  
  if (!responseText) {
    throw new Error('Groq returned an empty response.');
  }

  return JSON.parse(responseText);
};
