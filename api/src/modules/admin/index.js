// Admin — oversight over orders, payments, approvals, promos, refunds.
const refunds = [];
let rSeq = 1;
function refund({ order_id, amount_kobo, reason }) {
  const r = { id: "ref" + (rSeq++), order_id, amount_kobo: Number(amount_kobo), reason, status: "approved", at: new Date().toISOString() };
  refunds.push(r);
  return { refund: r };
}
module.exports = { refund, refunds };
