// Status machine + rider assignment (MVP manual accept).
const NEXT = {
  received: ["accepted", "cancelled"],
  accepted: ["preparing", "cancelled"],
  preparing: ["ready", "cancelled"],
  ready: ["picked_up", "cancelled"],
  picked_up: ["on_the_way"],
  on_the_way: ["delivered"],
  delivered: [], cancelled: [],
};
const ROLE_ALLOWED = {
  restaurant: ["accepted", "preparing", "ready"],
  rider: ["picked_up", "on_the_way", "delivered"],
  admin: ["accepted", "preparing", "ready", "picked_up", "on_the_way", "delivered", "cancelled"],
};
function advance(order, to, role) {
  if (!NEXT[order.order_status].includes(to)) return { error: `invalid: ${order.order_status} -> ${to}` };
  if (!(ROLE_ALLOWED[role] || []).includes(to)) return { error: `role ${role} cannot set ${to}`, code: 403 };
  order.order_status = to;
  order.timeline.push({ status: to, at: new Date().toISOString(), by: role });
  if (to === "delivered") order.payment_status = order.payment_method === "cod" ? "cod_paid" : order.payment_status;
  return { order };
}
function assign(order, rider_id) {
  order.rider_id = rider_id;
  order.timeline.push({ status: order.order_status, event: "rider_assigned", rider_id, at: new Date().toISOString() });
  return { order };
}
module.exports = { advance, assign, NEXT };
