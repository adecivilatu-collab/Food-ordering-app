// Payments — Paystack ONLY (test mode). Interface ready for live keys.
// Pricing: subtotal + zone fee + 5% service − promo = total (kobo).
const crypto = require("crypto");
const payments = new Map();
function price(subtotal_kobo, fee_kobo, discount_kobo = 0) {
  const service_kobo = Math.round(subtotal_kobo * 0.05);
  return { subtotal_kobo, fee_kobo, service_kobo, discount_kobo, total_kobo: subtotal_kobo + fee_kobo + service_kobo - discount_kobo };
}
function initialize(order) {
  const reference = "PSK-TEST-" + Date.now();
  const p = { reference, order_id: order.id, amount_kobo: order.total_kobo, status: "initialized", authorization_url: "https://checkout.paystack.com/test/" + reference };
  payments.set(reference, p);
  return p;
}
function verifyWebhook(rawBody, signature) {
  const secret = process.env.PAYSTACK_SECRET_KEY || "sk_test_xxxx";
  const hash = crypto.createHmac("sha512", secret).update(rawBody).digest("hex");
  return hash === signature;
}
module.exports = { price, initialize, verifyWebhook, payments };
