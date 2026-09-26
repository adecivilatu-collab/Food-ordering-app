# Phase 4 — Data Model & Rules
Schema: api/src/db/schema.sql (Postgres+PostGIS, kobo integers).

## ER (text)
users 1—* addresses, restaurants(owner), orders(customer), riders
restaurants 1—* menu_categories, menu_items, orders
menu_categories 1—* menu_items 1—* item_options
carts (session_key+restaurant unique, single-restaurant enforced)
orders 1—1 deliveries, payments(*webhooks), reviews, support_tickets, refunds
promos (platform/restaurant scope) applied by pricing engine versioned
audit_logs for admin actions

## Domain rules
- One restaurant per cart; multi = multiple orders.
- Snapshot items/prices/fees/address at order time.
- OrderNo: e.g. LOS-2026-XXXX, guest lookup phone+orderNo.
- State machine (locked): received → accepted → preparing → ready → picked_up → on_the_way → delivered; branches cancelled/refunded. Only forward transitions + cancel per matrix.
- Cancel/refund: before accept=full, preparing=partial per policy, after pickup=exception-only.
- RBAC: public/guest/registered/restaurant-approved/rider-approved/admin.
