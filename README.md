# 🏦 Universal Bank Parser
### AI-Powered Bank Statement Extraction & Verification Tool

[![Node.js](https://img.shields.io/badge/Node.js-18+-green?style=flat-square&logo=node.js)](https://nodejs.org)
[![React](https://img.shields.io/badge/React-18-blue?style=flat-square&logo=react)](https://reactjs.org)
[![AWS](https://img.shields.io/badge/AWS-S3%20%2B%20Bedrock-orange?style=flat-square&logo=amazonaws)](https://aws.amazon.com)
[![License](https://img.shields.io/badge/License-MIT-yellow?style=flat-square)](LICENSE)

> An enterprise-grade, full-stack web application that uses AI to automatically extract, validate, and archive financial transactions from bank statement PDFs — in under 30 seconds.

---

## 📸 Preview

| Dashboard | Upload | Statement History |
|---|---|---|
| Analytics & stats | AI-powered extraction | Full audit trail |

---

## ✨ Features

- 🤖 **AI PDF Extraction** — AWS Bedrock (Nova Lite) with automatic Groq fallback
- 🔒 **Password-Protected PDFs** — OCR support via Tesseract.js for scanned documents
- 🏦 **Multi-Bank Support** — HDFC, SBI, ICICI, Axis + any bank via custom input
- 📊 **Live Transaction Grid** — Debit/credit totals with mathematical validation
- ☁️ **Zero Disk Storage** — All data streamed directly to AWS S3 (never stored on server)
- 📥 **CSV Export** — Download extracted transactions for any statement
- 📋 **Statement History** — Complete audit trail with approve/reject workflow
- 👥 **3-Tier RBAC** — Super Admin → Admin → User role system
- 🛡️ **Enterprise Security** — JWT, Bcrypt, XSS protection, rate limiting, CORS lockdown
- 📈 **Dashboard Analytics** — Real-time stats for total documents, transactions, and volumes

---

## 🏗️ Tech Stack

### Frontend
| Technology | Purpose |
|---|---|
| **React 18** | UI Framework |
| **Vite 5** | Build tool & dev server |
| **Lucide React** | Icon library |
| **Vanilla CSS** | YONO Corporate design system |

### Backend
| Technology | Purpose |
|---|---|
| **Node.js 18+** | Runtime |
| **Express.js 4** | REST API framework |
| **Multer** | Memory-based file upload (zero disk) |
| **JWT + Bcryptjs** | Authentication & password hashing |

### AI & Cloud
| Technology | Purpose |
|---|---|
| **AWS Bedrock (Nova Lite)** | Primary AI extraction model |
| **Groq API** | Auto-fallback AI (GPT-4o class) |
| **Tesseract.js** | OCR for scanned PDFs |
| **AWS S3** | File storage + serverless JSON database |

---

## 🚀 Quick Start

### Prerequisites
- Node.js v18+
- npm v9+
- AWS account with an S3 bucket
- Groq API key (free at [console.groq.com](https://console.groq.com))

### 1. Clone the Repository
```bash
git clone https://github.com/PrathmeshSose/Universal-Bank-Parser.git
cd Universal-Bank-Parser
```

### 2. Configure Backend Environment
```bash
cd backend
cp .env.example .env   # or create .env manually
```

Edit `backend/.env`:
```env
PORT=5000
JWT_SECRET=your_strong_secret_here
MASTER_ADMIN_PASSWORD=YourStrongPassword@123
AWS_REGION=us-east-1
AWS_S3_BUCKET_NAME=your-s3-bucket-name
AWS_ACCESS_KEY_ID=your_access_key_id
AWS_SECRET_ACCESS_KEY=your_secret_access_key
GROQ_API_KEY=gsk_your_groq_api_key_here
```

### 3. Install Dependencies & Seed Database
```bash
# Install backend dependencies
cd backend
npm install

# Create the Super Admin account in S3 (run once)
node seedS3.js
```

### 4. Start Backend
```bash
npm run dev
# API runs at http://localhost:5000
```

### 5. Install & Start Frontend
```bash
cd ../frontend
npm install
npm run dev
# App runs at http://localhost:5173
```

### 6. Open in Browser
Visit **http://localhost:5173** and login with:
- **Email:** `superadmin@gmail.com`
- **Password:** `superadmin123`

---

## 📁 Project Structure

```
Bank_statement_Extractor/
├── frontend/                    # React + Vite Frontend
│   └── src/
│       ├── components/          # 13 UI components
│       ├── services/api.js      # All API call functions
│       └── utils/               # Helpers (bankList, formatter)
│
├── backend/                     # Node.js + Express Backend
│   └── src/
│       ├── routes/              # 6 API route files
│       ├── services/            # AI + AWS S3 integrations
│       └── middleware/          # JWT auth guard
│
├── .gitignore
└── README.md
```

---

## 🔌 API Endpoints

| Method | Endpoint | Access | Description |
|---|---|---|---|
| POST | `/api/auth/login` | Public | User login → JWT token |
| POST | `/api/auth/register` | Public | Self-registration (User role only) |
| POST | `/api/auth/users/create` | Admin+ | Create user with custom role |
| GET | `/api/auth/users` | Admin+ | List all users |
| PATCH | `/api/auth/users/:id/role` | Admin+ | Update role or status |
| DELETE | `/api/auth/users/:id` | Super Admin | Delete user permanently |
| POST | `/api/upload` | User+ | Upload PDF → AI extract → S3 |
| GET | `/api/records` | User+ | Get statement history |
| PATCH | `/api/records/:id/status` | Admin+ | Approve or reject a statement |
| GET | `/api/export/csv/:recordId` | User+ | Download extracted CSV |
| GET | `/api/stats/dashboard` | User+ | Dashboard analytics |
| GET | `/api/health` | Public | API health check |

---

## 👥 User Roles

```
👑 SUPER ADMIN
   └── Full access to all features
   └── Create, delete, disable any user
   └── View and export all statements

🛡️ ADMIN
   └── Create user and admin accounts
   └── View and manage all statements
   └── Approve or reject statement records

👤 USER (Analyst)
   └── Upload bank statement PDFs
   └── View and download own statements only
```

---

## 🤖 AI Extraction Flow

```
PDF Uploaded
     │
     ├─▶ pdf-parse (text extraction)
     │       └── Not enough text? ──▶ Tesseract.js OCR
     │
     ▼
AWS Bedrock (Nova Lite)  [Primary]
     │
     └── Failed? ──▶ Groq API [Auto-Fallback]
                         │
                         ▼
              JSON: [ {Date, Description, Debit, Credit, Balance} ]
                         │
                         ▼
              Stored in AWS S3 as CSV + PDF
```

---

## 🔐 Security

- **JWT Authentication** — Tokens expire in 24 hours
- **Bcrypt Password Hashing** — Salt rounds: 10
- **Role-Based Middleware** — Every route is role-guarded
- **XSS Protection** — HTML tag stripping on all text inputs
- **Brute Force Guard** — Max 10 login attempts per 15 minutes per IP
- **Zero Disk Storage** — PDFs never touch the server disk
- **CORS Whitelist** — Only allowed origins can call the API
- **Env Validation** — Server won't start with missing critical variables

---

## ☁️ AWS S3 Database Schema

This project uses S3 as a serverless JSON database (no SQL or MongoDB needed):

| File | Purpose |
|---|---|
| `users.json` | User accounts and roles |
| `records.json` | Statement upload history |
| `templates.json` | Bank-specific AI extraction prompts |
| `csvs/` | Extracted transaction CSV files |
| `pdfs/` | Original uploaded PDF files |

---

## 🌐 Supported Banks

| Bank | Template |
|---|---|
| HDFC Bank | Savings and Credit Card Statements |
| SBI (State Bank of India) | Savings Account Statements |
| ICICI Bank | Current Account Statements |
| Axis Bank | Savings Account Statements |
| Any Other Bank | Generic AI parsing (user enters bank name) |

---

## 📄 License

This project is licensed under the **MIT License**.

---

## 👨‍💻 Developed By

**Universal Bank Parser Team**  
GitHub: [PrathmeshSose/Universal-Bank-Parser](https://github.com/PrathmeshSose/Universal-Bank-Parser)

---

> ⚠️ **Security Notice:** Never commit your `.env` file to version control. All AWS credentials and API keys must be kept private.
