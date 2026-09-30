// Payments — Paystack test mode. Real keys → live Paystack init; placeholders → mock.
const crypto = require("crypto");
const fs = require("fs");
const path = require("path");
const payments = new Map();
function secret() {
  if (process.env.PAYSTACK_SECRET_KEY && process.env.PAYSTACK_SECRET_KEY.length > 20) return process.env.PAYSTACK_SECRET_KEY.trim();
  try {
    const env = fs.readFileSync(path.join(__dirname, "..", "..", "..", "..", ".env"), "utf8");
    const line = env.split("\n").find((l) => l.trim().startsWith("PAYSTACK_SECRET_KEY="));
    const v = line.split("=").slice(1).join("=").trim().replace(/^["']|["']$/g, "");
    if (v.length > 20) return v;
  } catch {}
  return "";
}
function price(subtotal_kobo, fee_kobo, discount_kobo = 0) {
  const service_kobo = Math.round(subtotal_kobo * 0.05);
  return { subtotal_kobo, fee_kobo, service_kobo, discount_kobo, total_kobo: subtotal_kobo + fee_kobo + service_kobo - discount_kobo };
}
async function initialize(order, email) {
  const key = secret();
  if (key) {
    const res = await fetch("https://api.paystack.co/transaction/initialize", {
      method: "POST",
      headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
      body: JSON.stringify({ email: email && email.includes("@") ? email : "guest@foodmarket.com", amount: order.total_kobo, reference: "PSK-" + Date.now(), metadata: { order_id: order.id } }),
    });
    const data = await res.json();
    if (data.status) {
      const p = { reference: data.data.reference, order_id: order.id, amount_kobo: order.total_kobo, status: "initialized", authorization_url: data.data.authorization_url, live: true };
      payments.set(p.reference, p);
      return p;
    }
    return { error: "paystack init failed", detail: data.message };
  }
  const reference = "PSK-TEST-" + Date.now();
  const p = { reference, order_id: order.id, amount_kobo: order.total_kobo, status: "initialized", authorization_url: "https://checkout.paystack.com/test/" + reference, live: false };
  payments.set(reference, p);
  return p;
}
function verifyWebhook(rawBody, signature) {
  const key = secret() || "sk_test_xxxx";
  const hash = crypto.createHmac("sha512", key).update(rawBody).digest("hex");
  return hash === signature;
}
module.exports = { price, initialize, verifyWebhook, payments };
