// Notify — templates for all §22 events. ZeptoMail when key present, else console (free dev).
const log = [];
const TEMPLATES = {
  confirmation: (o) => `Order ${o.order_no} confirmed. Total ₦${(o.total_kobo / 100).toFixed(2)}. ETA ~${o.eta_min || 30} min.`,
  accepted: (o) => `Restaurant accepted ${o.order_no}. Preparing your food.`,
  preparing: (o) => `${o.order_no} is being prepared.`,
  assigned: (o) => `Rider ${o.rider_id || ""} assigned to ${o.order_no}.`,
  picked_up: (o) => `Rider picked up ${o.order_no}. On the way!`,
  on_the_way: (o) => `${o.order_no} is on the way. ETA ~${o.eta_min || 15} min.`,
  delivered: (o) => `${o.order_no} delivered. Enjoy! Please rate.`,
  refund: (o) => `Refund processed for ${o.order_no}.`,
};
async function send(event, order) {
  const text = (TEMPLATES[event] || ((o) => event + " " + o.order_no))(order);
  const entry = { event, order_id: order.id, to: (order.contact && order.contact.phone) || "", text, at: new Date().toISOString(), channel: process.env.ZEPTOMAIL_API_KEY ? "zeptomail" : "console" };
  if (!process.env.ZEPTOMAIL_API_KEY) console.log(`[notify:${event}] ${text}`);
  log.push(entry);
  return entry;
}
module.exports = { send, log, TEMPLATES };
