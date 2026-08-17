import { PDFParse } from "pdf-parse";
import {
  BedrockRuntimeClient,
  ConverseCommand,
} from "@aws-sdk/client-bedrock-runtime";

/* =========================================================
   BEDROCK CLIENT
========================================================= */

const region =
  process.env.AWS_REGION ||
  process.env.AWS_DEFAULT_REGION ||
  "us-east-1";

const bedrock = new BedrockRuntimeClient({
  region,
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
    const parsed = JSON.parse(cleaned);

    if (!Array.isArray(parsed)) {
      throw new Error(
        "AI response JSON is not an array."
      );
    }

    return parsed;
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

    /*
     * IMPORTANT:
     *
     * This extracts text from the ACTUAL uploaded
     * PDF buffer.
     *
     * No demo PDF.
     * No cached PDF.
     * No hard-coded transactions.
     */

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

    console.log("");
    console.log(
      "AI extraction prompt prepared."
    );

    /* =====================================================
       MODEL
    ===================================================== */

    const modelId =
      process.env.AWS_BEDROCK_MODEL_ID ||
      process.env.BEDROCK_MODEL_ID ||
      "anthropic.claude-3-haiku-20240307-v1:0";

    console.log(
      "Bedrock model:",
      modelId
    );

    /* =====================================================
       BEDROCK REQUEST
    ===================================================== */

    const command =
      new ConverseCommand({
        modelId,

        messages: [
          {
            role: "user",
            content: [
              {
                text: prompt,
              },
            ],
          },
        ],

        inferenceConfig: {
          maxTokens: 12000,
          temperature: 0,
        },
      });

    let response;

    try {
      response =
        await bedrock.send(command);
    } catch (error) {
      console.error(
        "BEDROCK REQUEST FAILED:"
      );

      console.error(error);

      throw new Error(
        `Bedrock extraction failed: ${
          error?.message ||
          "Unknown AWS error"
        }`
      );
    }

    /* =====================================================
       READ BEDROCK RESPONSE
    ===================================================== */

    const outputText =
      response?.output?.message?.content
        ?.map(
          (item) => item?.text || ""
        )
        .join("")
        .trim();

    console.log("");
    console.log(
      "AI RESPONSE LENGTH:",
      outputText?.length || 0
    );

    console.log(
      "AI RESPONSE PREVIEW:"
    );

    console.log(
      outputText?.substring(0, 3000)
    );

    if (!outputText) {
      throw new Error(
        "Bedrock returned an empty extraction response."
      );
    }

    /* =====================================================
       PARSE JSON
    ===================================================== */

    const transactions =
      extractJsonFromResponse(
        outputText
      );

    console.log("");
    console.log(
      "=========================================="
    );

    console.log(
      "EXTRACTION COMPLETE"
    );

    console.log(
      "TRANSACTIONS:",
      transactions.length
    );

    console.log(
      "=========================================="
    );

    console.table(
      transactions
    );

    if (
      transactions.length === 0
    ) {
      throw new Error(
        "The AI successfully read the PDF but found zero transactions."
      );
    }

    return transactions;
  };

