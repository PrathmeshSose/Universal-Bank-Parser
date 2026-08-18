import fetch from 'node-fetch'; // Requires node-fetch or Node 18+

async function test() {
  try {
    const loginRes = await fetch('http://localhost:5000/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'admin@universalparser.com', password: 'superadmin123' })
    });
    const loginData = await loginRes.json();
    console.log('Login:', loginData);

    const statsRes = await fetch('http://localhost:5000/api/stats/dashboard', {
      headers: { 'Authorization': `Bearer ${loginData.token}` }
    });
    const statsText = await statsRes.text();
    console.log('Stats:', statsRes.status, statsText);
  } catch (err) {
    console.error(err);
  }
}

test();
