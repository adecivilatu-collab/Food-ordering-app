// Cart engine — Postgres-backed with in-memory fallback. Async API.
const menu = require("../../db/menu.json");
const { db } = require("../../db/pool");
const mem = new Map();
function findItem(id) { return menu.menu.find((m) => m.id === id) || null; }
function totals(cart) {
  const subtotal = cart.lines.reduce((s, l) => s + l.line_kobo, 0);
  return { ...cart, subtotal_kobo: subtotal };
}
async function get(session) {
  const pool = db();
  if (pool) {
    try {
      const { rows } = await pool.query("SELECT data FROM app_carts WHERE session_key = $1", [session]);
      if (rows[0]) return totals(rows[0].data);
    } catch {}
  }
  if (!mem.has(session)) mem.set(session, { session, restaurant_id: null, lines: [] });
  return totals(mem.get(session));
}
async function save(session, cart) {
  mem.set(session, cart);
  const pool = db();
  if (pool) {
    try {
      await pool.query(
        "INSERT INTO app_carts(session_key, data, updated_at) VALUES($1, $2, now()) ON CONFLICT(session_key) DO UPDATE SET data = $2, updated_at = now()",
        [session, JSON.stringify(totals(cart))]
      );
    } catch {}
  }
}
async function addLine(session, { item_id, qty = 1, options = {} }) {
  const item = findItem(item_id);
  if (!item || !item.available) return { error: "unavailable" };
  const cart = await get(session);
  if (cart.restaurant_id && cart.restaurant_id !== item.restaurant_id) {
    return { error: "single-restaurant: clear cart or checkout first", cart };
  }
  cart.restaurant_id = item.restaurant_id;
  let delta = 0;
  for (const opt of item.options || []) {
    const pick = options[opt.type];
    const c = (opt.choices || []).find((x) => x.name === pick);
    if (c) delta += c.delta_kobo || 0;
  }
  const unit = item.price_kobo + delta;
  cart.lines.push({ item_id, name: item.name, qty, unit_kobo: unit, line_kobo: unit * qty, options });
  const t = totals(cart);
  await save(session, t);
  return { cart: t };
}
async function clear(session) {
  mem.delete(session);
  const pool = db();
  if (pool) { try { await pool.query("DELETE FROM app_carts WHERE session_key = $1", [session]); } catch {} }
  return { cleared: true };
}
module.exports = { get, addLine, clear, findItem };
