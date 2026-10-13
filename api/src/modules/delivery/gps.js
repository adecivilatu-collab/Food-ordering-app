// Rider GPS — latest ping per rider (in-memory; DB table at public launch).
const pings = new Map();
function ping({ rider_id, lat, lng, order_id }) {
  if (typeof lat !== "number" || typeof lng !== "number") return { error: "lat/lng numbers required" };
  if (lat < -90 || lat > 90 || lng < -180 || lng > 180) return { error: "coords out of range" };
  const p = { rider_id, lat, lng, order_id: order_id || null, at: new Date().toISOString() };
  pings.set(rider_id, p);
  return { ping: p };
}
function latest(rider_id) { return pings.get(rider_id) || null; }
module.exports = { ping, latest };
