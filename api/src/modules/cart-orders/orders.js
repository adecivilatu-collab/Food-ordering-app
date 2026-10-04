// Orders — Postgres-backed with in-memory fallback. Async API.
const cart = require("./cart");
const { db } = require("../../db/pool");
const mem = new Map();
const seenKeys = new Map();
let seq = 1000;
function price(cartT, restaurant) {
  const subtotal = cartT.subtotal_kobo || 0;
  const fee = (restaurant && restaurant.fee_kobo) || 80000;
  const service = Math.round(subtotal * 0.05);
  return { subtotal_kobo: subtotal, fee_kobo: fee, service_kobo: service, discount_kobo: 0 };
}
async function persist(order) {
  mem.set(order.id, order);
  const pool = db();
  if (pool) {
    try {
      await pool.query(
        "INSERT INTO app_orders(id, order_no, order_status, data) VALUES($1, $2, $3, $4) ON CONFLICT(id) DO UPDATE SET order_status = $3, data = $4",
        [order.id, order.order_no, order.order_status, JSON.stringify(order)]
      );
    } catch {}
  }
}
async function checkout({ session, address, contact, payment_method, idempotencyKey, restaurant }) {
  if (idempotencyKey && seenKeys.has(idempotencyKey)) {
    return { order: seenKeys.get(idempotencyKey), duplicate: true };
  }
  const c = await cart.get(session);
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
  await persist(order);
  if (idempotencyKey) seenKeys.set(idempotencyKey, order);
  await cart.clear(session);
  return { order };
}
async function get(id) {
  if (mem.has(id)) return mem.get(id);
  const pool = db();
  if (pool) {
    try {
      const { rows } = await pool.query("SELECT data FROM app_orders WHERE id = $1", [id]);
      if (rows[0]) { mem.set(id, rows[0].data); return rows[0].data; }
    } catch {}
  }
  return null;
}
async function list() {
  const pool = db();
  if (pool) {
    try {
      const { rows } = await pool.query("SELECT data FROM app_orders ORDER BY created_at DESC LIMIT 100");
      rows.forEach((r) => mem.set(r.data.id, r.data));
      return rows.map((r) => r.data);
    } catch {}
  }
  return [...mem.values()];
}
async function touch(order) { await persist(order); return order; }
module.exports = { checkout, get, list, touch };
