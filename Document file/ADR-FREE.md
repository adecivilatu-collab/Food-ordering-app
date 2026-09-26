# ADR — Locked stack (user-approved, no pay now unless noted)
- Auth: Better Auth ALWAYS (all apps). Phone OTP via console in dev; email via ZeptoMail. No custom JWT hand-rolls for new code.
- Database: LOCAL Postgres+PostGIS via Docker Compose (fooddb). No hosted DB until pilot.
- Storage: Cloudflare R2 (S3-compatible) for restaurant/food images. Local dev via env creds; LocalStack deferred.
- Payments: Paystack ONLY (test mode free; % only on live). No Flutterwave unless fallback needed. COD always available per restaurant.
- Email: ZeptoMail for OTP/notify templates (free tier; domain verify at pilot).
- Notify: in-app + ZeptoMail + FCM push free; SMS deferred (costs).
- Maps: OSM + Nominatim + Leaflet + OSRM (free).
- Realtime: self-hosted Socket.io/SSE.
- Hosting: LOCAL DEVICE for now (Docker Compose + Next.js dev). No Vercel/Render deploy until pilot.
Pay later only: SMS, live Paystack %, domain, R2 egress beyond free tier.
