# FULL PLATFORM INTEGRATION AUDIT — PHARMABAG
## Admin + Seller + Buyer — Cross-App Flow Validation

**Date:** June 2025  
**Verdict:** 🔴 **NOT LAUNCH-READY** — Critical integration gaps, broken flows, and dead functionality across all three apps.

---

## TABLE OF CONTENTS

1. [Executive Summary](#executive-summary)
2. [Architecture Overview](#architecture-overview)
3. [Core Flow Validation](#core-flow-validation)
4. [Working Flows](#-working-flows)
5. [Broken Flows](#-broken-flows)
6. [Partial Flows](#-partial-flows)
7. [Missing Connections](#-missing-connections)
8. [Bugs](#-bugs)
9. [Required Fixes — Priority Matrix](#-required-fixes--priority-matrix)

---

## EXECUTIVE SUMMARY

| Metric | Status |
|--------|--------|
| **Total Routes Audited** | 46 (Admin: 16, Seller: 12, Buyer: 18) |
| **Working End-to-End Flows** | 0 / 8 core flows |
| **Partially Working Flows** | 5 / 8 |
| **Completely Broken Flows** | 3 / 8 |
| **Dead Buttons / UI Elements** | 37+ |
| **Unused Hooks (wasted code)** | 18+ |
| **Security Issues** | 6 (auth gaps, permission bypass, dev bypass in prod code) |
| **Critical Bugs** | 12 |
| **Data Consistency Issues** | 8 |

### The Fundamental Problem

The three apps (Admin, Seller, Buyer) were built with **three completely separate API layers** that don't share types, tokens, or response handling. This means even if the backend works perfectly, the frontend apps may:
- Send different token formats
- Expect different response shapes
- Use different status enum values for the same entity
- Fail silently when data doesn't match expected shapes

---

## ARCHITECTURE OVERVIEW

### API Layer Fragmentation (ROOT CAUSE)

| Aspect | Buyer App | Seller App | Admin App |
|--------|-----------|------------|-----------|
| **API Client** | `@pharmabag/api-client` (shared package) | Local `apiClient.ts` | Local `apiClient.ts` |
| **Token Key** | `pb_access_token` / `pb_refresh_token` | `pb_token` | `pb_token` |
| **Base URL Env Var** | `NEXT_PUBLIC_API_URL` | `NEXT_PUBLIC_API_BASE_URL` | `NEXT_PUBLIC_API_BASE_URL` |
| **Timeout** | 30 seconds | 10 seconds | 10 seconds |
| **Type Source** | Zod schemas (local) | `@pharmabag/utils` types | `@pharmabag/utils` types |
| **Response Unwrap** | `data.data ?? data.profile ?? data` | `data.data` | `data.data` |
| **State Management** | TanStack React Query | Zustand + TanStack Query | Zustand + TanStack Query |
| **Auth Pattern** | `AuthProvider` context | Zustand `useSellerAuth` | Zustand `useAdminAuth` |

**Impact:** A backend returning a token stored as `pb_token` won't be found by the buyer app which reads `pb_access_token`. Cross-app API calls will fail due to different token handling.

---

## CORE FLOW VALIDATION

### Flow 1: Product Lifecycle (Seller → Admin → Buyer)

```
Seller creates product → Admin approves → Product goes live → Buyer sees it
```

| Step | Status | Details |
|------|--------|---------|
| Seller creates product | ⚠️ Partial | `POST /products` works. Product gets `approvalStatus` field. UI defaults to "PENDING". |
| Admin sees pending products | ❌ Broken | Admin products page has **NO approval queue**. No filter for pending products. No approve/reject buttons. Only enable/disable (isActive toggle). |
| Admin approves product | ❌ Missing | No `approveProduct()` or `rejectProduct()` API function exists in admin.api.ts. The `ApprovalStatus` type (PENDING/APPROVED/REJECTED) exists in `@pharmabag/utils` but admin has no UI or API to change it. |
| Approved product visible to buyer | ⚠️ Unknown | Buyer calls `GET /products` — whether this returns only approved products depends on backend filtering. Frontend has no client-side filter for approval status. |

**Verdict: ❌ BROKEN** — The entire product approval pipeline is a dead end. Seller sets approval status but admin cannot act on it.

---

### Flow 2: Order Lifecycle (Buyer → Seller → Admin)

```
Buyer places order → Seller accepts → Seller ships → Admin tracks → Buyer receives
```

| Step | Status | Details |
|------|--------|---------|
| Buyer adds to cart | ✅ Works | API-backed cart with quantity controls. |
| Buyer reaches checkout | ❌ Broken | CartDrawer "Checkout Now" button links to `/orders` NOT `/checkout`. Checkout page exists but is unreachable from the normal cart flow. |
| Buyer places order | ⚠️ Partial | `createOrder()` API exists. COD is only functional payment method. Online payment redirects to dead end. |
| Seller sees new order | ⚠️ Partial | `GET /orders/seller` endpoint exists. Notification polling (60s) would surface new orders. Depends on backend generating the data. |
| Seller accepts order | ✅ Works | Accept button → `PATCH /orders/:id/status { status: "ACCEPTED" }` with toast feedback. |
| Seller rejects order | ✅ Works | Reject with reason → `PATCH /orders/:id/status { status: "CANCELLED", reason }`. |
| Seller uploads invoice | ✅ Works | File picker → FormData upload → `POST /orders/:id/invoice`. |
| Seller marks shipped | ❌ Missing | No "Mark as Shipped" button exists anywhere in seller app. Status can only go to ACCEPTED via seller. |
| Admin advances status | ⚠️ Works | Admin can advance: PLACED→CONFIRMED→SHIPPED→DELIVERED (linear only, no cancel). |
| Buyer sees status timeline | ✅ Works | 5-step timeline on order detail page. Cancel button for pre-shipment orders. |

**Verdict: ❌ BROKEN** — Cart→Checkout link is wrong. Seller cannot ship. Online payment is dead.

---

### Flow 3: Payment Flow (Buyer → Admin)

```
Buyer pays → Uploads proof → Admin verifies → Payment confirmed
```

| Step | Status | Details |
|------|--------|---------|
| Buyer selects payment method | ⚠️ Partial | COD works. Online redirects to non-existent gateway. Credit works only if buyer has active credit status. |
| Payment record created | ❌ Missing | `useCreatePayment` hook exists but is **never called**. If backend doesn't auto-create payment on order creation, payment pages show "No payment found." |
| Buyer uploads proof | ⚠️ Conditional | Upload proof page exists at `/payments/[orderId]`. Two-step: file upload to storage → save URL. Only works if payment record exists. |
| Admin reviews proof | ✅ Works | Admin payments page shows all payments with proof link. Can view proof in new tab. |
| Admin confirms/rejects | ✅ Works | Confirm/Reject buttons with confirmation dialogs. Only for PENDING payments. |

**Verdict: ⚠️ PARTIAL** — Payment creation is never triggered by frontend. Proof upload and admin verification work if a payment record exists.

---

### Flow 4: Credit & EMI System

```
Buyer has credit line → Uses credit at checkout → EMI milestones tracked → Payments collected
```

| Step | Status | Details |
|------|--------|---------|
| Buyer views credit status | ✅ Works | `/credit` page shows credit limit, used/available, progress bar. |
| Buyer uses credit at checkout | ⚠️ Partial | Credit option shown only if `credit.status === 'active' && availableCredit > 0`. Creates order with `paymentMethod: 'credit'`. |
| Milestone tracking | ❌ Missing | `useOrderMilestones` hook exists but is **never called** on any page. Credit page links milestones to payment pages instead of inline handling. |
| Milestone payment confirmation | ❌ Missing | `useConfirmMilestonePayment` hook exists but is **never called**. |
| Admin tracks credit | ❌ Missing | No credit management in admin dashboard. No user credit status control. Admin has `updateUserStatus()` API (status 0-3: blocked/prepaid/EMI/credit) but **no UI exposes it**. |

**Verdict: ⚠️ PARTIAL** — Buyer UI exists but milestone tracking and admin credit management are missing.

---

### Flow 5: Seller Onboarding & Verification

```
Seller registers → Fills KYC → Admin verifies → Seller approved → Can sell
```

| Step | Status | Details |
|------|--------|---------|
| Seller registers | ✅ Works | OTP auth → creates seller account. |
| Seller fills KYC | ⚠️ Partial | Onboarding page collects GST/PAN/drug license/address. But **no document upload** — only text fields. |
| Admin sees pending seller | ✅ Works | Users page filters by role=SELLER, status=PENDING. Expandable row shows business details. |
| Admin approves/rejects seller | ✅ Works | Approve/Reject/Block/Unblock buttons with toast feedback. |
| Seller gets approval notification | ⚠️ Unknown | Depends on backend generating notification. Frontend polls every 60s. |
| Approved seller can sell | ⚠️ Partial | Seller guard checks verification status. But **UNVERIFIED sellers can access ALL pages** (guard was intentionally relaxed). |

**Verdict: ⚠️ PARTIAL** — Flow mostly works but guard is too permissive and KYC has no document upload.

---

### Flow 6: Ticket/Support System

```
User creates ticket → Admin responds → Chat continues → Ticket resolved
```

| Step | Status | Details |
|------|--------|---------|
| Seller creates ticket | ✅ Works | Support page with reason dropdown + subject + message. `POST /tickets`. |
| Buyer creates ticket | ✅ Works | Support page with subject + message. `POST /tickets`. |
| Admin sees all tickets | ✅ Works | Ticket list with status filters, search by ID/subject/phone. |
| Admin responds to ticket | ✅ Works | Chat-style detail page. Reply input → `POST /admin/tickets/:id/reply`. |
| Seller views response | ✅ Works | Ticket detail page polls every 10s for new messages. |
| Buyer views response | ❌ Broken | Ticket list cards are **NOT wrapped in `<Link>`**. The detail page `/support/[ticketId]` exists and works but is **unreachable** from the list. |
| Admin closes ticket | ✅ Works | "Mark Resolved" / "Close" / "Reopen" buttons. |

**Verdict: ⚠️ PARTIAL** — Works for seller, broken for buyer (can't navigate to ticket detail).

---

### Flow 7: Notification System

```
Event occurs → Notification created → User sees it → User acts on it
```

| Step | Status | Details |
|------|--------|---------|
| Admin broadcasts notification | ✅ Works | Target ALL/BUYER/SELLER + message → `POST /admin/notifications/broadcast`. |
| Seller sees notifications | ⚠️ Partial | Notification page polls every 60s. Types: ORDER/PAYMENT/PRODUCT/TICKET/ALERT with deep links to relevant pages. Dashboard badge is **hardcoded to 2** (not real count). |
| Buyer sees notifications | ⚠️ Partial | Notification page shows list with mark-as-read. But clicking a notification **doesn't navigate** to the related resource. No polling/real-time updates. |
| Notification history | ✅ Works | Admin has paginated notification history with delivery counts. |

**Verdict: ⚠️ PARTIAL** — Admin send works. Seller receives with deep links. Buyer receives but with no actionable navigation.

---

### Flow 8: Settlement/Payout Flow

```
Orders complete → Settlement calculated → Admin pays seller → Seller sees payout
```

| Step | Status | Details |
|------|--------|---------|
| Seller views settlements | ✅ Works | Payouts page → `GET /settlements/seller` with summary. |
| Seller requests payout | ❌ Fake | "Request Payout" button shows a **fake success toast** with no API call. |
| Admin views all settlements | ✅ Works | Settlements page with status filters, commission display. |
| Admin marks settlement paid | ✅ Works | "Mark Paid" with UTR reference → `PATCH /admin/settlements/:id/mark-paid`. |
| Settlement creation | ❌ Missing | No UI to create settlements. `useCreateSettlement()` hook exists but is not wired to any button. |

**Verdict: ⚠️ PARTIAL** — Read and mark-paid work. Creation and payout requests are missing/fake.

---

## ✅ WORKING FLOWS

These flows function correctly end-to-end (within their app):

| # | Flow | Apps | Notes |
|---|------|------|-------|
| 1 | OTP Authentication | All 3 | Dev bypass works. Role-specific user objects created. |
| 2 | Seller product CRUD | Seller | Create, view, edit, delete products. Approval status badge displayed. |
| 3 | Seller accept/reject orders | Seller | Accept with one click, reject with reason modal. Toast feedback. |
| 4 | Seller invoice upload | Seller | File upload → FormData → toast. PDF/JPG/PNG supported. |
| 5 | Admin user management | Admin | Approve/reject/block/unblock users. Seller detail expansion. |
| 6 | Admin category CRUD | Admin | Categories + subcategories with parent relationship. |
| 7 | Admin payment verification | Admin | View proof → confirm/reject PENDING payments. |
| 8 | Admin ticket chat | Admin | Reply to tickets, change status, reopen. Full chat UI. |
| 9 | Admin broadcast notifications | Admin | Target audience + message → send with delivery count. |
| 10 | Admin settlements mark-paid | Admin | Mark settlements as paid with UTR reference. |
| 11 | Admin banner CRUD | Admin | Create/edit/delete banners with image upload. |
| 12 | Admin suggestion catalog | Admin | CRUD + CSV import for product suggestions. |
| 13 | Admin platform settings | Admin | Edit platform config, feature flags, notification emails. |
| 14 | Buyer product browsing | Buyer | Search, category filter, manufacturer filter, pagination. |
| 15 | Buyer cart management | Buyer | API-backed cart. Add/remove/update quantity. ₹20K minimum. |
| 16 | Buyer wishlist | Buyer | Add/remove products, add-to-cart from wishlist. |
| 17 | Buyer order tracking | Buyer | Timeline view, cancel pre-shipment orders. |
| 18 | Buyer onboarding wizard | Buyer | 3-step KYC with GST/PAN verification. |
| 19 | Buyer credit dashboard | Buyer | View credit limit, milestones, invoices. |
| 20 | Seller ticket creation | Seller | Create with predefined reasons, view ticket list. |

---

## ❌ BROKEN FLOWS

These flows are fundamentally non-functional:

### CRITICAL-1: Cart → Checkout Path Is Broken
- **What:** CartDrawer's "Checkout Now" button links to `/orders` instead of `/checkout`
- **Impact:** Buyers can NEVER reach checkout through the normal flow. The checkout page exists but is orphaned.
- **File:** `apps/buyer/src/components/cart/CartDrawer.tsx` — `<Link href="/orders">`
- **Fix:** Change `href="/orders"` to `href="/checkout"`

### CRITICAL-2: Product Approval Pipeline Does Not Exist
- **What:** Seller products get `approvalStatus: "PENDING"` but admin has NO approve/reject functionality. Admin can only enable/disable (boolean `isActive`).
- **Impact:** Seller-created products can never be formally approved. If backend requires approval, products stay in limbo. If backend auto-approves, the approval status is meaningless.
- **Files:** `apps/admin/api/admin.api.ts` (missing approve/reject endpoints), `apps/admin/app/products/page.tsx` (no approval UI)
- **Fix:** Add `approveProduct()` and `rejectProduct()` API functions + approval queue UI in admin products page.

### CRITICAL-3: Online Payment Is a Dead End
- **What:** Checkout redirects to `/payments/{orderId}?gateway=online` but the payment page doesn't read the `gateway` param and has no payment gateway integration (no CCAvenue/Worldline/Razorpay SDK).
- **Impact:** Online payment orders are created but can never be paid. Only COD actually works.
- **Fix:** Either implement payment gateway integration or remove the online payment option.

### CRITICAL-4: Buyer Support Tickets Are Unreachable
- **What:** Ticket cards on `/support` are NOT wrapped in `<Link>`. The chat-style detail page at `/support/[ticketId]` exists and works but cannot be navigated to.
- **Impact:** Buyers can create tickets but can never see admin responses.
- **File:** `apps/buyer/src/app/support/page.tsx`
- **Fix:** Wrap ticket cards in `<Link href={/support/${ticket.id}}>`.

### CRITICAL-5: Seller Cannot Ship Orders
- **What:** No "Mark as Shipped" button exists in seller app. Seller can only accept orders and upload invoices. Shipping status requires admin intervention.
- **Impact:** Sellers have no way to indicate they've shipped an order. The entire fulfillment flow stalls at "ACCEPTED."
- **Fix:** Add shipping action button in seller order detail page.

### CRITICAL-6: Payment Record Never Created
- **What:** `useCreatePayment` hook exists in buyer app but is **never called** on any page. If the backend doesn't auto-create payment records on order creation, the payment pages show "No payment found."
- **Impact:** Payment proof upload, payment history, and admin payment verification all depend on a payment record existing. If none is created, the entire payment flow is dead.
- **Fix:** Call `createPayment()` during checkout flow or verify backend auto-creates payment records.

### CRITICAL-7: Request Payout Is Fake
- **What:** Seller's "Request Payout" button shows a hardcoded success toast without making any API call.
- **Impact:** Sellers believe they've requested a payout but nothing happens.
- **File:** `apps/seller/components/seller-pages.tsx` → `PayoutsContent`
- **Fix:** Wire the button to an actual payout request API endpoint.

---

## ⚠️ PARTIAL FLOWS

These flows work in some apps but break at cross-app boundaries:

### PARTIAL-1: Order Status Synchronization
- **Seller statuses:** PLACED → ACCEPTED → AWAITING_INVOICE → WAREHOUSE → TRANSIT → DELIVERED (6 steps in timeline)
- **Admin statuses:** PLACED → CONFIRMED → SHIPPED → DELIVERED (4 steps, linear advance only)
- **Buyer statuses:** PLACED → ACCEPTED → SHIPPED → OUT_FOR_DELIVERY → DELIVERED (5 steps in timeline)
- **Problem:** Three different status progressions. Admin uses "CONFIRMED" where seller uses "ACCEPTED". Buyer has "OUT_FOR_DELIVERY" that doesn't exist in seller/admin. Seller has "AWAITING_INVOICE" and "WAREHOUSE" that don't exist elsewhere.
- **Risk:** Status displayed in one app may not match what's stored in backend. UI elements keyed to specific status strings may break.

### PARTIAL-2: Notification Deep Linking
- **Seller:** Notifications have deep links → `/orders/:id`, `/products/:id`, etc. ✅
- **Buyer:** Notifications mark as read but **don't navigate anywhere**. ❌
- **Admin:** Broadcasts only. No inbound notification viewing. N/A

### PARTIAL-3: Seller Verification Guard
- **Current:** Unverified sellers can access ALL pages including dashboard, products, orders.
- **Expected:** Unverified sellers should only see onboarding page.
- **Code comment:** "Removed restrictive redirect" — intentionally relaxed but probably shouldn't be.

### PARTIAL-4: Profile Creation Has Two Paths
- **Buyer onboarding** (`/onboarding`): 3-step wizard with GST/PAN verification, drug license document upload, address.
- **Buyer profile** (`/profile`): Simpler form without verification buttons or document upload.
- **Risk:** Users may create incomplete profiles via the simpler path, bypassing KYC requirements.

---

## 🔗 MISSING CONNECTIONS

Cross-app integrations that simply don't exist yet:

| # | Missing Connection | Impact |
|---|-------------------|--------|
| 1 | **Admin → Product Approval** | Admin cannot approve seller products. No approval endpoint or UI exists. |
| 2 | **Admin → Credit Management** | Admin has `updateUserStatus(0-3)` API but NO UI to control buyer credit levels (blocked/prepaid/EMI/credit). |
| 3 | **Admin → Settlement Creation** | Hook `useCreateSettlement()` exists but no UI. Settlements presumably auto-generated by backend. |
| 4 | **Admin → Order Detail** | `useOrderById()` hook exists but no `/orders/[id]` page in admin app. Admin can only see orders in list view. |
| 5 | **Admin → Product Detail/Edit** | Hooks `useProductById()`, `useUpdateProduct()`, `useCreateProduct()` exist but admin products page has no view/edit/create actions. |
| 6 | **Seller → Shipping Status** | No way for seller to advance order past ACCEPTED. |
| 7 | **Buyer → Payment Creation** | `useCreatePayment` hook unused. Payment records assumed to be backend-created. |
| 8 | **Buyer → Milestone Payment** | `useConfirmMilestonePayment` hook unused. Credit milestones link to payment pages instead. |
| 9 | **Buyer → Order Invoice** | `useOrderInvoice` hook unused. No invoice download on order detail page. |
| 10 | **Buyer → Discount Details** | `useDiscountDetails` hook unused. No discount detail view anywhere. |
| 11 | **Admin → Permission Enforcement** | Permission codes (1-9, a-c, x) are assigned to admins but **never checked** against page access. Any authenticated admin sees everything. |
| 12 | **Cross-App Token Compatibility** | Buyer uses `pb_access_token`, seller/admin use `pb_token`. A single backend auth system would need to support both key patterns. |

---

## 🐞 BUGS

### Security Bugs

| # | Bug | Severity | Location |
|---|-----|----------|----------|
| S1 | **14/18 buyer routes have no AuthGuard** — checkout, orders, payments, profile, support, notifications are unprotected | 🔴 Critical | `apps/buyer/src/app/` — missing AuthGuard wrapper |
| S2 | **Admin permissions never enforced** — permission codes are assigned but AdminGuard only checks `isAuth`, not permission codes | 🔴 Critical | `apps/admin/components/layout/admin-guard.tsx` |
| S3 | **Dev bypass credentials in production code** — Phone `9831864222` + OTP `123456` grants access in all 3 apps | 🔴 Critical | All auth pages |
| S4 | **Seller guard allows unverified sellers to access all pages** | 🟡 Medium | `apps/seller/components/layout/seller-guard.tsx` |
| S5 | **Admin 401 handler doesn't skip logout for dev_bypass_token** (seller does) — inconsistent dev bypass behavior | 🟡 Medium | `apps/admin/lib/apiClient.ts` |
| S6 | **AuthProvider hardcoded to `role: "buyer"`** — shared package can't be used for seller/admin auth | 🟡 Medium | `packages/api-client/src/auth/auth-provider.tsx` |

### Functional Bugs

| # | Bug | Severity | Location |
|---|-----|----------|----------|
| F1 | **CartDrawer "Checkout Now" links to `/orders`** instead of `/checkout` | 🔴 Critical | `apps/buyer/src/components/cart/CartDrawer.tsx` |
| F2 | **Cart badge hardcoded to `2`** in buyer navbar | 🟡 Medium | Buyer Navbar component |
| F3 | **Notification badge hardcoded to `2`** in seller dashboard | 🟡 Medium | `apps/seller/app/dashboard/page.tsx` |
| F4 | **Dashboard stats hardcoded** ("+0% this month", "0 pending approval") in seller | 🟡 Medium | `apps/seller/app/dashboard/page.tsx` |
| F5 | **Product delete has no confirmation dialog** in seller app | 🟡 Medium | `apps/seller/app/products/page.tsx` |
| F6 | **Cart shows "Free Delivery"** but checkout charges ₹250 for orders under ₹5K | 🟡 Medium | Cart page vs Checkout page |
| F7 | **"Back to Products" links to `/`** instead of `/products` in buyer product detail | 🟠 Low | `apps/buyer/src/app/products/[productId]/page.tsx` |
| F8 | **`window.location.href` used instead of `router.push()`** in multiple buyer pages — causes full page reloads | 🟠 Low | Buyer login page, products page |
| F9 | **Dead imports** — 6 unused hooks imported in seller OrdersContent | 🟠 Low | `apps/seller/components/seller-pages.tsx` |

---

## 🚀 REQUIRED FIXES — Priority Matrix

### 🔴 P0 — Must Fix Before Any Testing (Blocks All Core Flows)

| # | Fix | Effort | Files |
|---|-----|--------|-------|
| 1 | **Fix CartDrawer checkout link** — Change `href="/orders"` to `href="/checkout"` | 5 min | `apps/buyer/src/components/cart/CartDrawer.tsx` |
| 2 | **Add product approval to admin** — Create `approveProduct(id)` / `rejectProduct(id)` API + approval queue UI | 4-6 hrs | `apps/admin/api/admin.api.ts`, `apps/admin/hooks/useAdmin.ts`, `apps/admin/app/products/page.tsx` |
| 3 | **Add "Mark as Shipped" to seller** — Button on order detail page → `PATCH /orders/:id/status { status: "SHIPPED" }` | 1-2 hrs | `apps/seller/app/orders/[id]/page.tsx` |
| 4 | **Fix buyer support ticket navigation** — Wrap ticket cards in `<Link>` | 15 min | `apps/buyer/src/app/support/page.tsx` |
| 5 | **Add AuthGuard to buyer routes** — Wrap checkout, orders, payments, profile, support, notifications | 1-2 hrs | 10+ buyer page files |
| 6 | **Standardize order status enums** — Agree on single status progression across all 3 apps | 2-3 hrs | All order-related pages across all apps |
| 7 | **Remove dev bypass from production code** or gate behind `NODE_ENV === 'development'` | 1 hr | All auth pages in all 3 apps |

### 🟡 P1 — Must Fix Before Launch

| # | Fix | Effort | Files |
|---|-----|--------|-------|
| 8 | **Implement online payment gateway** or remove the option | 8-16 hrs (implement) / 30 min (remove) | Buyer checkout, payments pages |
| 9 | **Wire payment creation** — Call `createPayment()` during checkout or verify backend auto-creates | 1-2 hrs | Buyer checkout page |
| 10 | **Fix Request Payout** — Replace fake toast with real API call | 2-3 hrs | Seller payouts page, seller.api.ts |
| 11 | **Enforce admin permissions** — Check permission codes in AdminGuard against current route | 3-4 hrs | `apps/admin/components/layout/admin-guard.tsx` |
| 12 | **Add admin credit management UI** — Expose `updateUserStatus(0-3)` on users page | 2-3 hrs | Admin users page |
| 13 | **Fix notification deep linking** in buyer — Click notification → navigate to related resource | 1-2 hrs | Buyer notifications page |
| 14 | **Fix cart/notification badges** — Connect to real API counts | 1 hr | Buyer navbar, seller dashboard |
| 15 | **Restrict unverified seller access** — Guard should redirect to onboarding | 30 min | `apps/seller/components/layout/seller-guard.tsx` |
| 16 | **Unify token storage keys** — Standardize on either `pb_token` or `pb_access_token` across all apps | 2-3 hrs | All apiClient files + auth providers |

### 🟠 P2 — Should Fix Before Launch

| # | Fix | Effort | Files |
|---|-----|--------|-------|
| 17 | **Add pagination** to seller products, orders, inventory, payouts | 2-3 hrs | Seller pages |
| 18 | **Add product delete confirmation** in seller app | 15 min | Seller products page |
| 19 | **Fix delivery fee messaging** — Cart and checkout should show consistent shipping cost | 30 min | Cart + checkout pages |
| 20 | **Add order detail page to admin** — Wire existing `useOrderById` hook | 2-3 hrs | Create `apps/admin/app/orders/[id]/page.tsx` |
| 21 | **Fix navigation to use `router.push()`** instead of `window.location.href` | 1 hr | Multiple buyer pages |
| 22 | **Wire unused hooks** or remove them (18+ unused hooks across apps) | 2-3 hrs | Various |
| 23 | **Fix buyer product page dead filters** — City, discount type, view mode | 2-3 hrs | Buyer products page |
| 24 | **Add real charts to admin analytics** — Replace placeholder bars with Recharts/ApexCharts | 3-4 hrs | Admin analytics page |
| 25 | **Fix landing page** — Connect product carousel and testimonials to API | 2-3 hrs | Buyer landing page |

### 🔵 P3 — Nice to Have

| # | Fix | Effort |
|---|-----|--------|
| 26 | Add stock editing to seller inventory page | 3-4 hrs |
| 27 | Add file attachment to support tickets | 2-3 hrs |
| 28 | Add KYC document upload to seller onboarding | 2-3 hrs |
| 29 | Add real-time notifications (WebSocket/SSE) | 8-16 hrs |
| 30 | Unify API layers into shared package | 16-24 hrs |
| 31 | Add date range filtering to admin orders/analytics | 2-3 hrs |
| 32 | Implement review Helpful/Reply functionality | 3-4 hrs |

---

## DEAD UI ELEMENT INVENTORY

### Buyer App (17 dead elements)

| Element | Location | Status |
|---------|----------|--------|
| "Ethical", "Generic", "Surgical", "Ayurvedic", "OTC" nav links | Navbar | `href="#"` |
| Cart badge count | Navbar | Hardcoded `2` |
| CartDrawer "Checkout Now" | CartDrawer | Links to `/orders` not `/checkout` |
| "New Items" checkbox | Products page | No state binding |
| "Best Selling" checkbox | Products page | No state binding |
| "Discount Items" checkbox | Products page | No state binding |
| "Discount PTR Only" checkbox | Products page | No state binding |
| Filter icon button | Products page | No handler |
| City filter dropdown | Products page | Value never sent to API |
| List view mode | Products page | State exists, view never renders |
| "Helpful?" button | Review pages | No API/state |
| "Reply" button | Review pages | No API/state |
| "Add New Card or UPI" | Profile page | No handler |
| "Start Chat" | Support page | No handler |
| "Read FAQ" | Support page | No handler |
| Ticket card click | Support page | Not wrapped in `<Link>` |
| Notification click | Notifications | Marks read, no navigation |

### Seller App (5 dead elements)

| Element | Location | Status |
|---------|----------|--------|
| "Request Payout" button | Payouts page | Fake toast, no API |
| Notification badge | Dashboard | Hardcoded `2` |
| Dashboard stats text | Dashboard | Hardcoded strings |
| 6 unused hook imports | OrdersContent | Dead imports |
| Inventory editing | Inventory page | Read-only, no controls |

### Admin App (7 dead elements)

| Element | Location | Status |
|---------|----------|--------|
| Product approval workflow | Products page | Missing entirely |
| Order cancel button | Orders page | Hook exists, no button |
| User delete button | Users page | Hook exists, no button |
| User credit status control | Users page | API exists, no UI |
| Create settlement | Settlements page | Hook exists, no UI |
| Per-seller settlement view | Settlements page | Hook exists, no UI |
| Product view/edit/create | Products page | Hooks exist, no UI |

---

## UNUSED HOOKS INVENTORY

### Buyer App (8 unused hooks)
- `useCreatePayment` — Never called; payment records never created from frontend
- `useOrderMilestones` — Never called; milestone data never displayed
- `useConfirmMilestonePayment` — Never called; milestone payments never confirmed
- `useOrderInvoice` — Never called; no invoice download feature
- `useDiscountDetails` — Never called; no discount detail view
- `useDeleteNotification` — Never called; no delete button
- `useUpdateReview` / `useDeleteReview` — Never called; no review management
- `useCloseTicket` — Never called; buyer can't close tickets

### Seller App (6 unused imports in OrdersContent)
- `useSellerCustomOrders`
- `useSellerCancelledOrders`
- `useSellerAnalytics`
- `useSellerDashboard`
- `useSellerSettlements`
- `useSellerSettlementSummary`

### Admin App (4 hooks with no UI)
- `useDeleteUser` — Hook wired, no button
- `useCancelOrder` — Hook wired, no button
- `useCreateSettlement` — Hook wired, no UI
- `useSellerSettlements` — Hook wired, no UI

---

## FINAL VERDICT

### Platform Status: 🔴 NOT LAUNCH-READY

**The platform has solid individual page implementations but critical cross-app integration failures prevent any complete user journey from working end-to-end.**

### Key Blockers:
1. **Buyers cannot check out** (CartDrawer links to wrong page)
2. **Products cannot be approved** (admin has no approval flow)
3. **Orders cannot be shipped** (seller has no ship action)
4. **Online payments don't work** (no gateway integration)
5. **14/18 buyer routes are unprotected** (security risk)
6. **Three separate API layers** with incompatible tokens/types

### Estimated Effort to Reach MVP:
- **P0 fixes (blocks testing):** ~15-20 hours
- **P1 fixes (blocks launch):** ~25-35 hours
- **Total to launch-ready:** ~40-55 hours of frontend work

### Recommendation:
1. Fix P0 items first — they unblock all testing
2. Standardize status enums and token keys across all apps
3. Validate all flows with a real backend before proceeding to P1
4. Consider unifying the API layer into the shared `@pharmabag/api-client` package to prevent future drift
