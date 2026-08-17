import 'dotenv/config';
import fs from 'fs';
import path from 'path';

const BASE_URL = 'http://localhost:5000/api';

async function runApiTests() {
  console.log("\n====================================================");
  console.log("🧪 COMPLETE API ENDPOINT TEST SUITE");
  console.log("   Testing: Health → Auth → Banks → Export → Upload");
  console.log("====================================================\n");

  let authToken = '';
  let testEmail = `test_${Date.now()}@bankparser.com`;
  let testPassword = 'Password123!';

  // ── TEST 1: Health Check ──
  console.log("1️⃣  GET /api/health");
  try {
    const res = await fetch(`${BASE_URL}/health`);
    const data = await res.json();
    console.log(`   Status: ${res.status} OK`);
    console.log(`   Response:`, data);
  } catch (err) {
    console.error(`   ❌ Health Check Failed: ${err.message}`);
    console.log("\n💡 Make sure backend server is running (npm run dev) on port 5000!");
    process.exit(1);
  }

  // ── TEST 2: User Registration ──
  console.log("\n2️⃣  POST /api/auth/register");
  try {
    const res = await fetch(`${BASE_URL}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: 'API Tester', email: testEmail, password: testPassword })
    });
    const data = await res.json();
    console.log(`   Status: ${res.status}`);
    console.log(`   Response:`, data);
  } catch (err) {
    console.error(`   ❌ Registration Failed: ${err.message}`);
  }

  // ── TEST 3: User Login ──
  console.log("\n3️⃣  POST /api/auth/login");
  try {
    const res = await fetch(`${BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: testEmail, password: testPassword })
    });
    const data = await res.json();
    console.log(`   Status: ${res.status}`);
    if (data.token) {
      authToken = data.token;
      console.log(`   ✅ JWT Token received successfully! (User: ${data.user.name})`);
    } else {
      console.error(`   ❌ Login failed:`, data);
    }
  } catch (err) {
    console.error(`   ❌ Login Request Error: ${err.message}`);
  }

  // ── TEST 4: Fetch Supported Banks ──
  console.log("\n4️⃣  GET /api/banks");
  try {
    const res = await fetch(`${BASE_URL}/banks`);
    const data = await res.json();
    console.log(`   Status: ${res.status}`);
    console.log(`   Supported Banks:`, data.data);
  } catch (err) {
    console.error(`   ❌ Fetch Banks Error: ${err.message}`);
  }

  // ── TEST 5: CSV Export ──
  console.log("\n5️⃣  POST /api/export");
  try {
    const sampleVerifiedData = [
      { Date: '01/06/2026', Description: 'Opening Balance', Debit: '', Credit: '', Balance: '5187.52' },
      { Date: '01/06/2026', Description: 'UPI-SHUBHAM', Debit: '', Credit: '2000.00', Balance: '5187.52' }
    ];

    const res = await fetch(`${BASE_URL}/export`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ verifiedData: sampleVerifiedData })
    });
    const csvContent = await res.text();
    console.log(`   Status: ${res.status} OK (Content-Type: ${res.headers.get('content-type')})`);
    console.log(`   CSV Preview:\n${csvContent.trim()}`);
  } catch (err) {
    console.error(`   ❌ Export Error: ${err.message}`);
  }

  // ── TEST 6: File Upload & AI Extraction ──
  console.log("\n6️⃣  POST /api/upload (Document Upload & Extraction)");
  const pdfPath = path.resolve('statement.pdf');
  if (!fs.existsSync(pdfPath)) {
    console.log("   ⚠️  statement.pdf not found in backend directory. Skipping upload test.");
  } else if (!authToken) {
    console.log("   ⚠️  No Auth Token available. Skipping upload test.");
  } else {
    try {
      const fileBuffer = fs.readFileSync(pdfPath);
      const blob = new Blob([fileBuffer], { type: 'application/pdf' });
      const formData = new FormData();
      formData.append('document', blob, 'statement.pdf');
      formData.append('bankName', 'HDFC');

      console.log(`   Sending statement.pdf to /api/upload with Bearer token...`);
      const res = await fetch(`${BASE_URL}/upload`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${authToken}`
        },
        body: formData
      });

      const data = await res.json();
      console.log(`   Status: ${res.status}`);
      console.log(`   Response:`, JSON.stringify(data, null, 2));
    } catch (err) {
      console.error(`   ❌ Upload Test Error: ${err.message}`);
    }
  }

  console.log("\n====================================================");
  console.log("🎉 API TEST SUITE COMPLETE!");
  console.log("====================================================\n");
}

runApiTests();
