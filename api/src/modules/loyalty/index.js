// Loyalty — 1 pt per NGN 1,000 on delivered; 100 pts = NGN 500 off at checkout. Keyed by phone.
const balances = new Map();
const PT_PER_KOBO = 1 / 100000;
const KOBO_PER_100PTS = 50000;
function balance(phone) { return balances.get(phone) || 0; }
function earn(phone, total_kobo) {
  if (!phone) return 0;
  const pts = Math.floor(total_kobo * PT_PER_KOBO);
  balances.set(phone, balance(phone) + pts);
  return pts;
}
function quote(phone, redeem_points) {
  const pts = Math.min(Number(redeem_points) || 0, balance(phone));
  const discount_kobo = Math.floor(pts / 100) * KOBO_PER_100PTS;
  return { points_used: Math.floor(pts / 100) * 100, discount_kobo };
}
function spend(phone, points_used) {
  balances.set(phone, Math.max(0, balance(phone) - points_used));
}
module.exports = { balance, earn, quote, spend };
