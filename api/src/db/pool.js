// Shared pg pool. Falls back to null when DB unreachable (callers use memory).
const { Pool } = require("pg");
let pool = null;
function db() {
  if (pool) return pool;
  try {
    pool = new Pool({ connectionString: process.env.DATABASE_URL || "postgres://food:food@localhost:5432/fooddb" });
    pool.on("error", () => { pool = null; });
  } catch { pool = null; }
  return pool;
}
module.exports = { db };
