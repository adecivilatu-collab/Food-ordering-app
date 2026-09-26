// Modular monolith (free). Phase 5.1: auth + catalog wired. Target: NestJS/Django later.
const http = require("http");
const { URL } = require("url");
const auth = require("./modules/auth");
const catalog = require("./modules/catalog");
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
  if (u.pathname === "/guest/session") return json(res, 200, { session: auth.guestSession() });
  res.writeHead(200, { "Content-Type": "application/json" });
  res.end(JSON.stringify({ app: "food-marketplace-api", phase: "5.1" }));
}).listen(port, () => console.log("api on " + port));
