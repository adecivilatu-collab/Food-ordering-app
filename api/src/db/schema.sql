-- Phase 4 migration v1 — free Postgres+PostGIS. Money in kobo (integer).
CREATE EXTENSION IF NOT EXISTS postgis;

CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  role TEXT NOT NULL CHECK (role IN ('customer','restaurant_owner','rider','admin')),
  name TEXT, phone TEXT UNIQUE, email TEXT UNIQUE,
  password_hash TEXT, created_at TIMESTAMPTZ DEFAULT now()
);
CREATE TABLE addresses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  label TEXT, lat DOUBLE PRECISION, lng DOUBLE PRECISION,
  details TEXT, instructions TEXT
);
CREATE TABLE restaurants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id UUID REFERENCES users(id),
  name TEXT NOT NULL, image TEXT, cuisines TEXT[] DEFAULT '{}',
  rating_avg NUMERIC(3,2) DEFAULT 0, status TEXT DEFAULT 'pending',
  delivery_fee_kobo INT DEFAULT 0, min_order_kobo INT DEFAULT 0,
  open_hours JSONB DEFAULT '{}', geom GEOMETRY(Point, 4326),
  delivery_zones JSONB DEFAULT '[]', cod_enabled BOOLEAN DEFAULT true,
  commission_pct NUMERIC(5,2) DEFAULT 0
);
CREATE TABLE menu_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  restaurant_id UUID REFERENCES restaurants(id) ON DELETE CASCADE, name TEXT NOT NULL
);
CREATE TABLE menu_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  restaurant_id UUID REFERENCES restaurants(id) ON DELETE CASCADE,
  category_id UUID REFERENCES menu_categories(id) ON DELETE SET NULL,
  name TEXT NOT NULL, photo TEXT, description TEXT,
  price_kobo INT NOT NULL CHECK (price_kobo >= 0),
  available BOOLEAN DEFAULT true, popular BOOLEAN DEFAULT false
);
CREATE TABLE item_options (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  item_id UUID REFERENCES menu_items(id) ON DELETE CASCADE,
  opt_type TEXT NOT NULL, choices JSONB NOT NULL
);
CREATE TABLE carts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_key TEXT NOT NULL, restaurant_id UUID REFERENCES restaurants(id),
  lines JSONB DEFAULT '[]', updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE (session_key, restaurant_id)
);
CREATE TABLE orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_no TEXT UNIQUE NOT NULL,
  customer_id UUID REFERENCES users(id) ON DELETE SET NULL,
  guest_phone TEXT, restaurant_id UUID REFERENCES restaurants(id),
  items JSONB NOT NULL, subtotal_kobo INT NOT NULL, fee_kobo INT NOT NULL DEFAULT 0,
  service_kobo INT NOT NULL DEFAULT 0, discount_kobo INT NOT NULL DEFAULT 0,
  total_kobo INT NOT NULL, address JSONB NOT NULL,
  payment_method TEXT NOT NULL, payment_status TEXT DEFAULT 'pending',
  order_status TEXT NOT NULL DEFAULT 'received',
  timeline JSONB DEFAULT '[]', rider_id UUID, created_at TIMESTAMPTZ DEFAULT now()
);
CREATE TABLE deliveries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID REFERENCES orders(id) ON DELETE CASCADE,
  rider_id UUID, pickup JSONB, dropoff JSONB,
  status TEXT DEFAULT 'assigned', earnings_kobo INT DEFAULT 0
);
CREATE TABLE payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID REFERENCES orders(id) ON DELETE CASCADE,
  provider TEXT, reference TEXT UNIQUE, amount_kobo INT NOT NULL,
  status TEXT DEFAULT 'pending', webhook_log JSONB DEFAULT '[]'
);
CREATE TABLE promos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  scope TEXT NOT NULL, promo_type TEXT NOT NULL,
  rules JSONB DEFAULT '{}', valid_from TIMESTAMPTZ, valid_to TIMESTAMPTZ, active BOOLEAN DEFAULT true
);
CREATE TABLE reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID REFERENCES orders(id) ON DELETE CASCADE,
  restaurant_rating INT CHECK (restaurant_rating BETWEEN 1 AND 5),
  food_rating INT CHECK (food_rating BETWEEN 1 AND 5),
  delivery_rating INT CHECK (delivery_rating BETWEEN 1 AND 5),
  text TEXT, response TEXT, moderation TEXT DEFAULT 'pending'
);
CREATE TABLE support_tickets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID REFERENCES orders(id) ON DELETE CASCADE,
  issue_type TEXT NOT NULL, status TEXT DEFAULT 'open', resolution TEXT
);
CREATE TABLE refunds (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID REFERENCES orders(id) ON DELETE CASCADE,
  amount_kobo INT NOT NULL, reason TEXT, status TEXT DEFAULT 'pending'
);
CREATE TABLE riders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  vehicle TEXT, docs JSONB DEFAULT '{}',
  approval TEXT DEFAULT 'pending', earnings_balance_kobo INT DEFAULT 0
);
CREATE TABLE audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  actor_id UUID, action TEXT NOT NULL, entity TEXT, entity_id UUID,
  meta JSONB DEFAULT '{}', created_at TIMESTAMPTZ DEFAULT now()
);
CREATE INDEX idx_orders_status ON orders(order_status);
CREATE INDEX idx_orders_restaurant ON orders(restaurant_id);
CREATE INDEX idx_items_restaurant ON menu_items(restaurant_id);
