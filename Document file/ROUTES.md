# Phase 2 — Sitemap, Routes & Auth Matrix
Core flow: Location → Restaurant → Food → Cart → Payment → Delivery → Review → Reorder

## Customer PWA (apps/web-customer)
| Route | Access | Purpose |
|---|---|---|
| `/` | public | Location gate (GPS/manual/saved/new) — no auth wall |
| `/home` | public | Search, categories, nearby, popular, recommended, deals, recent |
| `/restaurants?cuisine=&rating=&fee=&open=` | public | Discovery + filters (PRD §6) |
| `/r/:id` | public | Restaurant profile, menu, reviews, hours, delivery info |
| `/food/:id` (sheet) | public | Options/add-ons/portion/instructions |
| `/cart` | guest | Single-restaurant cart, fee breakdown, total first |
| `/checkout` | guest | Address, name/phone, payment (Card/Transfer/USSD/Wallet/COD) |
| `/order/:id` | guest (phone+orderNo) / registered | Confirmation + live tracking timeline |
| `/orders` | registered | History + quick reorder |
| `/favorites` | registered | Saved restaurants/meals |
| `/account/addresses` | registered | Multiple delivery addresses |

## Restaurant (apps/restaurant)
`/register` (public) → pending → `/dashboard` (restaurant): incoming orders accept/reject, menu/categories/items/photos/pricing/availability, hours, promos, reviews, sales/history.

## Rider (apps/rider)
`/register` (public) → pending → `/requests` → `/delivery/:id` → `/earnings/history` (rider only).

## Admin (apps/admin)
`/admin/*` (admin only): customers, restaurant/rider approvals, orders, payments, promos, reviews/complaints/refunds, delivery monitor.

## Auth matrix
public → guest-session (signed cartId) → registered (JWT) → restaurant/rider (role+approved) → admin. Status wording exactly PRD: Received → Accepted → Preparing → Ready → Picked Up → On the Way → Delivered.
