import 'dotenv/config';
import Groq from 'groq-sdk';

async function checkGroqModels() {
  console.log("🔍 Checking available Groq models for your API key...");
  try {
    const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });
    const list = await groq.models.list();
    console.log("\n✅ Available Models:");
    for (const m of list.data) {
      console.log(`   - ${m.id}`);
    }
  } catch (err) {
    console.error("❌ Error fetching models:", err.message);
  }
}

checkGroqModels();
