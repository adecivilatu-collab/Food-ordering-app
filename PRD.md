# PRD — Nigerian Multi-Restaurant Food Ordering Marketplace

## 1. Product Summary
Multi-restaurant food ordering and delivery marketplace for Nigeria (multi-city scalable).
Customers discover restaurants by delivery location, browse menus, order (guest or registered),
pay online or cash on delivery, track live, review. Restaurants manage menus/prices/hours/promos/orders.
Riders deliver. Admins oversee marketplace.
Core flow: Location → Restaurant → Food → Cart → Payment → Delivery → Review → Reorder.
Order machine: Received → Accepted → Preparing → Ready → Picked Up → On the Way → Delivered (+Cancelled/Refunded).

## 2. Implementation Plan (ordered phases + concrete outputs)
- **Phase 0 Baseline:** PRD locked, README. Output: README.md committed.
- **Phase 1 Design system:** tokens, components, a11y. Output: tokens.json/css, preview.html, COMPONENTS.md, ACCESSIBILITY.md.
- **Phase 2 Routes/IA:** sitemap + auth matrix + wireframes. Output: ROUTES.md, WIREFRAMES.md.
- **Phase 3 Architecture:** stack ADRs + scaffold + local DB stack. Output: ADR-FREE.md, docker-compose (db/redis), CI, monorepo.
- **Phase 4 Data model:** schema + OpenAPI + state machine. Output: schema.sql, DATA_MODEL.md, openapi.yaml.
- **Phase 5 Backend slices:** 5.1 auth/catalog, 5.2 menu/cart, 5.3 checkout, 5.4 status/rider, 5.5 restaurant, 5.6 rider, 5.7 admin, 5.8 engagement. Output: tested API modules.
- **Phase 6 Payments:** Paystack test adapter + webhook verify + pricing. Output: paystack.js + passing webhook test.
- **Phase 7 Tracking/notify:** timeline + ETA + ZeptoMail templates. Output: notify module, /track/:id, lifecycle test.
- **Phase 8 Trust:** moderation, SLA, metrics. Output: moderate/resolve endpoints, /admin/metrics.
- **Phase 9 Hardening:** rate-limit, logs, unit tests. Output: 6/6 green tests.
- **Phase 10 Pilot:** live Postgres seed + launch checklist. Output: seed.sql applied, LAUNCH_CHECKLIST.md.
- **Phase 11 (deferred):** loyalty, subscriptions, corporate, multi-city.

## 3. Review Tools (locked)
- **Framework:** Next.js PWA target (React). Current: API is Node modular monolith; customer UI prototype in HTML wired to API; Next.js scaffold next.
- **Database:** PostgreSQL 16 + PostGIS, LOCAL via Docker Compose (fooddb). Redis for cart/session.
- **Authentication:** Better Auth ALWAYS (phone OTP + email OTP + email/password, pg-backed sessions). Old hand-rolled JWT kept deprecated.
- **File storage:** Cloudflare R2 (S3-compatible) for restaurant/food images. Keys via .env when ready.
- **Email:** ZeptoMail (console fallback in dev).
- **Payments:** Paystack test mode + Cash on Delivery.
- **App & DB run LOCALLY for now:** API on localhost:4000, Postgres/Redis in local Docker. No cloud deploy until pilot.

## 4. Steered Choice (documented decision)
**Choice steered:** "No paid services — free-only stack until pilot" (user directive).
**What I (builder) recommended first:** Google Maps/Mapbox, Pusher, hosted DB, microservices later, Paystack+Flutterwave.
**What was decided:** OpenStreetMap/Leaflet/OSRM (free), self-hosted Socket.io/SSE, local Docker Postgres/Redis, Paystack-only test mode, SMS deferred (costs per message), local-device hosting.
**Why:** $0 upfront for MVP dev; every paid item (SMS, live payment %, domain, VPS beyond free tier) activates only at pilot revenue. No rebuild needed — interfaces (PaymentProvider, notify templates, S3-compatible storage) allow swapping providers later.
**Second steered lock:** Better Auth as the single auth system (replacing hand-rolled JWT/OTP) for pg-backed sessions across all four apps.
