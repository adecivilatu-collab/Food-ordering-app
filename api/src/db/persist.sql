-- Cart + order persistence (Phase: kill amnesia). Idempotent.
CREATE TABLE IF NOT EXISTS app_carts (
  session_key TEXT PRIMARY KEY,
  data JSONB NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now()
);
CREATE TABLE IF NOT EXISTS app_orders (
  id TEXT PRIMARY KEY,
  order_no TEXT UNIQUE NOT NULL,
  order_status TEXT NOT NULL DEFAULT 'received',
  data JSONB NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_app_orders_status ON app_orders(order_status);
