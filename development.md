# Restaurant Order Management System — Development Blueprint

> Goal: A QR-based, in-restaurant ordering + payment system for small restaurants (and chains), with a customer web app + restaurant dashboard + platform admin dashboard.

---

## 1) Core Requirements (as understood)

### Customer-facing web app
- Customer scans a **QR code** at a specific restaurant location.
- The system loads the **correct location** (even if multiple restaurants share the same name, and multiple locations exist per ZIP).
- Customer can:
  - Browse menu (categories + items)
  - Add items to cart
  - Optionally enter **table number** (for waiter service)
  - Place order
  - Choose payment method:
    - **Cash** (order created as unpaid, cashier collects cash)
    - **Card (debit/credit)** via **Stripe** (order marked paid)
- Orders must be accepted **only if customer is physically at that restaurant**:
  - If not in range, website should not load / cannot place orders.

### Restaurant dashboard
- Roles: **Owner**, **Manager**, **Cashier/Server** (and optionally Waiter).
- Capabilities:
  - Owners: view totals and analytics for all their locations.
  - Managers: view totals only for the location they manage.
  - Cashiers/Servers: view incoming orders, payment status, fulfill status (no revenue totals).
  - Menu management: add/edit/delete items, categories, pricing, descriptions, photos.

### Platform admin dashboard (you)
- View total revenue across all restaurants.
- Compute your commission: **3% of gross order total** (you absorb Stripe fees).
- Insights:
  - How many restaurants onboarded
  - Top-performing restaurant(s)
  - Revenue per restaurant, per day/week/month
- Settlement logic:
  - Restaurants should see net payout (gross - your 3% - Stripe fees absorbed by you).
  - Your dashboard shows gross, your commission, Stripe fees, and net payout.

---

## 2) Recommended Tech Stack

### Backend: PHP
- **Laravel** (recommended)
  - Robust auth, policies, queues, jobs, validation, migrations, and ecosystem.
  - Sanctum for API auth (dashboard).
- Alternative: Symfony — also valid, but Laravel is typically faster for this product.

### Database: PostgreSQL (recommended)
Why Postgres:
- Great for multi-tenant-ish data, JSON fields, and analytics queries.
- Strong indexing and constraints.
- Extensions if needed (e.g., PostGIS later for geo).

### Frontend
- Customer web app: **Next.js (React)** or **Vue (Nuxt)**
  - Works great as a PWA for quick “scan → order” flow.
  - Server-side rendering optional; mostly client-driven.
- Restaurant/Admin dashboard: same codebase or separate:
  - Next.js + Tailwind OR Vue + Tailwind.
  - For speed: one monorepo with `apps/customer` and `apps/dashboard`.

### Infrastructure
- API server: Nginx + PHP-FPM.
- Queue: Redis + Laravel Horizon (for async jobs).
- Storage: S3-compatible (DigitalOcean Spaces, AWS S3) for menu item photos.
- Realtime (optional but recommended): Laravel Reverb / Pusher / Ably for instant order updates.

---

## 3) Identity and “Correct Location” Strategy

### Why QR must identify a *location*, not a restaurant name
Because:
- Many restaurants can share a name.
- Chains can reuse names across many ZIP codes.
- A single ZIP can contain many restaurants.

### Solution: QR encodes a **Location Token**
- Each physical restaurant location has a unique identifier.
- QR points to something like:
  - `https://app.yourdomain.com/r/<public_location_code>`
- Where `public_location_code` is a random, non-guessable code mapped to `restaurant_locations.id`.

**Example**
- Location: “Taco House” in ZIP 33101
- URL: `/r/3kL9pQxZrA1` (public code)
- Server resolves it to location ID and loads that location menu.

**Implementation details**
- `public_location_code`:
  - length 10–20 characters
  - random base62
  - unique index in DB

---

## 4) In-Restaurant Only Constraint (Geofencing)

You want:
- If the customer is not inside/near the restaurant, the site should not load or cannot order.

### Recommended approach (layered defense)
1. **QR session binding**
   - When customer visits `/r/{code}`, backend issues a signed “location session token” (short-lived).
2. **Geolocation validation**
   - Customer browser requests location permission (GPS/WiFi).
   - Backend validates distance from restaurant location coordinates.
3. **Network assist (optional but strong)**
   - Validate customer is on restaurant WiFi by checking:
     - a known WiFi captive portal token, or
     - QR codes printed per table that refresh daily.
   - This avoids GPS inaccuracies indoors.

### Practical v1 (recommended)
- Store each location’s latitude/longitude and allowed radius (e.g., 50–150 meters).
- Customer must share location:
  - Backend verifies `distance(user_gps, location_gps) <= radius`.
  - If not, API refuses to serve menu/order endpoints.
- Add anti-spoof mitigations:
  - Short TTL tokens
  - Rate-limits
  - Device fingerprint hash (soft)

### Flow
1. Customer hits `/r/{code}`
2. Frontend requests GPS permission
3. Frontend sends `lat/lng` to `POST /api/location/verify`
4. Backend returns signed `geo_ok_token` (TTL 5–15 mins)
5. All order-related API requests require this token

> Note: You can allow menu browsing without geo, but require geo token to place orders. If you truly want “website won’t load,” then block menu endpoints too.

---

## 5) Roles & Permissions

### Entities
- **Platform Admin** (you)
- **Restaurant Owner**
- **Manager**
- **Cashier**
- **Server/Waiter** (optional)

### Permission rules
- Owner:
  - Manage menus for owned locations
  - View revenue and analytics across owned locations
  - Manage staff assignments
- Manager:
  - Manage menu (optional)
  - View revenue and analytics for assigned location only
  - Manage orders for assigned location
- Cashier/Server:
  - View and update order statuses for assigned location
  - Cannot see revenue totals
- Platform Admin:
  - All access + cross-restaurant analytics + billing configuration

### Implementation (Laravel)
- Use policies + gates.
- Tables:
  - `users`
  - `roles`
  - `role_user` (or use a package like spatie/laravel-permission)
- Staff assigned to locations:
  - `location_user` with role per location.

---

## 6) Domain Model (Database Schema)

> Below is a strong starting schema. Names are suggestions.

### Geography
**states**
- id, name, code (e.g., FL)

**counties**
- id, state_id, name

**cities**
- id, state_id, name

**zipcodes**
- id, code, city_id, county_id (optional), state_id

> You can simplify: store `state`, `city`, `county`, `zipcode` as fields on location, but normalized tables help for analytics.

### Restaurants and locations
**restaurants**
- id
- legal_name
- display_name
- owner_user_id (or separate ownership table)
- brand_slug (optional)
- created_at, updated_at

**restaurant_locations**
- id
- restaurant_id
- location_name (e.g., “Downtown”, “Airport”, “Unit 2”)
- address_line1, address_line2
- city_id, state_id, county_id, zipcode_id
- latitude, longitude
- geofence_radius_meters (default 100)
- public_location_code (unique)
- is_active
- timezone
- created_at, updated_at

### Menus
**menus**
- id
- location_id
- name (e.g., “Main Menu”)
- is_active
- created_at, updated_at

**menu_categories**
- id
- menu_id
- name
- sort_order

**menu_items**
- id
- category_id
- name
- description
- price_cents
- photo_url
- is_available
- sort_order

**menu_item_options** (optional for modifiers)
- id
- item_id
- name (e.g., “Size”)
- selection_type (single/multi)
- required (bool)

**menu_item_option_values**
- id
- option_id
- name
- price_delta_cents

### Orders
**orders**
- id (internal)
- location_id
- order_number (small integer per location/day, human-friendly)
- status (enum: `placed`, `accepted`, `preparing`, `ready`, `completed`, `cancelled`)
- payment_status (enum: `unpaid`, `paid`, `refunded`, `failed`)
- payment_method (enum: `cash`, `card`)
- subtotal_cents
- tax_cents (optional)
- tip_cents (optional)
- total_cents
- table_number (nullable)
- customer_session_id (anonymous)
- stripe_payment_intent_id (nullable)
- placed_at
- completed_at

**order_items**
- id
- order_id
- menu_item_id
- name_snapshot
- unit_price_cents_snapshot
- quantity
- line_total_cents

**order_item_modifiers** (optional)
- id
- order_item_id
- modifier_name
- modifier_value
- price_delta_cents

### Staff assignments
**location_users**
- id
- location_id
- user_id
- role (owner/manager/cashier/server)
- created_at

### Billing (platform fees + Stripe tracking)
**platform_fees**
- id
- order_id
- platform_fee_cents (3% of total_cents)
- stripe_fee_cents (calculated)
- net_payout_cents (total - platform_fee - stripe_fee)
- created_at

**payout_batches** (optional, for settlement runs)
- id
- period_start
- period_end
- status
- created_at

**payout_batch_items**
- id
- payout_batch_id
- location_id or restaurant_id
- gross_cents
- platform_fee_cents
- stripe_fee_cents
- net_payout_cents

---

## 7) Order Number Generation (Human-Friendly)

Goal:
- Cashier calls out “Order #5”.

Strategy:
- Generate `order_number` per location per day.
- Keep it small and reset daily.

Implementation:
- Store `order_sequence_date` + `order_sequence_counter` on location or separate table.
- In DB transaction:
  - lock sequence row
  - increment
  - assign to new order

---

## 8) Stripe Payment Design (You absorb Stripe fees)

### Key choices
- Use **Stripe PaymentIntents** for card payments.
- Your platform charges restaurant **3%** per order.
- You absorb Stripe processing fees.

### What “absorb fees” means in practice
If customer pays $100.00:
- Stripe takes processing fee (varies).
- Restaurant receives: $100.00 - your 3% - Stripe fee (which you cover).
- But covering Stripe fee means **you reduce restaurant payout further?**
  - If you truly cover it, restaurant payout should be:
    - $100.00 - your 3% (restaurant does not lose Stripe fee)
  - That means **your margin must cover Stripe fee**.

So your payout math:
- Gross = total_cents
- Your platform fee = round(gross * 0.03)
- Stripe fee = actual Stripe fee (from balance transaction)
- Your net = platform_fee - stripe_fee
- Restaurant payout = gross - platform_fee  (if you cover stripe fee)

> This is important: in this model, Stripe fee reduces your profit, not restaurant payout.

### Implementation detail
After payment succeeds:
- Retrieve the Stripe charge/balance transaction to compute fees.
- Store in `platform_fees`:
  - platform_fee_cents
  - stripe_fee_cents
  - restaurant_payout_cents = total - platform_fee
  - your_net_cents = platform_fee - stripe_fee

### Stripe Connect?
If you plan to pay out restaurants automatically, consider **Stripe Connect**.
- If not, you can do manual payouts (ACH, checks) based on your internal settlement report.

---

## 9) Status Workflow

### Order status
- placed (customer submitted)
- accepted (optional — restaurant confirms)
- preparing
- ready
- completed
- cancelled

### Payment status
- unpaid (cash orders)
- paid (card orders)
- failed (card failed)
- refunded (if you implement refunds)

### Cash flow
- Cash orders: payment_status stays `unpaid` until cashier marks `paid_cash` (optional).
- Card orders: payment_status becomes `paid` automatically via Stripe webhook.

---

## 10) API Design (High-level)

### Public/customer endpoints (anonymous with geo token)
- `GET /api/locations/{public_code}` → location details + active menu
- `POST /api/location/verify` → validates GPS vs location, returns geo_ok_token
- `POST /api/cart/price` → optional server-side pricing validation
- `POST /api/orders` → create order (cash or card)
- `GET /api/orders/{id}` → order status updates (or use websockets)

### Stripe endpoints
- `POST /api/orders/{id}/payment-intent` → creates PI for card
- Webhooks:
  - `POST /api/stripe/webhook`:
    - payment_intent.succeeded → mark paid
    - payment_intent.payment_failed → mark failed
    - charge.refunded → mark refunded

### Dashboard (authenticated)
- `POST /api/auth/login`
- `GET /api/dashboard/orders?location_id=...`
- `PATCH /api/dashboard/orders/{id}` → update status ready/completed/etc.
- `CRUD /api/dashboard/menus/...`
- `GET /api/dashboard/analytics`:
  - totals, top items, hourly volume, etc.

### Platform admin (authenticated)
- `GET /api/admin/restaurants`
- `GET /api/admin/analytics`
- `GET /api/admin/revenue?range=...`

---

## 11) UI Pages (Suggested)

### Customer web app
- `/r/{public_location_code}` (entry)
- Menu page with:
  - Categories
  - Item detail modal
  - Cart drawer
- Checkout page:
  - payment method selector
  - optional table number
  - “Place Order”
- Confirmation screen:
  - shows order number
  - shows status updates

### Dashboard
- Login
- Orders screen:
  - filter by status
  - live updates
  - mark ready/completed
- Menu management:
  - categories + items CRUD
  - image upload
- Analytics (owner/manager):
  - revenue totals, order counts, avg ticket
- Admin:
  - global analytics, restaurants list, top performers, payout reports

---

## 12) Security, Validation, and Anti-Abuse

### Must-have
- Rate limit public endpoints (`/verify`, `/orders`)
- Signed tokens for:
  - location session
  - geo_ok
- Validate menu item prices on server (use snapshot fields)
- Webhook signature verification for Stripe

### Geo token rules
- short TTL (5–15 minutes)
- tie token to:
  - location_id
  - device/session hash
- require token on:
  - menu fetch (optional)
  - order creation (required)

---

## 13) Reporting & Analytics

### Restaurant analytics
- orders count per day/week/month
- gross sales
- paid vs cash share
- best-selling items
- peak ordering hours

### Platform analytics
- number of active locations
- top performing restaurants (by gross)
- platform revenue:
  - sum(platform_fee)
- stripe fees:
  - sum(stripe_fee)
- net profit estimate:
  - sum(platform_fee - stripe_fee)

---

## 14) Development Phases (Suggested)

### Phase 1 — MVP (4–8 weeks)
- Location QR mapping
- Customer menu + cart
- Cash orders
- Dashboard order feed
- Basic roles (owner + cashier)
- Basic menu CRUD
- Simple geofence validation

### Phase 2 — Payments + Webhooks
- Stripe PaymentIntents
- Paid orders + webhook updates
- Fee tracking (platform_fee, stripe_fee)
- Owner analytics

### Phase 3 — Table service + realtime
- Table number support
- Realtime order updates (websocket)
- Manager role, per-location scoping

### Phase 4 — Multi-location owners + admin analytics
- Owners manage multiple locations
- Admin global dashboard
- Top performers, payout reports

### Phase 5 — Hardening
- Better geo (wifi assist)
- Device fingerprinting
- Fraud controls
- Refunds, disputes handling

---

## 15) Open Questions (for product decisions)

1. Do you want the customer to **browse menu outside** the restaurant but block ordering, or block the entire site?
2. How strict should geofencing be (meters)? Indoors GPS can drift.
3. Will restaurants need printed **table QR codes** or just one QR at entrance?
4. Do you need tips?
5. Do you need taxes per item or per order?
6. Do you need kitchen display mode (KDS) separate from cashier?
7. Do you plan to automatically pay restaurants (Stripe Connect) or manual settlement?

---

## 16) Notes for Developers / Next Steps

### Immediate implementation tasks
- Create Laravel project + Postgres DB + migrations for:
  - restaurants, locations, menus, categories, items, orders, order_items, location_users
- Build customer frontend skeleton:
  - location resolve page
  - menu render
  - cart + checkout
- Implement `/location/verify` distance check:
  - Haversine distance formula
  - return signed geo token (JWT or Laravel signed URL token)
- Implement order creation:
  - snapshot item name/price into order_items
  - assign order_number
- Build dashboard “Orders Feed”:
  - list orders by location
  - update status buttons
- Add Stripe PaymentIntent for card flow + webhook handler.

### Performance considerations
- Indexes:
  - `restaurant_locations.public_location_code`
  - `orders.location_id, orders.placed_at`
  - `orders.status, orders.payment_status`
  - `menu_items.category_id`
- Cache menu per location (Redis) with invalidation on menu edit.

---

## Appendix A — Distance Check (Haversine)

Implement server-side geofence:
- Input: user lat/lng
- Location lat/lng + radius
- Output: ok / not ok

This must run server-side for security.

---

## Appendix B — Suggested Naming Conventions

- `public_location_code`: base62 random
- `price_cents`: integer
- `*_snapshot` fields on order_items to preserve history even if menu changes.

---

End of document.
