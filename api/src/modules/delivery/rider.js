// Rider module — register, approve, requests, earnings (MVP manual accept).
const riders = new Map();
let seq = 0;
function register({ name, phone, vehicle }) {
  const id = "rider" + (++seq);
  const r = { id, name, phone, vehicle, approval: "pending", earnings_kobo: 0, history: [] };
  riders.set(id, r);
  return { rider: r };
}
function approve(id) {
  const r = riders.get(id);
  if (!r) return { error: "not found" };
  r.approval = "approved";
  return { rider: r };
}
function credit(id, amount_kobo, order_id) {
  const r = riders.get(id);
  if (!r) return;
  r.earnings_kobo += amount_kobo;
  r.history.push({ order_id, amount_kobo, at: new Date().toISOString() });
}
function get(id) { return riders.get(id) || null; }
module.exports = { register, approve, credit, get };
