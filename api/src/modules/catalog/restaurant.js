// Restaurant portal — menu CRUD, hours, promos (seed-backed, DB in later slice).
const menuData = require("../../db/menu.json");
const seed = require("../../db/seed.json");
const hours = {};
const promos = [];
let pSeq = 1;
function addItem({ restaurant_id, name, price_kobo }) {
  if (!restaurant_id || !name || price_kobo === undefined) return { error: "restaurant_id, name, price_kobo required" };
  const item = { id: "f" + Date.now(), restaurant_id, name, price_kobo: Number(price_kobo), available: true };
  menuData.menu.push(item);
  return { item };
}
function setAvailability(id, available) {
  const it = menuData.menu.find((m) => m.id === id);
  if (!it) return { error: "not found" };
  it.available = available !== false;
  return { item: it };
}
function setPrice(id, price_kobo) {
  const it = menuData.menu.find((m) => m.id === id);
  if (!it) return { error: "not found" };
  it.price_kobo = Number(price_kobo);
  return { item: it };
}
function setHours(restaurant_id, open_hours) {
  hours[restaurant_id] = open_hours;
  return { restaurant_id, open_hours };
}
function createPromo({ scope, promo_type, rules }) {
  const p = { id: "p" + (pSeq++), scope: scope || "restaurant", promo_type, rules: rules || {}, active: true };
  promos.push(p);
  return { promo: p };
}
module.exports = { addItem, setAvailability, setPrice, setHours, createPromo, promos, hours };
