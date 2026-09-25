# Implementation Plan — Nigerian Multi-Restaurant Food Marketplace
Derived from: PRD v1 (36 sections) + README.md baseline
Core flow: Location → Restaurant → Food → Cart → Payment → Delivery → Review → Reorder
Date: 2026-09-24

## How to read this plan
Phases are sequential. Each phase has: objective, deliverables, key decisions, exit criteria.
MVP = Phases 1-9. Future = Phase 10.

---

## Phase 0 — Product Baseline & Constraints (Done, locked)
- Market: Nigeria first, multi-city scalable. Naira (₦), English, +234 phone validation.
- 4 roles: Guest/Customer, Restaurant, Rider, Admin.
- Guest ordering mandatory. Accounts optional, with quick reorder/favorites for registered.
- Payments: Card, Bank Transfer, USSD, Wallets, Cash on Delivery (restaurant/platform-gated).
- Order state machine (locked): Received → Accepted → Preparing → Ready → Picked Up → On the Way → Delivered (+ Cancelled/Refunded branches).
- Trust: verified restaurants, transparent fees, genuine reviews, clear cancellations, support per-order.

Exit: README.md saved. This plan is baseline.

## Phase 1 — Design System (Start here)
**Objective:** One reusable visual language for all 4 apps.

1.1 Tokens:
- Colors: primary (appetite, high contrast), success/warning/danger/info, neutrals for text/backgrounds, light/dark ready.
- Typography: 1 font family, scale 12/14/16/20/24/32, weights 400/500/700. Minimum 16px for food prices, 14px for descriptions.
- Spacing/radius: 4pt grid, radius 8/12/16 for cards/images/buttons, elevation for cards/modals.
- Imagery rules: restaurant banner 16:9, food 1:1, min resolution, placeholder + blur-up.

1.2 Components (build once, reuse):
- Atoms: Button, Input, PhoneInput (+234), SearchBar, Badge (Open/Closed/Promo), RatingStars, Price (₦ formatting), QuantityStepper, Toggle, OTP input.
- Molecules: RestaurantCard (image, rating, ETA, fee, promo), FoodCard, CartRow, AddressPicker, OrderStatusTimeline, PromoBanner, EmptyState, ErrorState.
- Organisms: Home sections, Menu list + category tabs, Cart summary (subtotal/fee/service/discount/total), Checkout form, Tracking map + timeline, Review form.
- Patterns: bottom-sheet for food customization (rice type/protein/portion/add-ons), sticky cart bar, skeleton loaders.

1.3 UX rules from PRD:
- Browse without login. Location prompt first, not auth wall.
- Final amount before confirm. Fees never hidden.
- Status language matches PRD exactly to build trust.

Deliverables: Figma library + tokens JSON, component inventory, accessibility checklist (contrast, touch 44px, screen reader).
Exit: All MVP screens can be built without new styles.

## Phase 2 — IA, Navigation & Screen Map
**Objective:** Freeze screens/routes before code.

2.1 Customer App (mobile-first web + later native):
- / (location gate) → /home (search, categories, nearby, popular, recommended, deals, recent)
- /restaurants?filter= → /r/:id (profile, menu, reviews, hours)
- /food/:id (options/add-ons) as sheet/modal
- /cart → /checkout (address, contact, payment) → /order/:id (confirmation + tracking) → /orders, /favorites, /account/addresses
2.2 Restaurant portal: /register → (pending approval) → /dashboard (orders incoming, menu, categories, promos, hours, reviews, sales/history)
2.3 Rider app (mobile-first): /register → /requests → /delivery/:id (pickup/restaurant/customer/instructions) → /earnings/history
2.4 Admin: /admin (customers, restaurants approvals, riders approvals, orders, payments, promos, reviews/complaints/refunds, delivery monitoring)

Deliverables: sitemap, route table with auth (guest/public/registered/restaurant/rider/admin), low-fi wireframes.
Exit: No missing PRD §4-15 screen.

## Phase 3 — Technical Architecture (Recommended, to avoid rework)
**Objective:** Lock stack for scalability to multi-city.

3.1 Decision (recommended):
- Frontend: React + Next.js (PWA first for Nigeria data/low-end devices), later Flutter/React Native wrapping same APIs for Rider live GPS.
- Backend: Single modular monolith first (NestJS or Django) with modules: auth, catalog, cart/order, payments, delivery, notifications, reviews, support, promos/loyalty, admin. Split to services only when order volume demands.
- DB: PostgreSQL (relational truth: orders/payments) + PostGIS for zones; Redis for carts/sessions/ETA cache/rate-limit; S3-compatible for food images.
- Realtime: WebSockets/SSE for order status + rider location (poll fallback).
- Maps: Google Maps / Mapbox for geocode + distance; design for Lagos traffic ETA fudge factor.
- Auth: phone OTP (Nigeria standard) + email, JWT, guest session via signed cartId/order lookup by phone+orderNo.
- Payments: Paystack or Flutterwave abstraction layer supporting Card/Transfer/USSD/Wallet + COD flag per restaurant. Webhooks mandatory.
- Notifications: SMS + push + in-app + email; templates for §22 events.
- Hosting: Nigerian-friendly CDN, staging + prod, backups, audit logs.

3.2 Environments: dev/staging/prod, seed data (categories from PRD §5), CI lint/test/build, feature flags for COD, promos, new cities.

Exit: Architecture Decision Record (ADR) saved, repo structure frozen.

## Phase 4 — Data Model & Domain Logic
**Objective:** Model PRD entities once.

Core tables:
- users(id, role, name, phone unique, email, password_hash nullable for guests, created_at)
- addresses(id, user_id nullable for guest, label, lat/lng, details, instructions)
- restaurants(id, name, image, cuisines[], rating_avg, status pending/approved/suspended, delivery_fee_base, min_order, open_hours json, location, delivery_zones[], cod_enabled, commission_%)
- menu_categories(id, restaurant_id, name), menu_items(id, restaurant_id, category_id, name, photo, desc, price_kobo, available, popular_flag), item_options(id, item_id, type, choices json, price_delta)
- carts(id, session_key, restaurant_id single-restaurant enforcement, lines json, subtotal, fees)
- orders(id, order_no human-readable, customer_id nullable, guest_phone, restaurant_id, items snapshot json, subtotal/fee/service/discount/total, address snapshot, payment_method/status, order_status state machine, timeline json, rider_id nullable)
- deliveries(id, order_id, rider_id, pickup/dropoff, statuses, earnings)
- payments(id, order_id, provider, reference, amount, status, webhook_log)
- promos(id, scope platform/restaurant, type %/fixed/BOGO/free_delivery/bundle, rules json, validity)
- reviews(id, order_id, restaurant/food/delivery ratings, text, response, moderation_status)
- support_tickets(id, order_id, type §20, status, resolution), refunds(id, order_id, amount, reason, status)
- riders(id, user_id, vehicle, docs, approval_status, earnings_balance), audit_logs

Key rules:
- One restaurant per cart (multi-restaurant = split orders, per PRD §9).
- Prices snapshotted at order time. Fees computed by zone + distance + promo engine.
- Cancellation/refund matrix by status (§21): before accept = full refund, preparing = partial per policy, after pickup = no refund except proof issue.
- Money in kobo (integer), formatted ₦.

Exit: ERD + migration plan + state-machine diagram approved.

## Phase 5 — Backend Build Order (MVP vertical slices)
5.1 Auth + location/zones + restaurant catalog/search/filter (§4-6)
5.2 Menu/food detail + cart engine (§7-9)
5.3 Checkout + order creation + confirmation (§10-11)
5.4 Order status transitions + rider assignment + tracking (§12-14)
5.5 Restaurant portal APIs (menu/pricing/hours/promos/orders) (§15-16)
5.6 Rider APIs (requests/accept/pickup/deliver/earnings) + approvals (§14,27)
5.7 Admin APIs (approvals, orders, payments, promos, reviews, complaints/refunds) (§25-27)
5.8 Reviews, favorites, reorder, support tickets (§17-20)

Each slice: API spec → tests → implementation. Guest paths tested first.

## Phase 6 — Payments, Pricing & Fees (Nigeria-specific)
- Provider adapter interface to swap Paystack/Flutterwave.
- Flows: card auth, transfer account generation + webhook confirm, USSD string, wallet, COD with restaurant gate.
- Idempotency keys, webhook signature verify, reconciliation job.
- Pricing engine: subtotal + zone delivery fee + service % + promo discount = total; COD surcharge optional; min_order enforcement.
- Refund engine tied to cancellation stage.

Exit: Test-mode end-to-end for all 5 methods + COD on/off test.

## Phase 7 — Delivery, Tracking & Notifications
- Assignment: manual accept (MVP) → auto-nearest (later). Rider sees restaurant + customer info + instructions only.
- Live tracking: rider GPS → customer map + ETA + status timeline. Fallback SMS status if data poor.
- Notification matrix (§22): confirmation, accepted, preparing, assigned, picked up, on-way, delivered, promo, refund, account.
- SLA timers: acceptance timeout, preparation overdue, delivery overdue → admin alert + support nudge.

## Phase 8 — Trust, Safety & Ops
- Restaurant/rider approval queues with docs checklist.
- Review moderation (profanity, fake, dispute flow, restaurant response).
- Support center per-order issue types (§20), cancellation/refund policies surfaced at checkout.
- Admin monitoring dashboard for success metrics (§34): orders/day, AOV, repeat, completion/cancel, avg delivery time, CSAT.

## Phase 9 — MVP Hardening & Launch
- Seed 1 city (e.g., Lagos zone): 10-20 test restaurants, full menus, photos, hours, fees.
- QA: guest checkout, COD on/off, promo stacking, status machine, rider handoff, refund, offline/poor network, low-end Android.
- Perf: image optimization, skeleton, PWA install, <3s home on 3G target.
- Launch checklist: policies, support SOP, commission/fee config, analytics events.
- Analytics: registered vs guest orders, active restaurants/riders, repeat rate, delivery times.

## Phase 10 — Post-MVP (do not build now)
Loyalty points/referrals, personalized recommendations, subscriptions, corporate/catering, scheduled/group orders, gift cards, grocery/pharmacy, pickup/reservations, multi-city expansion, sponsored placement, premium membership (§23,28,33).

---

## Build sequence summary
Design tokens → Components → Routes → ADR/stack → Data model → Customer order slice → Restaurant/Rider/Admin slices → Payments → Tracking/notifications → Trust/ops → Harden/launch.

## Immediate next tasks if approved
1. Approve stack (Next.js PWA + NestJS/Django + Postgres/PostGIS + Redis + Paystack/Flutterwave).
2. Start Phase 1 Figma tokens + Phase 3 repo scaffold in parallel.
3. Freeze Lagos pilot zone + fee table.
