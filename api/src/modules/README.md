# API modules (modular monolith) — build order Phase 5
- auth (phone OTP console-dev + email, JWT, guest session, RBAC)
- catalog (restaurants, zones PostGIS, search/filter)
- cart-orders (single-restaurant cart, pricing snapshot, state machine)
- payments (Paystack/Flutterwave test + COD, webhooks, reconcile)
- delivery (assign, GPS, ETA, SLA timers)
- notify (in-app/email/FCM free; SMS deferred)
Each module: routes → service → tests. Guest paths first.
