// Modular monolith (free). Phase 5.1: auth + catalog wired. Target: NestJS/Django later.
const http = require("http");
const { URL } = require("url");
const auth = require("./modules/auth");
const catalog = require("./modules/catalog");
const cart = require("./modules/cart-orders/cart");
const orders = require("./modules/cart-orders/orders");
const status = require("./modules/delivery/status");
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
  const u = new URL(req.url, "http://x");
  if (u.pathname === "/health") { res.writeHead(200); return res.end("ok"); }
  if (u.pathname === "/categories") return json(res, 200, { categories: catalog.categories });
  if (u.pathname === "/restaurants") {
    return json(res, 200, { restaurants: catalog.list(Object.fromEntries(u.searchParams)) });
  }
  if (u.pathname.startsWith("/r/") && u.pathname.endsWith("/menu")) {
    const id = u.pathname.split("/")[2];
    return json(res, 200, { menu: menuData.menu.filter((m) => m.restaurant_id === id) });
  }
  if (u.pathname.startsWith("/r/")) {
    const r = catalog.detail(u.pathname.slice(3));
    return r ? json(res, 200, r) : json(res, 404, { error: "not found" });
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
    return json(res, 200, cart.get(u.searchParams.get("session") || "dev"));
  }
  if (u.pathname === "/cart" && req.method === "POST") {
    const b = await body(req);
    const r = cart.addLine(b.session || "dev", b);
    return r.error ? json(res, 400, r) : json(res, 200, r);
  }
  if (u.pathname === "/cart/clear" && req.method === "POST") {
    const b = await body(req);
    return json(res, 200, cart.clear(b.session || "dev"));
  }
  if (u.pathname === "/checkout" && req.method === "POST") {
    const b = await body(req);
    const rest = catalog.detail((cart.get(b.session || "dev").restaurant_id) || "");
    const r = orders.checkout({ ...b, session: b.session || "dev", restaurant: rest, idempotencyKey: req.headers["idempotency-key"] });
    return r.error ? json(res, 400, r) : json(res, r.duplicate ? 200 : 201, r);
  }
  if (u.pathname.startsWith("/order/")) {
    const o = orders.get(u.pathname.slice(7));
    if (!o) return json(res, 404, { error: "not found" });
    if (!req.headers.authorization && o.contact && o.contact.phone && u.searchParams.get("phone") !== o.contact.phone) {
      return json(res, 401, { error: "phone required" });
    }
    return json(res, 200, o);
  }
  if (u.pathname.startsWith("/orders/") && u.pathname.endsWith("/status") && req.method === "PATCH") {
    const id = u.pathname.split("/")[2];
    const o = orders.get(id);
    if (!o) return json(res, 404, { error: "not found" });
    const b = await body(req);
    const r = status.advance(o, b.to, req.headers["x-role"] || "admin");
    return r.error ? json(res, r.code || 400, r) : json(res, 200, r);
  }
  if (u.pathname.startsWith("/orders/") && u.pathname.endsWith("/assign") && req.method === "POST") {
    const id = u.pathname.split("/")[2];
    const o = orders.get(id);
    if (!o) return json(res, 404, { error: "not found" });
    const b = await body(req);
    return json(res, 200, status.assign(o, b.rider_id || "rider1"));
  }
  if (u.pathname === "/guest/session") return json(res, 200, { session: auth.guestSession() });
  res.writeHead(200, { "Content-Type": "application/json" });
  res.end(JSON.stringify({ app: "food-marketplace-api", phase: "5.1" }));
}).listen(port, () => console.log("api on " + port));
