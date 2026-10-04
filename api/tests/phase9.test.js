// Phase 9 tests — pricing, state machine, cart rules (async pg-backed). Run: npm test --workspace api
const test = require("node:test");
const assert = require("node:assert");
const { price } = require("../src/modules/payments/paystack");
const { advance } = require("../src/modules/delivery/status");
const cart = require("../src/modules/cart-orders/cart");

test("pricing: subtotal + fee + 5% service", () => {
  const p = price(350000, 80000, 0);
  assert.equal(p.service_kobo, 17500);
  assert.equal(p.total_kobo, 447500);
});
test("pricing: discount applied", () => {
  const p = price(400000, 80000, 50000);
  assert.equal(p.total_kobo, 450000);
});
test("state machine: skips rejected", () => {
  const o = { order_status: "received", timeline: [] };
  const r = advance(o, "preparing", "admin");
  assert.ok(r.error);
  assert.equal(o.order_status, "received");
});
test("state machine: RBAC enforced", () => {
  const o = { order_status: "received", timeline: [] };
  const r = advance(o, "accepted", "rider");
  assert.equal(r.code, 403);
});
test("cart: single-restaurant enforced", async () => {
  await cart.clear("t1");
  const a = await cart.addLine("t1", { item_id: "f1", qty: 1 });
  assert.ok(!a.error);
  const b = await cart.addLine("t1", { item_id: "f3", qty: 1 });
  assert.ok(b.error);
  await cart.clear("t1");
});
test("cart: option delta priced", async () => {
  await cart.clear("t2");
  const r = await cart.addLine("t2", { item_id: "f1", qty: 2, options: { protein: "Fish" } });
  assert.equal(r.cart.lines[0].unit_kobo, 400000);
  await cart.clear("t2");
});
