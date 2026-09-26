# Phase 10 — Lagos Pilot Launch Checklist
Zone: Lagos mainland pilot. Fees: per restaurant (see seed). Commission 12.5-15%.

## Pre-launch gates
- [x] Guest checkout E2E (5.3 tested) + COD on/off
- [x] Status machine + rider handoff (5.4, 7 tested full lifecycle)
- [x] Paystack test webhook verify (6 tested) — live keys + KYC before real money
- [x] 6 unit tests green (9) — run `npm test --workspace api`
- [ ] 10-20 real restaurants with photos/hours/fees (3 seeded, add rest)
- [ ] ZeptoMail domain verified + R2 bucket live (keys in .env)
- [ ] Support staffed + refund SOP + policies page
- [ ] PWA install tested on low-end Android + 3G

## Analytics to watch (§34)
registered vs guest orders, active restaurants/riders, orders/day, AOV, repeat rate,
completion/cancel rate, avg delivery time, CSAT, support resolution, revenue.

## Rollback
`git revert` + `docker compose down/up`. DB nightly pg_dump before pilot.
