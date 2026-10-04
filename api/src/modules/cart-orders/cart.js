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
async function savedCarts(session) {
  const pool = db();
  if (pool) {
    try {
      const { rows } = await pool.query("SELECT data FROM app_carts WHERE session_key LIKE $1", [session + ":saved:%"]);
      return rows.map((r) => r.data);
    } catch {}
  }
  return [...mem.entries()].filter(([k]) => k.startsWith(session + ":saved:")).map(([, v]) => v);
}
async function switchCart(session) {
  // Stash active cart, start fresh. Returns stashed summary.
  const active = await get(session);
  if (!active.lines.length) return { switched: false, reason: "active cart empty" };
  const key = `${session}:saved:${active.restaurant_id}`;
  mem.set(key, active);
  const pool = db();
  if (pool) {
    try {
      await pool.query(
        "INSERT INTO app_carts(session_key, data, updated_at) VALUES($1, $2, now()) ON CONFLICT(session_key) DO UPDATE SET data = $2, updated_at = now()",
        [key, JSON.stringify(active)]
      );
      await pool.query("DELETE FROM app_carts WHERE session_key = $1", [session]);
    } catch {}
  }
  mem.delete(session);
  return { switched: true, stashed: { restaurant_id: active.restaurant_id, items: active.lines.length, subtotal_kobo: active.subtotal_kobo } };
}
async function restoreCart(session, restaurant_id) {
  const key = `${session}:saved:${restaurant_id}`;
  let stash = mem.get(key) || null;
  const pool = db();
  if (!stash && pool) {
    try {
      const { rows } = await pool.query("SELECT data FROM app_carts WHERE session_key = $1", [key]);
      if (rows[0]) stash = rows[0].data;
    } catch {}
  }
  if (!stash) return { error: "no saved cart for this restaurant" };
  const active = await get(session);
  if (active.lines.length) await switchCart(session);
  else { mem.delete(session); if (pool) { try { await pool.query("DELETE FROM app_carts WHERE session_key = $1", [session]); } catch {} } }
  await save(session, { session, restaurant_id: stash.restaurant_id, lines: stash.lines });
  return { cart: await get(session) };
}
module.exports = { get, addLine, clear, findItem, savedCarts, switchCart, restoreCart };
