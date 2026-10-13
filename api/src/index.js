// Modular monolith (free). Phase 5.1: auth + catalog wired. Target: NestJS/Django later.
const http = require("http");
const { URL } = require("url");
const auth = require("./modules/auth");
const catalog = require("./modules/catalog");
const cart = require("./modules/cart-orders/cart");
const orders = require("./modules/cart-orders/orders");
const status = require("./modules/delivery/status");
const rider = require("./modules/delivery/rider");
const gps = require("./modules/delivery/gps");
const admin = require("./modules/admin");
const engage = require("./modules/engagement");
const paystack = require("./modules/payments/paystack");
const notify = require("./modules/notify");
const loyalty = require("./modules/loyalty");
const supportChat = require("./modules/support-chat");
let baAuth = null;
let baHandler = null;
async function baSession(req) {
  try {
    if (!baAuth) baAuth = (await import("./auth.mjs")).auth;
    const headers = new Headers();
    if (req.headers.cookie) headers.set("cookie", req.headers.cookie);
    if (req.headers.authorization) headers.set("authorization", req.headers.authorization);
    return await baAuth.api.getSession({ headers });
  } catch { return null; }
}
const ROLE_PERMS = {
  superadmin: ["*"],
  support: ["orders", "refunds", "tickets", "reviews", "riders", "restaurants-view"],
  finance: ["payments", "promos", "metrics", "refunds"],
};
async function requirePerm(req, res, perm) {
  const s = await baSession(req);
  const role = s && s.user && s.user.role;
  if (!role) { json(res, 401, { error: "login required" }); return null; }
  if (role !== "superadmin" && !(ROLE_PERMS[role] || []).includes(perm)) {
    json(res, 403, { error: "forbidden for role " + role }); return null;
  }
  return s;
}
async function requireLogin(req, res) {
  const s = await baSession(req);
  if (!s || !s.user) { json(res, 401, { error: "login required" }); return null; }
  return s;
}
async function betterAuthHandler(req, res) {
  if (!baHandler) {
    const { toNodeHandler } = await import("better-auth/node");
    const { auth } = await import("./auth.mjs");
    baHandler = toNodeHandler(auth);
  }
  return baHandler(req, res);
}
const restaurant = require("./modules/catalog/restaurant");
const menuData = require("./db/menu.json");
const port = process.env.PORT || 4000;

function json(res, code, obj) {
  res.writeHead(code, { "Content-Type": "application/json" });
  res.end(JSON.stringify(obj));
}
function body(req) {
  return new Promise((resolve) => {
    let d = "";
    req.on("data", (c) => (d += c));
    req.on("end", () => { try { resolve(JSON.parse(d || "{}")); } catch { resolve({}); } });
  });
}

http.createServer(async (req, res) => {
  const origin = req.headers.origin;
  if (origin) {
    res.setHeader("Access-Control-Allow-Origin", origin);
    res.setHeader("Access-Control-Allow-Credentials", "true");
  } else {
    res.setHeader("Access-Control-Allow-Origin", "*");
  }
  res.setHeader("Access-Control-Allow-Methods", "GET,POST,PATCH,PUT,OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type,Authorization,X-Role,Idempotency-Key,X-Paystack-Signature");
  if (req.method === "OPTIONS") { res.writeHead(204); return res.end(); }
  const t0 = Date.now();
  const u = new URL(req.url, "http://x");
  res.on("finish", () => console.log(JSON.stringify({ m: req.method, p: u.pathname, s: res.statusCode, ms: Date.now() - t0 })));
  const hits = ((globalThis.__rl = globalThis.__rl || new Map()));
  if (u.pathname.startsWith("/auth/otp")) {
    const k = "otp";
    const arr = (hits.get(k) || []).filter((t) => Date.now() - t < 60000);
    if (arr.length >= 10) return json(res, 429, { error: "too many OTP requests" });
    arr.push(Date.now()); hits.set(k, arr);
  }
  if (u.pathname === "/health") { res.writeHead(200); return res.end("ok"); }
  if (u.pathname === "/categories") return json(res, 200, { categories: catalog.categories });
  if (u.pathname === "/restaurants") {
    return json(res, 200, { restaurants: catalog.list(Object.fromEntries(u.searchParams)) });
  }
  if (u.pathname.startsWith("/r/") && u.pathname.endsWith("/menu")) {
    const id = u.pathname.split("/")[2];
    return json(res, 200, { menu: menuData.menu.filter((m) => m.restaurant_id === id) });
  }
  if (u.pathname.startsWith("/r/") && u.pathname.endsWith("/reviews")) {
    return json(res, 200, { reviews: engage.forRestaurant(u.pathname.split("/")[2]) });
  }
  if (u.pathname.startsWith("/r/")) {
    const r = catalog.detail(u.pathname.slice(3));
    return r ? json(res, 200, r) : json(res, 404, { error: "not found" });
  }
  if (u.pathname.startsWith("/api/auth/")) {
    if (!process.env.BETTER_AUTH_URL) process.env.BETTER_AUTH_URL = `http://localhost:${port}`;
    return betterAuthHandler(req, res);
  }
  if (u.pathname === "/auth/otp/request" && req.method === "POST") {
    const b = await body(req);
    return json(res, 200, auth.requestOtp(b.phone || "+2340000000000"));
  }
  if (u.pathname === "/auth/otp/verify" && req.method === "POST") {
    const b = await body(req);
    const r = auth.verifyOtp(b.phone, b.code);
    return r ? json(res, 200, r) : json(res, 401, { error: "bad otp" });
  }
  if (u.pathname === "/cart" && req.method === "GET") {
    return json(res, 200, await cart.get(u.searchParams.get("session") || "dev"));
  }
  if (u.pathname === "/cart" && req.method === "POST") {
    const b = await body(req);
    const r = await cart.addLine(b.session || "dev", b);
    return r.error ? json(res, 400, r) : json(res, 200, r);
  }
  if (u.pathname === "/cart/clear" && req.method === "POST") {
    const b = await body(req);
    return json(res, 200, await cart.clear(b.session || "dev"));
  }
  if (u.pathname === "/cart/switch" && req.method === "POST") {
    const b = await body(req);
    return json(res, 200, await cart.switchCart(b.session || "dev"));
  }
  if (u.pathname === "/carts/saved" && req.method === "GET") {
    return json(res, 200, { saved: await cart.savedCarts(u.searchParams.get("session") || "dev") });
  }
  if (u.pathname === "/cart/restore" && req.method === "POST") {
    const b = await body(req);
    const r = await cart.restoreCart(b.session || "dev", b.restaurant_id);
    return r.error ? json(res, 404, r) : json(res, 200, r);
  }
  if (u.pathname === "/checkout" && req.method === "POST") {
    const b = await body(req);
    const rest = catalog.detail(((await cart.get(b.session || "dev")).restaurant_id) || "");
    const r = await orders.checkout({ ...b, session: b.session || "dev", restaurant: rest, idempotencyKey: req.headers["idempotency-key"] });
    if (!r.error && !r.duplicate) { r.order.eta_min = 30; notify.send("confirmation", r.order); }
    return r.error ? json(res, 400, r) : json(res, r.duplicate ? 200 : 201, r);
  }
  if (u.pathname.startsWith("/order/") && u.pathname.endsWith("/cancel") && req.method === "POST") {
    const id = u.pathname.split("/")[2];
    const o = await orders.get(id);
    if (!o) return json(res, 404, { error: "not found" });
    const b = await body(req);
    if (!o.contact || !o.contact.phone || b.phone !== o.contact.phone) {
      return json(res, 401, { error: "phone required" });
    }
    if (!["received", "accepted"].includes(o.order_status)) {
      return json(res, 400, { error: "too late to cancel - contact support" });
    }
    o.order_status = "cancelled";
    o.timeline.push({ status: "cancelled", by: "customer", at: new Date().toISOString() });
    await orders.touch(o);
    notify.send("refund", o);
    return json(res, 200, { order: o });
  }
  if (u.pathname.startsWith("/order/")) {
    const o = await orders.get(u.pathname.slice(7));
    if (!o) return json(res, 404, { error: "not found" });
    if (!req.headers.authorization && o.contact && o.contact.phone && u.searchParams.get("phone") !== o.contact.phone) {
      return json(res, 401, { error: "phone required" });
    }
    return json(res, 200, o);
  }
  if (u.pathname.startsWith("/orders/") && u.pathname.endsWith("/status") && req.method === "PATCH") {
    const login = await requireLogin(req, res);
    if (!login) return;
    const id = u.pathname.split("/")[2];
    const o = await orders.get(id);
    if (!o) return json(res, 404, { error: "not found" });
    const b = await body(req);
    const r = status.advance(o, b.to, req.headers["x-role"] || "admin");
    if (!r.error) {
      if (b.to === "delivered" && o.rider_id) rider.credit(o.rider_id, Math.round((o.fee_kobo || 0) * 0.7), o.id);
      if (b.to === "delivered" && o.contact && o.contact.phone) {
        const pts = loyalty.earn(o.contact.phone, o.total_kobo);
        o.loyalty_earned = pts;
      }
      notify.send(b.to, o);
      await orders.touch(o);
    }
    return r.error ? json(res, r.code || 400, r) : json(res, 200, r);
  }
  if (u.pathname.startsWith("/orders/") && u.pathname.endsWith("/assign") && req.method === "POST") {
    const login = await requireLogin(req, res);
    if (!login) return;
    const id = u.pathname.split("/")[2];
    const o = await orders.get(id);
    if (!o) return json(res, 404, { error: "not found" });
    const b = await body(req);
    const assigned = status.assign(o, b.rider_id || "rider1");
    await orders.touch(assigned.order);
    return json(res, 200, assigned);
  }
  if (u.pathname === "/restaurant/menu" && req.method === "POST") {
    const login = await requireLogin(req, res);
    if (!login) return;
    const b = await body(req);
    const r = restaurant.addItem(b);
    return r.error ? json(res, 400, r) : json(res, 201, r);
  }
  if (u.pathname.startsWith("/restaurant/menu/") && req.method === "PATCH") {
    const login = await requireLogin(req, res);
    if (!login) return;
    const id = u.pathname.split("/")[3];
    const b = await body(req);
    const r = b.price_kobo !== undefined ? restaurant.setPrice(id, b.price_kobo) : b.photo !== undefined ? restaurant.setPhoto(id, b.photo) : restaurant.setAvailability(id, b.available);
    return r.error ? json(res, 404, r) : json(res, 200, r);
  }
  if (u.pathname === "/restaurant/hours" && req.method === "PUT") {
    const login = await requireLogin(req, res);
    if (!login) return;
    const b = await body(req);
    return json(res, 200, restaurant.setHours(b.restaurant_id, b.open_hours));
  }
  if (u.pathname === "/restaurant/promos" && req.method === "POST") {
    const login = await requireLogin(req, res);
    if (!login) return;
    const b = await body(req);
    return json(res, 201, restaurant.createPromo(b));
  }
  if (u.pathname === "/rider/register" && req.method === "POST") {
    const b = await body(req);
    const s = await baSession(req);
    if (s && s.user) b.user_id = s.user.id;
    return json(res, 201, rider.register(b));
  }
  if (u.pathname.startsWith("/rider/") && u.pathname.endsWith("/approve") && req.method === "POST") {
    if (!await requirePerm(req, res, "riders")) return;
    const r = rider.approve(u.pathname.split("/")[2]);
    return r.error ? json(res, 404, r) : json(res, 200, r);
  }
  if (u.pathname === "/rider/requests") {
    const login = await requireLogin(req, res);
    if (!login) return;
    const avail = (await orders.list()).filter((o) => o.order_status === "ready" && !o.rider_id);
    return json(res, 200, { requests: avail });
  }
  if (u.pathname === "/rider/active" && req.method === "GET") {
    const login = await requireLogin(req, res);
    if (!login) return;
    const rid = u.searchParams.get("rider_id") || "";
    const mine = (await orders.list()).filter((o) => o.rider_id === rid && !["delivered", "cancelled"].includes(o.order_status));
    return json(res, 200, { orders: mine });
  }
  if (u.pathname.startsWith("/rider/") && u.pathname.endsWith("/earnings")) {
    const r = rider.get(u.pathname.split("/")[2]);
    return r ? json(res, 200, { earnings_kobo: r.earnings_kobo, history: r.history }) : json(res, 404, { error: "not found" });
  }
  if (u.pathname.startsWith("/track/")) {
    const o = await orders.get(u.pathname.slice(7));
    if (!o) return json(res, 404, { error: "not found" });
    return json(res, 200, { order_no: o.order_no, status: o.order_status, eta_min: o.eta_min || 30, rider_id: o.rider_id || null, rider_gps: o.rider_id ? gps.latest(o.rider_id) : null, timeline: o.timeline, scheduled_for: o.scheduled_for || null, payment_method: o.payment_method, payment_status: o.payment_status, total_kobo: o.total_kobo });
  }
  if (u.pathname === "/admin/riders") {
    if (!await requirePerm(req, res, "riders")) return;
    return json(res, 200, { riders: rider.list() });
  }
  if (u.pathname === "/admin/orders") {
    if (!await requirePerm(req, res, "orders")) return;
    return json(res, 200, { orders: await orders.list() });
  }
  if (u.pathname === "/admin/payments") {
    if (!await requirePerm(req, res, "payments")) return;
    return json(res, 200, { payments: (await orders.list()).map((o) => ({ order_id: o.id, method: o.payment_method, status: o.payment_status, total_kobo: o.total_kobo })) });
  }
  if (u.pathname === "/admin/promos") {
    if (!await requirePerm(req, res, "promos")) return;
    return json(res, 200, { promos: restaurant.promos });
  }
  if (u.pathname === "/admin/refunds" && req.method === "POST") {
    if (!await requirePerm(req, res, "refunds")) return;
    const b = await body(req);
    return json(res, 201, admin.refund(b));
  }
  if (u.pathname === "/reviews" && req.method === "POST") {
    const b = await body(req);
    const r = engage.addReview(await orders.get(b.order_id), b);
    return r.error ? json(res, 400, r) : json(res, 201, r);
  }
  if (u.pathname === "/favorites" && req.method === "POST") {
    const b = await body(req);
    return json(res, 201, engage.addFav(b.phone, b));
  }
  if (u.pathname === "/favorites") return json(res, 200, { favorites: engage.getFav(u.searchParams.get("phone") || "") });
  if (u.pathname === "/reorder" && req.method === "POST") {
    const b = await body(req);
    const o = await orders.get(b.order_id);
    if (!o) return json(res, 404, { error: "order not found" });
    await cart.clear(b.session || "dev");
    for (const l of o.items) await cart.addLine(b.session || "dev", { item_id: l.item_id, qty: l.qty, options: l.options || {} });
    return json(res, 200, { cart: await cart.get(b.session || "dev") });
  }
  if (u.pathname === "/support" && req.method === "POST") {
    const b = await body(req);
    return json(res, 201, engage.ticket(b));
  }
  if (u.pathname === "/payments/initialize" && req.method === "POST") {
    const b = await body(req);
    const o = await orders.get(b.order_id);
    if (!o) return json(res, 404, { error: "order not found" });
    const init = await paystack.initialize(o, b.email);
    return init.error ? json(res, 502, init) : json(res, 200, init);
  }
  if (u.pathname === "/payments/webhook" && req.method === "POST") {
    let raw = "";
    await new Promise((resolve) => { req.on("data", (c) => (raw += c)); req.on("end", resolve); });
    const sig = req.headers["x-paystack-signature"];
    if (!paystack.verifyWebhook(raw, sig)) return json(res, 401, { error: "bad signature" });
    let evt = {}; try { evt = JSON.parse(raw); } catch {}
    const ref = evt.reference || (evt.data && evt.data.reference);
    const p = paystack.payments.get(ref);
    if (p) {
      p.status = "paid";
      const o = await orders.get(p.order_id);
      if (o) { o.payment_status = "paid"; o.timeline.push({ status: o.order_status, event: "payment_paid", at: new Date().toISOString() }); await orders.touch(o); }
    }
    return json(res, 200, { ack: true });
  }
  if (u.pathname.startsWith("/reviews/") && u.pathname.endsWith("/moderate") && req.method === "POST") {
    if (!await requirePerm(req, res, "reviews")) return;
    const b = await body(req);
    const r = engage.moderate(u.pathname.split("/")[2], b.action, b.response);
    return r.error ? json(res, 404, r) : json(res, 200, r);
  }
  if (u.pathname.startsWith("/support/") && u.pathname.endsWith("/resolve") && req.method === "POST") {
    if (!await requirePerm(req, res, "tickets")) return;
    const b = await body(req);
    const r = engage.resolveTicket(u.pathname.split("/")[2], b.resolution);
    return r.error ? json(res, 404, r) : json(res, 200, r);
  }
  if (u.pathname === "/admin/metrics") {
    if (!await requirePerm(req, res, "metrics")) return;
    const list = await orders.list();
    const done = list.filter((o) => o.order_status === "delivered");
    const cancelled = list.filter((o) => o.order_status === "cancelled");
    const aov = list.length ? Math.round(list.reduce((s, o) => s + o.total_kobo, 0) / list.length) : 0;
    const revs = engage.reviews.filter((r) => r.moderation === "approved");
    const csat = revs.length ? (revs.reduce((s, r) => s + (r.restaurant_rating || 0), 0) / revs.length).toFixed(2) : null;
    return json(res, 200, { orders: list.length, delivered: done.length, cancelled: cancelled.length, completion_rate: list.length ? +(done.length / list.length).toFixed(2) : null, aov_kobo: aov, csat_avg: csat, refunds: admin.refunds.length });
  }
  if (u.pathname.startsWith("/admin/restaurants/") && u.pathname.endsWith("/status") && req.method === "POST") {
    if (!await requirePerm(req, res, "restaurants")) return;
    const r = catalog.detail(u.pathname.split("/")[3]);
    if (!r) return json(res, 404, { error: "not found" });
    const b = await body(req);
    if (!["approved", "suspended", "pending"].includes(b.status)) return json(res, 400, { error: "bad status" });
    r.status = b.status;
    return json(res, 200, r);
  }
  if (u.pathname === "/rider/ping" && req.method === "POST") {
    const login = await requireLogin(req, res);
    if (!login) return;
    const b = await body(req);
    const r = gps.ping(b);
    return r.error ? json(res, 400, r) : json(res, 200, r);
  }
  if (u.pathname === "/admin/notifications") {
    if (!await requirePerm(req, res, "metrics")) return;
    return json(res, 200, { notifications: notify.log.slice(-50).reverse() });
  }
  if (u.pathname === "/loyalty" && req.method === "GET") {
    const phone = u.searchParams.get("phone") || "";
    return json(res, 200, { phone, points: loyalty.balance(phone), value_kobo: Math.floor(loyalty.balance(phone) / 100) * 50000 });
  }
  if (u.pathname === "/guest/session") return json(res, 200, { session: auth.guestSession() });
  if (u.pathname === "/support/chat" && req.method === "POST") {
    const b = await body(req);
    const order = b.order_id ? await orders.get(b.order_id) : null;
    const answer = await supportChat.chat({ question: b.question || "", order }, catalog.list());
    return json(res, 200, { answer });
  }
  if (u.pathname === "/orders" && req.method === "GET") {
    const phone = u.searchParams.get("phone") || "";
    if (!phone) return json(res, 400, { error: "phone required" });
    return json(res, 200, { orders: await orders.listByPhone(phone) });
  }
  if (u.pathname.startsWith("/orders/") && u.pathname.endsWith("/prep") && req.method === "POST") {
    const id = u.pathname.split("/")[2];
    const o = await orders.get(id);
    if (!o) return json(res, 404, { error: "not found" });
    const b = await body(req);
    o.eta_min = (o.eta_min || 30) + (Number(b.add_min) || 0);
    o.timeline.push({ status: o.order_status, event: "eta_updated", eta_min: o.eta_min, at: new Date().toISOString() });
    await orders.touch(o);
    notify.send("preparing", o);
    return json(res, 200, { order: o });
  }
  res.writeHead(200, { "Content-Type": "application/json" });
  res.end(JSON.stringify({ app: "foodiebator-api", phase: "5.1" }));
}).listen(port, () => console.log("api on " + port));
