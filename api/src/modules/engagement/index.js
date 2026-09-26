// Engagement: reviews (post-delivery), favorites, reorder, support tickets.
const reviews = [];
const favorites = new Map();
const tickets = [];
let tSeq = 1;
function addReview(order, { restaurant_rating, food_rating, delivery_rating, text }) {
  if (!order || order.order_status !== "delivered") return { error: "reviews allowed post-delivery only" };
  const r = { id: "rev" + Date.now(), order_id: order.id, restaurant_id: order.restaurant_id, restaurant_rating, food_rating, delivery_rating, text, moderation: "pending" };
  reviews.push(r);
  return { review: r };
}
function forRestaurant(rid) { return reviews.filter((r) => r.restaurant_id === rid); }
function addFav(phone, { type, ref_id }) {
  if (!favorites.has(phone)) favorites.set(phone, []);
  favorites.get(phone).push({ type, ref_id });
  return { favorites: favorites.get(phone) };
}
function getFav(phone) { return favorites.get(phone) || []; }
function ticket({ order_id, issue_type }) {
  const t = { id: "t" + (tSeq++), order_id, issue_type, status: "open", at: new Date().toISOString() };
  tickets.push(t);
  return { ticket: t };
}
module.exports = { addReview, forRestaurant, addFav, getFav, ticket, tickets };
