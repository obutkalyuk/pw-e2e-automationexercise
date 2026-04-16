# Automation Test Cases Plan

## API Tests
### Critical Priority (Smoke API)

|**Status**| **#** | **API Endpoint** | **Method** | **Description** | **Priority** | **Notes** | **File Name** |
|----------| ----- | ---------------- | ---------- | --------------- | ------------ | --------- | ------------- |
|Covered| API-1 | `/createAccount` | POST | Create user account | **Critical** | Base for all hybrid tests; RQ-007 |tests\api\auth\account_flow.api.spec.ts|
|Covered| API-2 | `/deleteAccount` | DELETE | Delete user account | **Critical** | Cleanup; RQ-008 |tests\api\auth\account_flow.api.spec.ts|
|Covered| API-3 | `/verifyLogin` | POST | Verify login with valid details | **Critical** | Authorization check; RQ-001 |tests\api\auth\account_flow.api.spec.ts|
|Covered| API-18 | Purchase request chain (login -> cart -> checkout -> payment) | Hybrid | Verify end-to-end transactional request chain without UI noise | **Critical** | Smoke coverage for session, cart, checkout, CSRF, payment redirect chain; RQ-005, RQ-018, RQ-021, RQ-022, RQ-024 |tests\api\chain\purchase.chain.api.spec.ts|
|Covered| API-19 | Checkout without login should be blocked | Hybrid | Verify anonymous user cannot reach active checkout state after adding products to cart | **Critical** | Known defect `#17`; complements API-18 golden path |tests\api\chain\purchase.chain.break.api.spec.ts|
|Covered| API-20 | Payment without checkout should be blocked | Hybrid | Verify logged-in user cannot create order before explicit checkout transition | **Critical** | Known defect `#18`; payment/order creation from invalid purchase state |tests\api\chain\purchase.chain.break.api.spec.ts|
|Covered| API-21 | Checkout after logout should be invalidated | Hybrid | Verify stale checkout state cannot be reused after session logout | **High** | Known defect `#19`; stale authenticated purchase context after logout |tests\api\chain\purchase.chain.break.api.spec.ts|
|Covered| API-22 | Payment without login should be blocked | Hybrid | Verify anonymous payment access cannot create success artifacts or order ids | **Critical** | Known defect `#20`; anonymous payment submission |tests\api\chain\purchase.chain.break.api.spec.ts|
|Covered| API-23 | Repeated payment submit should preserve consistent purchase completion state | Hybrid | Verify repeated payment submission after valid checkout does not produce inconsistent completion artifacts | **Critical** | Exploratory behavior coverage for repeated payment submission after valid checkout; verifies observed completion artifacts, invoice availability, and post-submit cart state without assuming backend persistence truth |tests\api\chain\payment.idempotency.api.spec.ts|
|Covered| API-24 | Completed purchase should keep cart empty across logout and new login | Hybrid | Verify post-purchase cart reset is preserved after logout and subsequent authenticated session reuse | **High** | State invariant coverage for completed purchase aftermath; confirms cart does not revive across logout/login boundary |tests\api\chain\order.state.api.spec.ts|
|Covered| API-25 | Checkout amount should match invoice amount after successful purchase | Hybrid | Verify invoice artifact keeps the same total amount that was shown at checkout before payment | **High** | State invariant coverage for checkout-to-invoice amount consistency in the valid purchase flow; documents actual artifact amount when observed |tests\api\chain\order.state.api.spec.ts|

### High Priority (Regression API)

|**Status**| **#** | **API Endpoint** | **Method** | **Description** | **Priority** | **Notes** | **File Name** |
|------| ----- | ----------------------- | ---------- | ----------------------- | ------------ | ----------------------- |---------------|
|Covered| API-4 | `/productsList` | GET | Get all products list | **High** | Check JSON products; RQ-012 |tests\api\catalog\catalog.api.spec.ts|
|Covered| API-5 | `/searchProduct` | POST | Search for a product | **High** | Search logic validation; RQ-016 |tests\api\catalog\catalog.api.spec.ts|
|Covered| API-6 | `/getUserDetailByEmail` | GET | Get user account detail | **High** | RQ-010 |tests\api\auth\account_flow.api.spec.ts|

### Medium/Low Priority (Extended Validation)

_Negative cases and additional methods_

|**Status**| **#** | **API Endpoint** | **Method** | **Description** | **Priority** | **Notes** |**File Name**|
| -------- | ----- | ---------------- | ---------- | --------------------------- | ------------ | ----------------------------- |-------------|
|Covered| API-7 | `/verifyLogin` | POST | Login with invalid details | **Medium** | Negative: error codes check; RQ-004 |tests\api\auth\account_flow.api.spec.ts|
|Covered| API-8 | `/brandsList` | GET | Get all brands list | **Medium** | Brand list verification; RQ-014 |tests\api\catalog\catalog.api.spec.ts|
|Covered| API-9 | `/updateAccount` | PUT | Update user account details | **Medium** | Update profile verification; RQ-009 |tests\api\auth\account_update.api.spec.ts|
|Covered| API-10 | `/updateAccount` | PUT | Update fails for non-existing email | **Low** | Negative: account not found; RQ-009 |tests\api\auth\account_update.api.spec.ts|
|Covered| API-11 | `/productsList` | POST | Reject unsupported method for product list | **Medium** | Negative: method not supported; RQ-013 |tests\api\catalog\catalog.api.spec.ts|
|Covered| API-12 | `/brandsList` | PUT | Reject unsupported method for brand list | **Medium** | Negative: method not supported; RQ-015 |tests\api\catalog\catalog.api.spec.ts|
|Covered| API-13 | `/searchProduct` | POST | Reject search without required parameter | **Medium** | Negative: missing `search_product`; RQ-017 |tests\api\catalog\catalog.api.spec.ts|
|Covered| API-14 | `/verifyLogin` | POST | Reject verify login without required parameter | **Medium** | Negative: missing email/password; RQ-002 |tests\api\auth\account_flow.api.spec.ts|
|Covered| API-15 | `/verifyLogin` | DELETE | Reject unsupported method for verify login | **Medium** | Negative: method not supported; RQ-003 |tests\api\auth\account_flow.api.spec.ts|
|Covered| API-16 | `/createAccount` | POST | Reject create account with invalid or incomplete data | **Low** | Negative validation scenario; RQ-007 |tests\api\auth\account_flow.api.spec.ts|
|Covered| API-17 | `/deleteAccount` | DELETE | Reject delete account with invalid credentials | **Low** | Negative cleanup scenario; RQ-008 |tests\api\auth\account_flow.api.spec.ts|

### Transport Request Coverage

_Session-based HTML/redirect/download request checks_

|**Status**| **#** | **Transport Endpoint** | **Method** | **Description** | **Priority** | **Notes** |**File Name**|
| -------- | ----- | ---------------------- | ---------- | --------------- | ------------ | --------- |-------------|
|Covered| TR-1 | `/login` | POST | Authenticate user via transport flow | **High** | Session-based login request; RQ-005 |tests\api\transport\purchase.transport.api.spec.ts|
|Covered| TR-2 | `/add_to_cart/{product_id}` | GET | Add product to cart for active session | **High** | Cart setup request without UI noise; RQ-018 |tests\api\transport\purchase.transport.api.spec.ts|
|Covered| TR-3 | `/checkout` | GET | Access checkout document for active cart session | **High** | Document flow access check; RQ-021 |tests\api\transport\purchase.transport.api.spec.ts|
|Covered| TR-4 | `/payment` | GET | Access payment document after checkout | **High** | Document flow access check; RQ-022 |tests\api\transport\purchase.transport.api.spec.ts|
|Covered| TR-5 | `/payment` | POST | Submit payment and verify redirect to order completion | **Critical** | Redirect-based transport validation; RQ-023, RQ-024 |tests\api\transport\purchase.transport.api.spec.ts|
|Covered| TR-6 | `/download_invoice/{value}` | GET | Download invoice after successful purchase | **Medium** | Transport download/content check; RQ-025 |tests\api\transport\purchase.transport.api.spec.ts|
|Covered| TR-7 | `/logout` | GET | Invalidate session and redirect to login | **Medium** | Transport logout redirect and session reset check; RQ-006 |tests\api\transport\purchase.transport.api.spec.ts|
|Covered| TR-8 | `/view_cart` | GET | Open cart document for active cart session | **High** | Transport cart document/content check; RQ-019 |tests\api\transport\purchase.transport.api.spec.ts|
|Covered| TR-9 | `/delete_cart/{product_id}` | GET | Remove product row from cart state | **High** | Transport delete-cart behavior check, including repeated product row removal; RQ-020 |tests\api\transport\purchase.transport.api.spec.ts|
|Covered| TR-10 | `/checkout` | GET | Block checkout document when no authenticated session exists | **High** | Known defect `#17`; transport probe for anonymous checkout guardrail gap |tests\api\chain\purchase.chain.break.api.spec.ts|
|Covered| TR-11 | `/payment` | GET/POST | Block payment flow before checkout transition in authenticated session | **High** | Known defect `#18`; transport probe for pre-checkout payment/order creation gap |tests\api\chain\purchase.chain.break.api.spec.ts|
|Covered| TR-12 | `/checkout`, `/payment`, `/logout` | GET/POST | Invalidate checkout/payment access after logout | **High** | Known defect `#19`; transport probe for stale purchase state after session invalidation |tests\api\chain\purchase.chain.break.api.spec.ts|
|Covered| TR-13 | `/payment` | GET/POST | Block anonymous payment access and success artifacts | **High** | Known defect `#20`; transport probe for anonymous payment submission gap |tests\api\chain\purchase.chain.break.api.spec.ts|
|Covered| TR-14 | `/payment` | POST | Replay POST /payment in the same session after one payment form load | **High** | Transport-first replay probe for duplicate payment submission with shared CSRF/session context; captures redirect/order-like artifacts and response behavior on repeated submit |tests\api\chain\payment.idempotency.api.spec.ts|
|Covered| TR-15 | `/view_cart`, `/logout`, `/login` | GET/POST | Preserve empty cart state after completed purchase across logout/login boundary | **High** | Transport-first post-purchase state probe; verifies cart reset remains stable after session invalidation and re-authentication |tests\api\chain\order.state.api.spec.ts|
|Covered| TR-16 | `/checkout`, `/payment`, `/download_invoice/{value}` | GET/POST | Preserve amount consistency between checkout and invoice artifact after successful purchase | **High** | Transport-first amount invariant probe for purchase completion artifacts; documents checkout-to-invoice total mismatch behavior when observed |tests\api\chain\order.state.api.spec.ts|

## E2E and Hybrid Tests
### Critical Priority

|**Status**| **#** | **Test Case** | **Category** | **Automation Type** | **Notes** | **File Name** |
| --- | --- | :----------------------------------------- | -------------- | --------------- | ------------------------------------------------------------- | --------- |
|Covered| E2E-1 | Register User | User / Account | E2E | Full sign up + delete account, can optimize via API for setup | tests\e2e\Account_create.spec.ts |
|Covered| E2E-2 | Login User with correct email and password | User / Account | E2E | Include delete account after login | tests\e2e\Account_login.spec.ts |
|Covered| E2E-14 | Register while Checkout preserves cart | Orders / Checkout Boundary | E2E | Verifies cart contents survive signup from checkout login modal | tests\e2e\Checkout.spec.ts |
|Covered| E2E-15 | Login while Checkout preserves cart | Orders / Checkout Boundary | E2E (Hybrid) | Verifies cart contents survive login from checkout login modal | tests\e2e\Checkout.spec.ts |
|Covered| E2E-16 | Place Order: Login before Checkout | Orders | E2E (Hybrid) | Login first, then checkout | tests\e2e\Checkout.spec.ts |

### High Priority

|**Status**| **#** | **Test Case** | **Category** | **Automation Type** | **Notes** | **File Name** |
| ---- | --- | :------------------------------------------- | ----------------- | --------------- | ------------------------------------------------------ | --------- |
|Covered| E2E-3 | Login User with incorrect email and password | User / Account | E2E | Negative scenario | tests\e2e\Account_login.spec.ts |
|Covered| E2E-4 | Logout User | User / Account | E2E | Login + logout flow | tests\e2e\Account_logout.spec.ts |
|Covered| E2E-8 | Verify All Products and product detail page | Products | E2E | Check product list and details | tests\e2e\Products_details.spec.ts |
|Covered| E2E-9 | Search Product | Products | E2E | Verify search results | tests\e2e\Products_search.spec.ts |
|Covered| E2E-12 | Add Products in Cart | Products / Cart | E2E | Hover, add multiple products, verify prices and totals | tests\e2e\Cart_add_products.spec.ts |
|Covered| E2E-13 | Verify Product quantity in Cart | Products / Cart | E2E | Increase quantity, verify in cart | tests\e2e\Cart_product_quantity.spec.ts |
|Covered| E2E-17 | Remove Products From Cart | Products / Cart | E2E | Delete products from cart | tests\e2e\Cart_remove_products.spec.ts |
|Covered| E2E-20 | Search Products and Verify Cart After Login | Products / Cart | E2E | Search, add to cart, login, verify persistence | tests\e2e\Cart_search_persistence.spec.ts |
|Covered| 23 | Verify address details in Checkout page | Orders / Checkout | E2E | Verify delivery and billing address match registration | tests\e2e\Checkout.spec.ts |

### Medium Priority

|**Status**| **#** | **Test Case** | **Category** | **Automation Type** | **Notes** | **File Name** |
| --- | --- | ------------------------------------- | --------------------- | --------------- | ----------------------------------------------------- | --------- |
|Covered| E2E-5 | Register User with existing email | User / Account | E2E | Negative scenario for duplicate email | tests\e2e\Account_create.spec.ts |
| | 6 | Contact Us Form | Contact / Pages | E2E | Includes file upload and success message verification | |
| | 10 | Verify Subscription in Home Page | Pages / Subscription | E2E | Footer subscription; BF-002 | |
| | 11 | Verify Subscription in Cart Page | Pages / Subscription | E2E | Footer subscription on cart page; BF-002 | |
|Covered| 18 | View Category Products | Products / Navigation | E2E | Check categories and subcategories | tests\e2e\Category_products.spec.ts |
|Covered| 19 | View & Cart Brand Products | Products / Navigation | E2E | Check brand filter and product listing | tests\e2e\Brand_products.spec.ts |
|Covered| 21 | Add review on product | Products / Reviews | E2E | Verify review submission and success message; BF-001 | tests\e2e\Product_review.spec.ts |
| | 22 | Add to cart from Recommended items | Products / Cart | E2E | Check recommended items section | |
| | 24 | Download Invoice after purchase order | Orders / Checkout | E2E | Verify invoice download after purchase | |
| | 27 | Delete Account from UI | User / Account | E2E | Verify delete account flow from navigation menu | |

### Low Priority

| # | Test Case | Category | Automation Type | Notes | File Name |
| --- | --------------------------------------------------------------------- | --------------- | --------------- | ---------------------------------------- | --------- |
| 7 | Verify Test Cases Page | Pages / UI | UI | Simple navigation check | |
| 10 | Verify Subscription in Home Page submits real request | Pages / Subscription | E2E | Known defect: success shown without network request; BF-002 | |
| 11 | Verify Subscription in Cart Page submits real request | Pages / Subscription | E2E | Known defect: success shown without network request; BF-002 | |
| 21 | Verify product review is actually submitted | Products / Reviews | E2E | Known defect: success shown without network request; BF-001 | |
| 24 | Download Invoice after purchase order shows correct total | Orders / Checkout | E2E | Earlier exploratory zero-total observation likely came from replay-created artifacts, not from the normal purchase flow | |
| 25 | Verify Scroll Up using 'Arrow' button and Scroll Down functionality | UI / Navigation | UI | Scroll verification with arrow button | |
| 26 | Verify Scroll Up without 'Arrow' button and Scroll Down functionality | UI / Navigation | UI | Scroll verification without arrow button | |

### Performance & Monitoring (Chromium Only)

|**Status**| **#** | **Scope** | **Method** | **Description** | **Priority** | **Notes** | **File Name** |
| --- | ----- | --------------- | ---------- | --------------------------------------- | ------------ | ----------------------------- | ----|
|Covered| M-1 | Performance & Monitoring | Playwright + CDP | Network Throttling & Resource TTFB | **Medium** | Metrics: TTFB, DNS, Total |tests/monitoring/monitoring.spec.ts|
|Covered| C-1 | Concurrency | UI / Stress Probe | Parallel User Registration (10 workers) | **Low** | Browser-level registration concurrency probe |tests/monitoring/Account_create_concurrency.spec.ts|




