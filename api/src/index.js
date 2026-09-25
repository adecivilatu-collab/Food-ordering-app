// Modular monolith placeholder (free). Target: NestJS/Django.
// Modules: auth, geo/catalog, cart/orders, payments, delivery, notify, reviews, support, promo/loyalty, admin.
const http = require("http");
const port = process.env.PORT || 4000;
http.createServer((req, res) => {
  if (req.url === "/health") { res.writeHead(200); return res.end("ok"); }
  res.writeHead(200, {"Content-Type": "application/json"});
  res.end(JSON.stringify({ app: "food-marketplace-api", freeTier: true }));
}).listen(port, () => console.log("api on " + port));
