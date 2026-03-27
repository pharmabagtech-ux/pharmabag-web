# Product Requirements Document (PRD) & Master Task List

This document consolidates all the remaining tasks, fixes, and required features across the PharmaBag platform (Buyer, Seller, Admin apps) based on the latest system-wide audits and integration tests.

## 🔴 Priority 0 - Critical Blockers
*These items must be fixed before any further end-to-end testing can proceed. They block core user flows.*

- [ ] **Fix Cart → Checkout Flow**: Change `CartDrawer` "Checkout Now" button to link to `/checkout` instead of `/orders`.
- [ ] **Add Admin Product Approval Pipeline**: Create `approveProduct(id)` and `rejectProduct(id)` API functions and add an approval queue UI in the admin products page.
- [ ] **Add "Mark as Shipped" Action for Sellers**: Add a button on the seller order detail page to patch order status to `SHIPPED`.
- [ ] **Fix Buyer Support Ticket Navigation**: Wrap ticket list cards in `<Link>` tags so users can actually view the ticket chat/replies.
- [ ] **Secure Buyer Routes**: Add `AuthGuard` to 14 unprotected buyer routes (checkout, orders, payments, profile, support, notifications).
- [ ] **Standardize Order Status Enums**: Agree on and enforce a single status progression (e.g., PLACED → ACCEPTED → SHIPPED → DELIVERED) across all 3 apps and the backend.
- [ ] **Remove Auth Dev Bypass**: Remove hardcoded bypass credentials (`9831864222` / `123456`) from production code or gate them behind `NODE_ENV === 'development'`.

## 🟡 Priority 1 - Launch Requirements
*These items must be fixed before the platform can go live to production.*

- [ ] **Online Payment Integration**: Implement the actual payment gateway (e.g., Razorpay/CCAvenue) or completely remove the online payment option and stick to COD/Credit.
- [ ] **Wire Payment Creation**: Ensure `useCreatePayment()` is called during checkout or verify the backend auto-creates payment records so the payment flow works.
- [ ] **Fix "Request Payout" in Seller App**: Replace the fake success toast with a real API call to request settlements.
- [ ] **Enforce Admin Permissions**: Update `AdminGuard` to actually verify the admin's permission codes against the requested route.
- [ ] **Admin Credit Management UI**: Expose the `updateUserStatus(0-3)` API in the admin users page so admins can control buyer credit levels.
- [ ] **Fix Buyer Notification Deep Links**: Ensure clicking a notification navigates to the related resource instead of just marking it as read.
- [ ] **Dynamic Badges**: Stop hardcoding notification and cart badges to `2`. Connect them to real API counts.
- [ ] **Enforce Seller Verification Guard**: Unverified sellers must be properly restricted to the onboarding page and blocked from the dashboard/orders.
- [ ] **Unify Token Storage Keys**: Standardize token usage (`pb_token` vs `pb_access_token`) across all 3 apps.
- [ ] **Verify Missing Backend Endpoints**: Ensure `/notifications/read-all`, `DELETE /notifications/:id`, seller settlement endpoints, and admin ticket management endpoints exist on the backend.

## 🟠 Priority 2 - UX & Functionality Polish
*These features significantly degrade experience but aren't structural blockers.*

- [ ] **Add Pagination**: Implement pagination for seller products, orders, inventory, and payouts.
- [ ] **Product Deletion Safeguard**: Add a confirmation dialog before deleting products in the seller app.
- [ ] **Consistent Delivery Fees**: Fix messaging so the Cart and Checkout pages show the exact same shipping cost (e.g., ₹250 for orders < ₹5K).
- [ ] **Admin Order Detail Page**: Wire up the existing `useOrderById` hook and create the `/orders/[id]` page rather than just a list view.
- [ ] **Fix Next.js Navigation**: Replace all instances of `window.location.href` with `router.push()` in the buyer app to stop full page reloads.
- [ ] **Clean Up Unused Hooks**: Wire up or remove the 18+ dead hooks (e.g., `useOrderInvoice`, `useDiscountDetails`, unused seller/admin analytics).
- [ ] **Fix Buyer Product Page Filters**: Wire up city, discount type, and list view mode filters so they actually communicate with the API.
- [ ] **Admin Analytics Charts**: Replace hardcoded placeholder bars with real `Recharts` / `ApexCharts` using the dashboard stats API.
- [ ] **Dynamic Landing Page**: Connect the product carousel and testimonials on the buyer homepage to the backend API.

## 🔵 Priority 3 - Enhancements / Nice-to-Haves
*Deferred features that can come post-launch.*

- [ ] **Stock Editing**: Add inline stock quantity editing to the seller inventory page.
- [ ] **Ticket Attachments**: Allow file uploads for support tickets.
- [ ] **KYC Document Uploads**: Add actual file uploading to seller onboarding instead of just text fields.
- [ ] **Real-time Updates**: Replace 60s polling with WebSocket or SSE for notifications and ticket replies.
- [ ] **API Layer Consolidation**: Refactor all three apps to use the single `@pharmabag/api-client` package to fix token and type drift.
- [ ] **Date Range Filtering**: Add date pickers to admin orders and analytics pages.
- [ ] **Review Interactivity**: Implement the "Helpful?" and "Reply" buttons on product reviews.
- [ ] **Integration Test Suite**: Add automated E2E tests for critical flows (auth, orders, payments).
- [ ] **API Contract Validation**: Add Zod runtime parsing at the API client layer and use OpenAPI/Swagger to prevent future frontend/backend mismatches.
