# Nigerian Multi-Restaurant Food Ordering Marketplace

## 1. Overview

A multi-restaurant online food ordering and delivery marketplace for Nigeria, scalable to multiple cities.

Customers discover restaurants in their delivery area, browse menus, order meals, pay online or cash on delivery, track delivery live, and review experiences.

Restaurants manage their menus, prices, hours, promotions, and orders. Riders handle pickup and delivery. Admins oversee the marketplace.

**Core flow:**
`Location → Restaurant → Food → Cart → Payment → Delivery → Review → Reorder`

**Vision:** Convenient, trusted, easy-to-use food marketplace connecting customers, restaurants, and reliable delivery.

## 2. Goals

- Simple, fast ordering
- Multiple restaurants in one place
- More orders for restaurants
- Reliable delivery with live tracking
- Digital payments + Cash on Delivery
- Transparent pricing and order status
- Repeat purchases via favorites, reorders, loyalty
- Scalable from one city to nationwide

## 3. Users

- **Customers:** Home, office, school, hotel, apartment ordering. Guest ordering supported (no account required).
- **Restaurants:** Restaurants, fast-food, local vendors, cafés, bakeries, food trucks, cloud kitchens.
- **Riders:** Independent / platform-affiliated delivery partners.
- **Admins:** Platform owners.

## 4. Key Features

### Customer
- Location selection: current GPS, manual, saved, new addresses
- Guest browsing + guest checkout
- Home: search, categories (Nigerian, African, Fast Food, Pizza, Burgers, Chicken, Rice, Shawarma, Chinese, Bakery, Desserts, Drinks, Healthy), nearby / popular / recommended / deals / recently ordered
- Restaurant discovery: name, image, cuisine, rating, reviews, ETA, fee, open status, min order, promos; filters by cuisine, price, rating, time, promos, open now
- Restaurant page: profile, photos, menu, categories, popular dishes, ratings/reviews, hours, delivery info
- Food item: photo, description, price, options / add-ons / portions, special instructions, availability
- Cart: quantities, options, instructions, subtotal / delivery fee / service charge / discounts / total
- Checkout: delivery location, name/phone/instructions, payment (Card, Bank Transfer, USSD, Wallets, Cash on Delivery)
- Order confirmation: order no, items, total, address, payment, ETA, status
- Tracking: `Received → Accepted → Preparing → Ready → Picked Up → On the Way → Delivered` + live rider tracking + ETA + notifications
- Accounts (optional): profile, saved addresses, favorites, history, quick reorder
- Ratings/reviews: restaurant / food / delivery, restaurant responses, moderation
- Support: missing/incorrect/late/cancelled, payments, refunds, quality complaints per-order
- Cancellations/refunds by order stage, loyalty points, referrals, personalized offers

### Restaurant
- Registration + admin approval
- Profile, menu / categories / items / photos / pricing / availability
- Opening hours, promotions (%, fixed, BOGO, free delivery, bundles, new-customer, time-limited)
- Order intake: accept/reject, status updates, history, sales, reviews management

### Rider
- Registration + admin approval
- Delivery requests (accept/decline per rules), pickup/delivery details, instructions, status updates, earnings, history

### Admin
- Manage customers, restaurants, riders, orders, payments, promos, reviews, complaints, refunds, delivery activity, approvals, policies

## 5. Business Model

- Restaurant commission
- Delivery fees
- Service charges
- Promoted / sponsored placement
- Future premium subscription / loyalty membership

## 6. Trust Principles

Verified restaurants, transparent prices/fees, genuine reviews, reliable status, clear cancellation, responsive support.

Product principles: **Simple, Fast, Transparent, Reliable, Scalable.**

## 7. MVP Scope (Initial Launch)

Customer: location, discovery, search, categories, restaurant/menu/food detail, cart, checkout, guest ordering, accounts, addresses, all payments + COD, confirmation, status/tracking, history, ratings, support.

Restaurant: registration/approval, profile, menu/food/pricing, hours, promos, order management.

Rider: registration/approval, requests, pickup, status, delivery info, history, earnings.

Admin: all management, payment oversight, promos, complaints/refunds/reviews, monitoring.

Future: subscriptions, corporate/catering, scheduled/group orders, gift cards, pickup, reservations, grocery/pharmacy, multi-city.

## 8. Success Metrics

Customers, guest orders, active restaurants/riders, orders/day/month, AOV, repeat rate, completion/cancellation rate, satisfaction, avg delivery time, support resolution, revenue.

## 9. Project Status

Initial version — PRD baseline saved. No code scaffold yet.

See `Document file/` for future docs.
