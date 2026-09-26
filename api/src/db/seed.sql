-- Phase 10 Lagos pilot seed (idempotent-ish for demo).
INSERT INTO restaurants (name, cuisines, rating_avg, status, delivery_fee_kobo, min_order_kobo, cod_enabled, commission_pct)
VALUES
 ('Mama Put Kitchen', ARRAY['Nigerian','Rice'], 4.2, 'approved', 80000, 100000, true, 12.5),
 ('Chicken Republic Lite', ARRAY['Fast Food','Chicken'], 4.5, 'approved', 50000, 50000, true, 12.5),
 ('Shawarma Hub', ARRAY['Shawarma','Fast Food'], 4.0, 'pending', 100000, 150000, false, 15.0)
ON CONFLICT DO NOTHING;
