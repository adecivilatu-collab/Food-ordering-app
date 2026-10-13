// Notify — provider abstraction. Channels: in-app log always; email via ZeptoMail
// when ZEPTOMAIL_API_KEY set; SMS via Termii-compatible provider when TERMII_API_KEY
// set, otherwise test-mode log. All sends recorded in log for admin visibility.
const log = [];
const TEMPLATES = {
  confirmation: (o) => `Order ${o.order_no} confirmed. Total ${money(o.total_kobo)}. ETA ~${o.eta_min || 30} min.`,
  accepted: (o) => `Restaurant accepted ${o.order_no}. Preparing your food.`,
  preparing: (o) => `${o.order_no} is being prepared.`,
  assigned: (o) => `Rider ${o.rider_id || ""} assigned to ${o.order_no}.`,
  picked_up: (o) => `Rider picked up ${o.order_no}. On the way!`,
  on_the_way: (o) => `${o.order_no} is on the way. ETA ~${o.eta_min || 15} min.`,
  delivered: (o) => `${o.order_no} delivered. Enjoy! Please rate.`,
  refund: (o) => `Refund processed for ${o.order_no}.`,
};
function money(kobo) {
  return "NGN " + ((kobo || 0) / 100).toLocaleString();
}
function zeptoKey() {
  if (process.env.ZEPTOMAIL_API_KEY) return process.env.ZEPTOMAIL_API_KEY.trim();
  try {
    const fs = require("fs"), path = require("path");
    const env = fs.readFileSync(path.join(__dirname, "..", "..", "..", ".env"), "utf8");
    const line = env.split("\n").find((l) => l.trim().startsWith("ZEPTOMAIL_API_KEY="));
    const v = line.split("=").slice(1).join("=").trim().replace(/^["']|["']$/g, "");
    return v || "";
  } catch { return ""; }
}
function smsKey() {
  if (process.env.TERMII_API_KEY) return process.env.TERMII_API_KEY.trim();
  try {
    const fs = require("fs"), path = require("path");
    const env = fs.readFileSync(path.join(__dirname, "..", "..", "..", ".env"), "utf8");
    const line = env.split("\n").find((l) => l.trim().startsWith("TERMII_API_KEY="));
    const v = line.split("=").slice(1).join("=").trim().replace(/^["']|["']$/g, "");
    return v || "";
  } catch { return ""; }
}
async function sendEmail(to, subject, html) {
  const key = zeptoKey();
  if (!key) return { channel: "email-skipped", sent: false };
  try {
    const res = await fetch("https://api.zeptomail.com/v1.1/email", {
      method: "POST",
      headers: { Authorization: `Zoho-enczapikey ${key}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        from: { address: process.env.ZEPTOMAIL_FROM || "noreply@foodiebator.ng" },
        to: [{ email_address: { address: to } }],
        subject,
        htmlbody: html,
      }),
    });
    return { channel: "zeptomail", sent: res.ok };
  } catch {
    return { channel: "zeptomail", sent: false };
  }
}
async function sendSms(to, text) {
  const key = smsKey();
  if (!key || !to) {
    console.log(`[sms:test] to=${to} :: ${text}`);
    return { channel: "sms-test", sent: true };
  }
  try {
    const res = await fetch("https://v3.api.termii.com/api/sms/send", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ to, from: "Foodiebator", sms: text, type: "plain", api_key: key, channel: "generic" }),
    });
    return { channel: "sms", sent: res.ok };
  } catch {
    return { channel: "sms", sent: false };
  }
}
async function send(event, order) {
  const text = (TEMPLATES[event] || ((o) => event + " " + o.order_no))(order);
  const toPhone = (order.contact && order.contact.phone) || "";
  const toEmail = (order.contact && order.contact.email) || "";
  const channels = [];
  if (toEmail) {
    const r = await sendEmail(toEmail, `Foodiebator: ${event}`, `<p>${text}</p>`);
    channels.push(r.channel + (r.sent ? "" : ":failed"));
  }
  if (["confirmation", "picked_up", "on_the_way", "delivered"].includes(event) && toPhone) {
    const r = await sendSms(toPhone, text);
    channels.push(r.channel);
  }
  if (!channels.length || channels.every((c) => c === "email-skipped")) {
    console.log(`[notify:${event}] ${text}`);
    channels.push("console");
  }
  const entry = { event, order_id: order.id, to: toPhone || toEmail, text, channels, at: new Date().toISOString() };
  log.push(entry);
  if (log.length > 500) log.splice(0, log.length - 500);
  return entry;
}
module.exports = { send, log, TEMPLATES };
