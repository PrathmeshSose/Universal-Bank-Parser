# Software Requirements Specification (SRS)
## Project: Universal Bank Statement Parser
**Version:** 1.0
**Date:** July 18, 2026

---

## 1. Introduction

### 1.1 Purpose
The purpose of this document is to define the full software requirements for the Universal Bank Statement Parser. This system will automate the extraction of transactional data from various bank statement formats (PDFs and images) and export the verified data to Google Sheets.

### 1.2 Scope
The software will provide a web-based interface for users to upload financial documents. It will utilize Google Gemini 1.5 for multimodal AI extraction and MongoDB for storing configuration templates. The system is bound by a strict "Zero Storage" security policy, ensuring no financial data is persistently stored.

---

## 2. Overall Description

### 2.1 Product Perspective
The system follows a three-tier architecture:
1.  **Client Tier:** A React (Vite) Single Page Application (SPA).
2.  **Middle Tier:** A Node.js (Express) REST API acting as the orchestrator.
3.  **Data Tier:** A MongoDB database used exclusively for configuration and templating.

### 2.2 User Classes and Characteristics
*   **Operations User:** Uploads documents and manually verifies flagged data. Requires an intuitive, fast UI.
*   **System Administrator (DB Engineer):** Adds new JSON templates to MongoDB to support new bank formats.

---

## 3. System Features (Functional Requirements)

### 3.1 Secure File Ingestion
*   **FR-1.1:** The system MUST allow users to drag and drop PDF, PNG, or JPEG files.
*   **FR-1.2:** The frontend MUST reject files larger than 5MB or of unsupported types before transmission.
*   **FR-1.3:** The backend MUST stream the file directly into server RAM (using `multer` memory storage) and MUST NOT write the file to the local disk.

### 3.2 Dynamic Template Routing
*   **FR-2.1:** The backend MUST query MongoDB to retrieve the specific JSON extraction rules based on the identified bank format (e.g., SBI, HDFC).

### 3.3 AI-Powered Data Extraction
*   **FR-3.1:** The backend MUST securely transmit the in-memory file buffer and the MongoDB template to the Google Gemini API.
*   **FR-3.2:** The system MUST receive a structured JSON array of financial transactions from Gemini.
*   **FR-3.3:** The backend MUST immediately trigger garbage collection to purge the file buffer from RAM once extraction is complete.

### 3.4 Human-in-the-Loop Validation
*   **FR-4.1:** The frontend MUST display a split-screen UI showing the original document and the extracted data grid.
*   **FR-4.2:** The frontend MUST automatically calculate `Previous Balance + Credit - Debit = Current Balance` for every row.
*   **FR-4.3:** The frontend MUST highlight any row in red that fails the mathematical validation.
*   **FR-4.4:** The system MUST allow the user to edit highlighted cells inline, which MUST trigger an immediate recalculation of the validation math.

### 3.5 Google Sheets Export
*   **FR-5.1:** The "Export" button MUST remain disabled until all validation flags are cleared.
*   **FR-5.2:** The backend MUST use a Google Cloud Service Account (OAuth 2.0) to append the verified JSON data to a specified Google Sheet.

---

## 4. External Interface Requirements

### 4.1 User Interfaces
*   The UI will be built with React and Tailwind CSS, focusing on a clean, minimal design emphasizing the data grid and the PDF viewer.

### 4.2 Software Interfaces
*   **Google Gemini API:** Used for multimodal document analysis and data extraction.
*   **Google Sheets API v4:** Used for the final data export.
*   **MongoDB:** Used via Mongoose ODM for fetching Bank Templates.

### 4.3 API Contracts (Internal)
**POST `/api/upload`**
*   **Input:** `multipart/form-data` (file)
*   **Output:** `200 OK` with JSON array of transactions.

**POST `/api/export`**
*   **Input:** `application/json` (verified transaction array)
*   **Output:** `200 OK` (Success confirmation).

---

## 5. Non-Functional Requirements

### 5.1 Security Requirements (Zero Storage Mandate)
*   **NFR-1.1:** Absolutely no raw financial documents, PDFs, or extracted transaction data shall be saved to MongoDB, AWS, or the Node.js local filesystem.
*   **NFR-1.2:** All API keys and Database URIs must be stored as environment variables (`.env`) and never hardcoded into the source repository.

### 5.2 Performance & Scalability
*   **NFR-2.1:** The system must process and return extracted data from a standard 3-page PDF in under 15 seconds.
*   **NFR-2.2:** The architecture must allow adding new bank formats by simply inserting a new JSON document into MongoDB, requiring zero backend code deployments.

---

## 6. Database Schema Design (MongoDB)

**Collection:** `BankTemplates`
```json
{
  "_id": "ObjectId",
  "bankName": "String (e.g., 'HDFC')",
  "documentType": "String (e.g., 'Savings Account')",
  "extractionRules": {
    "columnsRequired": ["Array of Strings"],
    "geminiPrompt": "String (Specific instructions for the LLM)"
  }
}
```

---

## 7. Developer Task Assignments

This section breaks down the immediate action items for each developer role to begin parallel development.

### 7.1 Frontend Developer Tasks
*   **Task 1:** Scaffold the React application using Vite and configure Tailwind CSS.
*   **Task 2:** Build the `FileDropZone` component using HTML5 drag-and-drop. Implement client-side validation to reject files > 5MB and non-PDF/image formats.
*   **Task 3:** Build the `VerificationGrid` split-screen UI (PDF viewer on the left, interactive data table on the right).
*   **Task 4:** Write the mathematical validation logic to automatically calculate row balances based on the JSON data provided by the backend.
*   **Task 5:** Implement the "Smart Flagging" feature to highlight rows with math errors in red, allowing inline editing. Disable the final Export button until all flags are cleared.

### 7.2 Backend Developer Tasks (Prathmesh)
*   **Task 1:** Initialize the Node.js (Express) server and install core dependencies (`express`, `multer`, `mongoose`, `@google/genai`).
*   **Task 2:** Create the `POST /api/upload` route. Configure `multer` with `memoryStorage()` to enforce the Zero Storage requirement.
*   **Task 3:** Establish a secure connection to the MongoDB cluster using environment variables (`.env`).
*   **Task 4:** Write the Gemini AI Service. Pass the in-memory PDF buffer and the MongoDB template to the `@google/genai` SDK and return the structured JSON to the frontend.
*   **Task 5:** Create the `POST /api/export` route to securely authenticate with the Google Sheets API and append the verified JSON data.

### 7.3 Database Engineer Tasks
*   **Task 1:** Provision a MongoDB database (e.g., MongoDB Atlas cluster) and provide the secure connection string to the Backend Developer.
*   **Task 2:** Create the `BankTemplates` collection and enforce the schema design defined in Section 6.
*   **Task 3:** Research and draft the initial JSON parsing templates for the top 3 target banks (e.g., SBI, HDFC, Axis).
*   **Task 4:** Set up a Google Cloud Project (GCP). Enable the Google Gemini API and Google Sheets API. Generate the Service Account credentials and provide them securely to the Backend Developer.
