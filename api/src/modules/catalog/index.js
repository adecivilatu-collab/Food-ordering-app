// Catalog module — seed-backed search/filter (DB wiring in Phase 5.2).
const seed = require("../../db/seed.json");
function list({ cuisine, open, max_fee_kobo } = {}) {
  return seed.restaurants.filter((r) => {
    if (cuisine && !r.cuisines.includes(cuisine)) return false;
    if (open !== undefined && String(r.open) !== String(open)) return false;
    if (max_fee_kobo !== undefined && r.fee_kobo > Number(max_fee_kobo)) return false;
    return true;
  });
}
function detail(id) { return seed.restaurants.find((r) => r.id === id) || null; }
module.exports = { list, detail, categories: seed.categories };
