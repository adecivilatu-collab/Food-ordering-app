# Phase 1 — Component Inventory (bright v0.2)
Source: PRD §4-15. Status: tokens locked, build in this order.

## Atoms (build first)
- [x] tokens (colors/type/spacing/radius) — tokens.json + tokens.css
- [ ] Button (primary/dark/accent/outline, 44px, black border)
- [ ] Input, PhoneInput(+234), SearchBar, OTP
- [ ] Badge (Open/Success, Closed, Promo/Accent, Hot/Danger, New/Info)
- [ ] RatingStars, Price (₦ kobo→naira), QtyStepper, Toggle, FeeRow

## Molecules
- [ ] RestaurantCard (banner 16:9, name, cuisine, rating, ETA, fee, promo badge)
- [ ] FoodCard (1:1 photo, name, desc, price 16px+, Add button)
- [ ] CartRow, AddressPicker, OrderTimeline (PRD wording exact), PromoBanner
- [ ] EmptyState, ErrorState, Skeleton loaders

## Organisms
- [ ] Home sections (search/categories/nearby/popular/recommended/deals/recent)
- [ ] Menu list + category tabs, Food customize sheet (rice/protein/portion/add-ons)
- [ ] Cart summary (subtotal/fee/service/discount/total), Checkout form
- [ ] Tracking map (Leaflet) + timeline, Review form

## Rules
- Browse without login; location first. Final amount before confirm. Black text on bright fills.
- Preview: packages/ui-tokens/preview.html
