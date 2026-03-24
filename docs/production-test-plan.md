# PharmaBag Production Test Plan

## Pre-Launch Validation Checklist

> This document covers critical user journeys and edge cases that must be manually validated before production launch.

---

## 1. Authentication (All 3 Apps)

### Buyer App
| # | Test Case | Expected Result |
|---|-----------|----------------|
| 1.1 | Enter valid 10-digit phone → Send OTP | OTP sent toast, step advances to OTP input |
| 1.2 | Enter valid OTP | Redirect to /products, user profile loaded |
| 1.3 | Enter invalid OTP | "Invalid OTP" toast, stays on OTP step |
| 1.4 | Enter phone with country code (e.g. 919831...) | Auto-strips 91 prefix, sends OTP |
| 1.5 | Close LoginModal mid-flow | Modal closes cleanly, no leaked state |
| 1.6 | Refresh page when logged in | User remains authenticated (token persists) |
| 1.7 | Token expires mid-session | Refresh token kicks in; if both expired, redirect to /login |
| 1.8 | Access /cart, /checkout, /orders without login | AuthGuard redirects to /login |

### Seller App
| # | Test Case | Expected Result |
|---|-----------|----------------|
| 1.9  | Seller login with valid phone/OTP | Redirect to /dashboard |
| 1.10 | Unverified seller after login | Redirect to /onboarding |
| 1.11 | PENDING seller after login | "Application Under Review" message shown |
| 1.12 | APPROVED seller after login | Dashboard loads with stats |
| 1.13 | 401 response during session | Auto-logout, redirect to /auth |

### Admin App
| # | Test Case | Expected Result |
|---|-----------|----------------|
| 1.14 | Admin login with valid phone/OTP | Redirect to /dashboard |
| 1.15 | Non-admin user tries admin login | "Access denied" toast, token cleared |
| 1.16 | 401 response during session | Auto-logout, redirect to /auth |

---

## 2. Product Browsing (Buyer)

| # | Test Case | Expected Result |
|---|-----------|----------------|
| 2.1 | Load /products page | Products grid renders from API (no mock data) |
| 2.2 | Filter by category | Products filtered, URL params updated |
| 2.3 | Filter by manufacturer | Products filtered correctly |
| 2.4 | Search products by name | Search results render |
| 2.5 | Sort by price (low/high) | Products reorder correctly |
| 2.6 | Navigate to product detail | Product detail page loads with Image (not raw img) |
| 2.7 | Product with no image | Placeholder/fallback renders |
| 2.8 | MOQ displays correctly | Shows product.moq or defaults to 1 (not 162) |
| 2.9 | Discount tag shows only when present | No "15% Off (9+0)" on products without discount |

---

## 3. Cart & Checkout (Buyer)

| # | Test Case | Expected Result |
|---|-----------|----------------|
| 3.1 | Add product to cart | Cart updates, toast confirmation |
| 3.2 | Update cart quantity | Quantity updates, totals recalculate |
| 3.3 | Remove item from cart | Item removed, totals recalculate |
| 3.4 | Cart GST calculation | Uses platform config gst_rate (not hardcoded 12%) |
| 3.5 | Cart minimum order validation | Shows warning if below min_order_amount from config |
| 3.6 | CartDrawer GST label | Shows "GST (X%)" dynamically from config |
| 3.7 | Proceed to checkout | Checkout page loads with order summary |
| 3.8 | Shipping fee logic | Free above shipping_threshold, else shipping_fee (from config) |
| 3.9 | Checkout total calculation | Subtotal + GST + shipping = correct total |
| 3.10 | Select COD payment | Order placed with paymentMethod: 'cod' |
| 3.11 | Select credit payment | Credit limit validated; blocked if total > available credit |
| 3.12 | Payment failure | Redirects WITHOUT success flag, shows "contact support" message |
| 3.13 | Empty cart checkout | Cannot proceed, appropriate message shown |

---

## 4. Orders (Buyer)

| # | Test Case | Expected Result |
|---|-----------|----------------|
| 4.1 | View orders list | Orders load from API |
| 4.2 | View order detail | Order detail page renders |
| 4.3 | Cancel order | Order status updates, both list and detail queries invalidated |
| 4.4 | Upload payment proof | File uploads, order and payment queries invalidated |

---

## 5. Tickets (Buyer)

| # | Test Case | Expected Result |
|---|-----------|----------------|
| 5.1 | Create support ticket | Ticket created, list refreshed |
| 5.2 | View ticket detail | Ticket messages render |
| 5.3 | Close ticket | Ticket status updates, detail query invalidated |

---

## 6. Seller Product Management

| # | Test Case | Expected Result |
|---|-----------|----------------|
| 6.1 | Create new product | Product created with all fields including bulk, extraFields |
| 6.2 | Edit existing product | product_price pre-filled from mrp (not price) |
| 6.3 | GST not sent in payload | Backend computes GST (not hardcoded 12 from frontend) |
| 6.4 | Toggle vacation mode | Store visibility toggled, toast confirmation |

---

## 7. Error Handling

| # | Test Case | Expected Result |
|---|-----------|----------------|
| 7.1 | Backend returns 403 (buyer) | Toast: "You don't have permission..." |
| 7.2 | Backend returns 500 (buyer) | Toast: "Something went wrong..." |
| 7.3 | Network offline (buyer) | Toast: "Network error..." |
| 7.4 | Backend returns 403 (admin/seller) | react-hot-toast error shown |
| 7.5 | Backend returns 500 (admin/seller) | react-hot-toast error shown |
| 7.6 | Mutation fails (any app) | No automatic retry (retry: 0 for mutations) |
| 7.7 | Query fails once (buyer) | Retries once (retry: 1), then shows error |

---

## 8. Performance Validation

| # | Test Case | Expected Result |
|---|-----------|----------------|
| 8.1 | Categories cached across navigations | No refetch within 30 minutes |
| 8.2 | Manufacturers cached | No refetch within 30 minutes |
| 8.3 | Cities cached | No refetch within 1 hour |
| 8.4 | Buyer profile cached | No refetch within 5 minutes |
| 8.5 | Product images use next/image | Verify in DevTools: images served as WebP, lazy-loaded |
| 8.6 | Product detail hero image | Priority loaded (no lazy) |

---

## 9. Security Validation

| # | Test Case | Expected Result |
|---|-----------|----------------|
| 9.1 | ~~Phone 9831864222 + OTP 123456~~ | ❌ Must NOT grant access (dev bypass REMOVED) |
| 9.2 | Token "dev_bypass_token" in localStorage | ❌ Must NOT create mock user (bypass REMOVED) |
| 9.3 | Production build has no console.* output | Verified via compiler.removeConsole in all next.config.js |
| 9.4 | localStorage pb_access_token tampered | API calls fail with 401, user logged out |
| 9.5 | Admin portal rejects non-ADMIN role | "Access denied" toast, token cleared |

---

## 10. Platform Config Dependency

| # | Test Case | Expected Result |
|---|-----------|----------------|
| 10.1 | GET /config/platform returns valid response | Config values used across cart, checkout, CartDrawer |
| 10.2 | GET /config/platform is down | Fallback defaults used (GST 12%, min order 20000, etc.) |
| 10.3 | Config values change on backend | Reflected in UI after 5-minute cache expiry |

---

## Environment Variables Required

| App | Variable | Purpose |
|-----|----------|---------|
| Buyer | `NEXT_PUBLIC_API_URL` | API base URL |
| Admin | `NEXT_PUBLIC_API_BASE_URL` | API base URL |
| Seller | `NEXT_PUBLIC_API_BASE_URL` | API base URL |

> ⚠️ **Note**: Buyer uses a different env var name than admin/seller. Ensure all are set correctly in deployment.
