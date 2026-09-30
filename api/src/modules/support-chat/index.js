// Support chatbot — answers from order data first, Gemini (gemini-3.8-flash) for the rest.
const fs = require("fs");
const path = require("path");
function geminiKey() {
  if (process.env.GEMINI_API_KEY) return process.env.GEMINI_API_KEY.trim();
  try {
    const env = fs.readFileSync(path.join(__dirname, "..", "..", "..", "..", ".env"), "utf8");
    const line = env.split("\n").find((l) => l.trim().startsWith("GEMINI_API_KEY="));
    if (line) return line.split("=").slice(1).join("=").trim().replace(/^["']|["']$/g, "");
  } catch {}
  return "";
}
const MODELS = ["gemini-3.8-flash", "gemini-flash-latest"];
async function askGemini(question, context) {
  const key = geminiKey();
  if (!key) return "AI is not configured yet. A human will reply soon.";
  const body = JSON.stringify({
    system_instruction: { parts: [{ text: "You are a friendly support agent for a Nigerian food delivery marketplace. Keep answers short (2-3 sentences). Prices in naira." }] },
    contents: [{ parts: [{ text: `Menu/context: ${context}\n\nCustomer: ${question}` }] }],
  });
  for (let attempt = 0; attempt < 4; attempt++) {
    try {
      const model = MODELS[attempt % MODELS.length];
      const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${key}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body,
      });
      if (res.ok) {
        const data = await res.json();
        const text = data.candidates && data.candidates[0].content.parts[0].text;
        if (text) return text;
        return "Sorry, no answer right now.";
      }
    } catch {}
    await new Promise((r) => setTimeout(r, 3000 * (attempt + 1)));
  }
  return "Sorry, I could not get an answer right now. A human will reply soon.";
}
async function chat({ question, order }, catalog) {
  const q = (question || "").toLowerCase();
  if (order && /where|status|track|arriv|deliver|late/.test(q)) {
    return `Order ${order.order_no} is ${order.order_status.replace(/_/g, " ")}. Total ₦${(order.total_kobo / 100).toLocaleString()}. ETA ~${order.eta_min || 30} min.`;
  }
  if (/fee|delivery charge|how much.*deliver/.test(q)) {
    const fees = catalog.map((r) => `${r.name} ₦${(r.fee_kobo / 100).toLocaleString()}`).join("; ");
    return `Delivery fees: ${fees}.`;
  }
  if (/open|hour/.test(q)) {
    const open = catalog.filter((r) => r.open).map((r) => r.name).join(", ");
    return `Open now: ${open}.`;
  }
  const context = catalog.map((r) => `${r.name} (${r.cuisines.join("/")}, ⭐${r.rating})`).join("; ");
  return askGemini(question, context);
}
module.exports = { chat };
