import { GoogleGenerativeAI } from '@google/generative-ai';

/**
 * Service to handle multimodal data extraction using Google Gemini 1.5
 * @param {Buffer} fileBuffer - The raw file held in memory
 * @param {String} mimeType - The file type (e.g., 'application/pdf', 'image/png')
 * @param {String} templatePrompt - The specific instructions for this bank format
 */
export const extractBankData = async (fileBuffer, mimeType, templatePrompt) => {
  // Initialize the Gemini API with your secret key
  const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
  
  // We use gemini-1.5-flash as it is extremely fast and natively supports multimodal (PDF/Images)
  const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

  // We append a strict instruction to ensure it only returns a clean JSON array
  const finalPrompt = templatePrompt + "\n\nCRITICAL INSTRUCTION: You must return the extracted transactions STRICTLY as a JSON array of objects. Do not include any other text, markdown formatting, or explanations.";

  // Convert the RAM buffer directly into a format Gemini can read without saving it to disk
  const filePart = {
    inlineData: {
      data: fileBuffer.toString("base64"),
      mimeType: mimeType
    }
  };

  console.log('🧠 Sending file to Google Gemini for extraction...');
  
  const result = await model.generateContent([finalPrompt, filePart]);
  const response = result.response;
  let text = response.text();
  
  // Clean up any accidental markdown blocks that Gemini sometimes wraps JSON in
  text = text.replace(/```json/g, '').replace(/```/g, '').trim();
  
  return JSON.parse(text);
};
