# Implementation Plan v2 — Nigerian Multi-Restaurant Food Marketplace
Source: PRD v1 (36 sections), README.md, git: Food-ordering-app (main: 10da595 + 2a3ce24)
Core flow: Location → Restaurant → Food → Cart → Payment → Delivery → Review → Reorder
Updated: 2026-09-25

## Reading guide
Sequential phases. MVP = Phases 0-10. Post-MVP = Phase 11.
Each phase: Objective → Decisions → Deliverables → Exit criteria.

---

## Phase 0 — Product Baseline (LOCKED)
- Nigeria-first, multi-city scalable. ₦ (kobo integer), English, +234 phone OTP standard.
- Roles: Guest/Customer, Restaurant, Rider, Admin. Guest browse + guest checkout mandatory.
- Payments: Card, Bank Transfer, USSD, Wallet, Cash on Delivery (per-restaurant gate).
- Order machine: Received → Accepted → Preparing → Ready → Picked Up → On the Way → Delivered + Cancelled/Refunded branches.
- Trust: verified restaurants, transparent fees, genuine reviews, per-order support, clear cancel/refund by stage.
- Principles: Simple, Fast, Transparent, Reliable, Scalable.

Exit: README.md committed. No scope change without ADR.

## Phase 1 — Design System
**Objective:** One language for all 4 surfaces (customer PWA, restaurant portal, rider app, admin).

1.1 Foundations:
- Tokens as JSON: color (primary appetite red/orange, success/warning/danger/info, neutrals), type scale 12/14/16/20/24/32 (400/500/700), 4pt spacing, radius 8/12/16, elevation, light/dark ready.
- Imagery: restaurant 16:9, food 1:1, min 800px, blur-up placeholder, compression.
- Nigeria constraints: high-contrast for sunlight, 44px touch, low-data mode (no autoplay, compressed images), English-only MVP.

1.2 Library (build once):
- Atoms: Button, Input, PhoneInput(+234 validation), SearchBar, Badge(Open/Closed/Promo), RatingStars, Price(₦), QtyStepper, Toggle, OTP, FeeRow.
- Molecules: RestaurantCard (photo/rating/ETA/fee/promo), FoodCard, CartRow, AddressPicker, OrderTimeline, PromoBanner, Empty/Error/Skeleton.
- Organisms: Home sections, Menu+tabs, Cart summary (subtotal/fee/service/discount/total), Checkout, Tracking map+timeline, Review form.
- Patterns: food-customize bottom-sheet (rice/protein/portion/add-ons/instructions), sticky cart bar, guest→account upsell (non-blocking).

Deliverables: Figma lib + tokens.json + accessibility checklist.
Exit: Every MVP screen buildable with zero new styles.

## Phase 2 — UX Flows, IA & Routes
**Objective:** Freeze navigation before code.

- Customer (mobile-first): `/` (location gate) → `/home` (search/categories/nearby/popular/recommended/deals/recent) → `/restaurants?cuisine=&rating=&fee=&open=` → `/r/:id` (menu/reviews/hours) → `/food/:id` sheet → `/cart` → `/checkout` (address/contact/payment) → `/order/:id` (confirm+track) → `/orders`, `/favorites`, `/account/addresses`.
- Restaurant: `/register` → pending → `/dashboard` (incoming orders, menu/categories/items/photos/pricing/availability, hours, promos, reviews, sales/history).
- Rider: `/register` → pending → `/requests` → `/delivery/:id` (restaurant/customer/pickup/delivery instructions) → `/earnings/history`.
- Admin: `/admin` (customers, restaurant approvals, rider approvals, orders, payments, promos, reviews/complaints/refunds, delivery monitor).
- Auth matrix: public (browse), guest-session (cart/order lookup by phone+orderNo), registered, restaurant, rider, admin.

Deliverables: sitemap + route/auth table + wireframes covering PRD §4-15.
Exit: No missing screen; status wording matches PRD exactly.

## Phase 3 — Architectural Decisions (ADRs — FREE ONLY, no pay now)
**Objective:** $0 upfront for MVP dev. Pay only when you go live / scale. Modular monolith first, split later.

ADR-1 Frontend (free): React + Next.js (MIT, free) + PWA. Host dev on Vercel Free / Netlify Free / Cloudflare Pages Free. Native later; same REST API for all.
ADR-2 Backend (free): NestJS (MIT) or Django (BSD) — both free. Monorepo: `/apps/web-customer`, `/apps/restaurant`, `/apps/rider`, `/apps/admin`, `/api`, `/packages/ui-tokens`. Run locally via Docker; host later on Render Free / Fly.io free allowance / Oracle Always Free.
ADR-3 Data (free): PostgreSQL + PostGIS (both free OSS) via Docker locally. Hosted free when needed: Supabase Free / Neon Free for Postgres; Upstash Free / Redis Cloud Free for Redis; MinIO (free, S3-compatible) locally, Supabase Storage Free or Cloudinary Free later. Money in kobo.
ADR-4 Realtime (free): Self-hosted Socket.io / SSE (free, no Pusher/Ably). Poll fallback for poor network.
ADR-5 Maps/Geo (free): OpenStreetMap + Nominatim (free geocode) + Leaflet (free map UI) + OSRM (free distance/ETA). Avoid Google/Mapbox billing now; switch later if needed. Lagos traffic buffer stays in code.
ADR-6 Auth (free now): Email OTP/magic-link (free via Nodemailer/Resend Free) + JWT + guest sessionId + RBAC. Phone SMS OTP DEFERRED — SMS always costs (Termii/Twilio). Dev: log OTP to console; add SMS provider only at pilot.
ADR-7 Payments (free in test): Paystack/Flutterwave TEST mode = free (no upfront; they take % only on live). COD = free always. Webhooks + reconciliation job included. Go-live KYC later.
ADR-8 Notifications (free now): In-app + email (free) + FCM push (free). SMS DEFERRED to pilot (costs per SMS).
ADR-9 Hosting/DevOps (free): GitHub Free + GitHub Actions Free (CI lint/test/build), Docker Compose local, staging on free tiers, nightly pg_dump backups, audit logs, feature flags (COD, promos, new city) via env/config (free, no LaunchDarkly).
Alternative considered: paid maps/SMS/Pusher/microservices day-1 — rejected (unnecessary cost).

What still costs at launch (not now): SMS per message, live payment %, custom domain (~$10/yr), VPS if you outgrow free tier.

Deliverables: ADR doc + Docker Compose scaffold + CI (free) + seed categories.
Exit: Team builds vertical slice with $0 spend.

## Phase 4 — Data Model, API & Domain Rules
Tables: users, addresses, restaurants (zones[], fee_base, min_order, hours json, cod_enabled, commission_%), menu_categories, menu_items (price_kobo, available, popular), item_options (choices+delta), carts (single-restaurant enforced), orders (items snapshot, amounts snapshot, address snapshot, status, timeline json, rider_id), deliveries, payments (provider, reference, webhook_log), promos (scope/type/rules/validity), reviews (restaurant/food/delivery + response + moderation), support_tickets, refunds, riders (vehicle/docs/approval/earnings), audit_logs.
Rules:
- One restaurant per cart; multi-restaurant = multiple orders.
- Snapshot prices/fees at order time; recompute only via promo engine versioned.
- Cancel/refund matrix: before accept=full, preparing=partial per policy, after pickup=exception-only.
- OrderNo human-readable (e.g., LOS-2026-XXXX); guest lookup via phone+orderNo.
- APIs: OpenAPI spec per slice; pagination, filtering, idempotency header.

Exit: ERD + migrations + state diagram + OpenAPI draft approved.

## Phase 5 — Backend Build (vertical slices, guest-first)
5.1 Auth+geo+catalog/search/filter. 5.2 Menu+cart engine. 5.3 Checkout+confirmation. 5.4 Status transitions+rider assign+tracking. 5.5 Restaurant APIs (menu/pricing/hours/promos/orders). 5.6 Rider APIs+approvals. 5.7 Admin APIs (approvals/orders/payments/promos/reviews/refunds). 5.8 Reviews/favorites/reorder/support.
Each: spec → tests → build → demo on staging.

## Phase 6 — Pricing, Payments & Reconciliation (Nigeria-specific)
- Engine: subtotal + zone fee + service% − promo = total; min_order gate; COD surcharge optional.
- Provider flows: card, transfer (virtual account + webhook), USSD string, wallet, COD. Signature verify, retry queue, daily reconciliation, refund engine tied to cancel stage.
Exit: All 5 methods + COD on/off pass in test mode.

## Phase 7 — Delivery Orchestration, Tracking & Notifications
- MVP: broadcast/manual accept → later auto-nearest. Rider sees only needed customer/restaurant data.
- Tracking: GPS pings → customer map+ETA+timeline; SMS fallback. SLA timers (accept/prep/delivery overdue → admin alert + support nudge).
- Matrix: confirmation, accepted, preparing, assigned, picked-up, on-way, delivered, promo, refund, account.

## Phase 8 — Trust, Safety, Support & Admin Ops
- Approval queues (restaurant: business/owner/location/menu/hours/docs; rider: ID/contact/vehicle/docs).
- Reviews: post-delivery only, profanity/fake filter, dispute flow, restaurant response.
- Support: per-order types (§20), SLA, refund tool, comms log.
- Admin dashboard: orders/day, AOV, repeat, completion/cancel, avg delivery time, CSAT, revenue.

## Phase 9 — Cross-cutting: Security, Performance, Testing, Observability
- Security: OWASP basics, rate-limit OTP/pay, RBAC tests, PII minimization, webhook secrets, audit logs.
- Perf: image CDN+lazy, skeletons, PWA cache, <3s home on 3G, API p95 targets.
- Testing: unit (pricing/state machine), integration (checkout→webhook→status), E2E (guest+C0D, promo stack, rider handoff, refund), device matrix (low-end Android, poor network).
- Observability: structured logs, error tracking, order-timeline trace, payment webhook dashboard.

## Phase 10 — Pilot Hardening & Launch
- Seed Lagos zone: 10-20 restaurants, real menus/photos/hours/fees. Policies, support SOP, commission/fee config, analytics (registered vs guest, actives, repeat, times).
- Launch gate: all E2E green, refunds tested, support staffed, rollback plan.

## Phase 11 — Post-MVP (explicitly deferred)
Loyalty/referrals, recommendations, subscriptions, corporate/catering, scheduled/group orders, gift cards, grocery/pharmacy, pickup/reservations, sponsored placement, premium membership, multi-city.

---
## Build order
Tokens → Components → Routes → ADRs/scaffold → Data/API → Customer slice → Restaurant/Rider/Admin → Payments → Tracking/notify → Trust/ops → Security/perf/test → Pilot launch.

## Next actions
1. Approve FREE ADRs (Next.js free + NestJS/Django free + Postgres/PostGIS Docker + OSM/Leaflet + test-mode payments + email/in-app notify).
2. Start Phase 1 tokens + Phase 3 Docker scaffold in parallel ($0).
3. Freeze Lagos pilot zone + fee table. Add SMS/maps paid providers only at pilot.
