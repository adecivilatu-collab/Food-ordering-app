// Auth module — free dev: console OTP (123456), HMAC JWT, guest session, RBAC.
const crypto = require("crypto");
const SECRET = process.env.JWT_SECRET || "change-me-dev-only";
const otpStore = new Map();
function requestOtp(phone) {
  const code = "123456"; // dev only; SMS deferred to pilot
  otpStore.set(phone, code);
  console.log(`[OTP console] ${phone} -> ${code}`);
  return { sent: true };
}
function b64(o) { return Buffer.from(JSON.stringify(o)).toString("base64url"); }
function sign(payload) {
  const h = b64({ alg: "HS256", typ: "JWT" }), p = b64({ ...payload, iat: Date.now() });
  const s = crypto.createHmac("sha256", SECRET).update(h + "." + p).digest("base64url");
  return h + "." + p + "." + s;
}
function verify(token) {
  try {
    const [h, p, s] = token.split(".");
    const exp = crypto.createHmac("sha256", SECRET).update(h + "." + p).digest("base64url");
    if (exp !== s) return null;
    return JSON.parse(Buffer.from(p, "base64url").toString());
  } catch { return null; }
}
function verifyOtp(phone, code) {
  if (otpStore.get(phone) !== code) return null;
  otpStore.delete(phone);
  return { token: sign({ phone, role: "customer" }), role: "customer" };
}
function guestSession() { return "g_" + crypto.randomBytes(8).toString("hex"); }
function requireRole(roles) {
  return (payload) => payload && roles.includes(payload.role);
}
module.exports = { requestOtp, verifyOtp, sign, verify, guestSession, requireRole };
