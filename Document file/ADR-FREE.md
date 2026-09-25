# ADR — Free-only decisions (no pay now)
- Frontend: Next.js (MIT) on Vercel/Netlify/Cloudflare free tier.
- Backend: NestJS/Django (free) via Docker Compose.
- Data: Postgres+PostGIS, Redis, MinIO — all free OSS; hosted free tiers (Supabase/Neon/Upstash) only if needed.
- Realtime: self-hosted Socket.io/SSE, no Pusher.
- Maps: OSM + Nominatim + Leaflet + OSRM, no Google/Mapbox billing.
- Auth/notify: email + in-app + FCM free; SMS deferred (Termii/Twilio cost per SMS).
- Payments: Paystack/Flutterwave test mode free + COD free.
- DevOps: GitHub Free + Actions Free.
Pay later only: SMS, live payment %, domain, VPS beyond free tier.
