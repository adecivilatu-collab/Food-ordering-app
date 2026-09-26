// Orders — checkout from cart with snapshot pricing. Idempotency via client key.
const cart = require("./cart");
const orders = new Map();
const seenKeys = new Map();
let seq = 1000;
function price(cartT, restaurant) {
  const subtotal = cartT.subtotal_kobo || 0;
  const fee = (restaurant && restaurant.fee_kobo) || 80000;
  const service = Math.round(subtotal * 0.05);
  return { subtotal_kobo: subtotal, fee_kobo: fee, service_kobo: service, discount_kobo: 0 };
}
function checkout({ session, address, contact, payment_method, idempotencyKey, restaurant }) {
  if (idempotencyKey && seenKeys.has(idempotencyKey)) {
    return { order: seenKeys.get(idempotencyKey), duplicate: true };
  }
  const c = cart.get(session);
  if (!c.lines.length) return { error: "empty cart" };
  const p = price(c, restaurant);
  const total = p.subtotal_kobo + p.fee_kobo + p.service_kobo - p.discount_kobo;
  const order = {
    id: "o" + (++seq),
    order_no: "LOS-2026-" + seq,
    restaurant_id: c.restaurant_id,
    items: c.lines, ...p, total_kobo: total,
    address, contact, payment_method: payment_method || "card",
    payment_status: payment_method === "cod" ? "cod_pending" : "pending",
    order_status: "received",
    timeline: [{ status: "received", at: new Date().toISOString() }],
    created_at: new Date().toISOString(),
  };
  orders.set(order.id, order);
  if (idempotencyKey) seenKeys.set(idempotencyKey, order);
  cart.clear(session);
  return { order };
}
function get(id) { return orders.get(id) || null; }
function list() { return [...orders.values()]; }
module.exports = { checkout, get, list };
