// Cart engine — single-restaurant enforced, kobo pricing, snapshots at checkout.
const menu = require("../../db/menu.json");
const carts = new Map();
function get(session) {
  if (!carts.has(session)) carts.set(session, { session, restaurant_id: null, lines: [] });
  return carts.get(session);
}
function findItem(id) { return menu.menu.find((m) => m.id === id) || null; }
function addLine(session, { item_id, qty = 1, options = {} }) {
  const item = findItem(item_id);
  if (!item || !item.available) return { error: "unavailable" };
  const cart = get(session);
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
  return { cart: totals(cart) };
}
function totals(cart) {
  const subtotal = cart.lines.reduce((s, l) => s + l.line_kobo, 0);
  return { ...cart, subtotal_kobo: subtotal };
}
function clear(session) { carts.delete(session); return { cleared: true }; }
module.exports = { get: (s) => totals(get(s)), addLine, clear, findItem };
