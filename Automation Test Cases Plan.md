# Automation Test Cases Plan

## API Tests
### Critical Priority (Smoke API)

|**Status**| **#** | **API Endpoint** | **Method** | **Description**                 | **Priority** | **Notes**                 | **File Name** |
|----------| ----- | ---------------- | ---------- | ------------------------------- | ------------ | ------------------------- | --------------|
|✅| API-1 | `/createAccount` | POST       | Create user account             | **Critical** | Base for all hybrid tests; RQ-007 |tests\api\auth\account_flow.api.spec.ts|
|✅| API-2 | `/deleteAccount` | DELETE     | Delete user account             | **Critical** | Cleanup; RQ-008           |tests\api\auth\account_flow.api.spec.ts|
|✅| API-3 | `/verifyLogin`   | POST       | Verify login with valid details | **Critical** | authorization check; RQ-001|tests\api\auth\account_flow.api.spec.ts|
| | API-18 | Purchase request chain (login -> cart -> checkout -> payment) | Hybrid | Verify end-to-end transactional request chain without UI noise | **Critical** | Planned smoke coverage for session, cart, checkout, CSRF, payment redirect chain; RQ-005, RQ-018, RQ-021, RQ-022, RQ-024 | |
### High Priority (Regression API)

|**Status**| **#** | **API Endpoint**        | **Method** | **Description**         | **Priority** | **Notes**               | **File Name** |
|------| ----- | ----------------------- | ---------- | ----------------------- | ------------ | ----------------------- |---------------|
|✅| API-4 | `/productsList`         | GET        | Get all products list   | **High**     | check JSON products; RQ-012|tests\api\catalog\catalog.api.spec.ts|
|✅| API-5 | `/searchProduct`        | POST       | Search for a product    | **High**     | search logic validation; RQ-016|tests\api\catalog\catalog.api.spec.ts|
|✅| API-6 | `/getUserDetailByEmail` | GET        | Get user account detail | **High**     | RQ-010                  |tests\api\auth\account_flow.api.spec.ts|

### Medium/Low Priority (Extended Validation)

_Negative cases and additional methods_

|**Status**| **#** | **API Endpoint** | **Method** | **Description**             | **Priority** | **Notes**                     |**File Name**|
| -------- | ----- | ---------------- | ---------- | --------------------------- | ------------ | ----------------------------- |-------------|
|✅| API-7 | `/verifyLogin`   | POST       | Login with invalid details  | **Medium**   | Negative: error codes check; RQ-004|tests\api\auth\account_flow.api.spec.ts|
|✅| API-8 | `/brandsList`    | GET        | Get all brands list         | **Medium**   | brand list verification; RQ-014|tests\api\catalog\catalog.api.spec.ts|
|✅| API-9 | `/updateAccount` | PUT        | Update user account details | **Medium**   | update profile verification; RQ-009|tests\api\auth\account_update.api.spec.ts|
|✅| API-10 | `/updateAccount` | PUT        | Update fails for non-existing email | **Low**   | Negative: account not found; RQ-009|tests\api\auth\account_update.api.spec.ts|
|| API-11 | `/productsList` | POST | Reject unsupported method for product list | **Medium** | Negative: method not supported; RQ-013 | |
|| API-12 | `/brandsList` | PUT | Reject unsupported method for brand list | **Medium** | Negative: method not supported; RQ-015 | |
|| API-13 | `/searchProduct` | POST | Reject search without required parameter | **Medium** | Negative: missing `search_product`; RQ-017 | |
|| API-14 | `/verifyLogin` | POST | Reject verify login without required parameter | **Medium** | Negative: missing email/password; RQ-002 | |
|| API-15 | `/verifyLogin` | DELETE | Reject unsupported method for verify login | **Medium** | Negative: method not supported; RQ-003 | |
|| API-16 | `/createAccount` | POST | Reject create account with invalid or incomplete data | **Low** | Negative validation scenario; RQ-007 | |
|| API-17 | `/deleteAccount` | DELETE | Reject delete account with invalid credentials | **Low** | Negative cleanup scenario; RQ-008 | |

### Transport Request Coverage

_Session-based HTML/redirect/download request checks_

|**Status**| **#** | **Transport Endpoint** | **Method** | **Description** | **Priority** | **Notes** |**File Name**|
| -------- | ----- | ---------------------- | ---------- | --------------- | ------------ | --------- |-------------|
|✅| TR-1 | `/login` | POST | Authenticate user via transport flow | **High** | Session-based login request; RQ-005 |tests\api\transport\purchase.transport.api.spec.ts |
|✅| TR-2 | `/add_to_cart/{product_id}` | GET | Add product to cart for active session | **High** | Cart setup request without UI noise; RQ-018 |tests\api\transport\purchase.transport.api.spec.ts |
|✅| TR-3 | `/checkout` | GET | Access checkout document for active cart session | **High** | Document flow access check; RQ-021 |tests\api\transport\purchase.transport.api.spec.ts |
|✅| TR-4 | `/payment` | GET | Access payment document after checkout | **High** | Document flow access check; RQ-022 |tests\api\transport\purchase.transport.api.spec.ts |
|✅| TR-5 | `/payment` | POST | Submit payment and verify redirect to order completion | **Critical** | Redirect-based transport validation; RQ-023, RQ-024 |tests\api\transport\purchase.transport.api.spec.ts |
|✅| TR-6 | `/download_invoice/{orderId}` | GET | Download invoice after successful purchase | **Medium** | Transport download/content check; RQ-025 | tests\api\transport\purchase.transport.api.spec.ts|
## E2E and Hybrid Tests
### Critical Priority

|**Status**| **#**   | **Test Case**                                  | **Category**      | **Automation Type** | **Notes**                                                         | **File Name** |
| --- | --- | :----------------------------------------- | -------------- | --------------- | ------------------------------------------------------------- | --------- |
|✅| E2E-1   | Register User                              | User / Account | E2E             | Full sign up + delete account, can optimize via API for setup | tests\e2e\Account_create.spec.ts |
|✅| E2E-2   | Login User with correct email and password | User / Account | E2E             | Include delete account after login                            | tests\e2e\Account_login.spec.ts |
|✅| E2E-14  | Place Order: Register while Checkout       | Orders         | E2E             | Full checkout flow with account creation                      | tests\e2e\Account_create.spec.ts |
|✅| E2E-15  | Place Order: Register before Checkout      | Orders         | E2E (Hybrid)    | Create account first, then checkout                           | tests\e2e\Checkout.spec.ts |
|✅| E2E-16  | Place Order: Login before Checkout         | Orders         | E2E (Hybrid)    | Login first, then checkout                                    | tests\e2e\Account_create.spec.ts |

### High Priority

|**Status**| **#**   | **Test Case**                                    | **Category**         | **Automation Type** | **Notes**                                                  | **File Name** |
| ---- | --- | :------------------------------------------- | ----------------- | --------------- | ------------------------------------------------------ | --------- |
|✅| E2E-3   | Login User with incorrect email and password | User / Account    | E2E             | Negative scenario                                      |  tests\e2e\Account_login.spec.ts        |
|✅| E2E-4   | Logout User                                  | User / Account    | E2E             | Login + logout flow                                    | tests\e2e\Account_logout.spec.ts |
|✅| E2E-8   | Verify All Products and product detail page  | Products          | E2E             | Check product list and details                         | tests\e2e\Products_details.spec.ts |
|✅| E2E-9   | Search Product                               | Products          | E2E             | Verify search results                                  | tests\e2e\Products_search.spec.ts |
|✅| E2E-12  | Add Products in Cart                         | Products / Cart   | E2E             | Hover, add multiple products, verify prices and totals |  tests\e2e\Cart_add_products.spec.ts        |
|✅| E2E-13  | Verify Product quantity in Cart              | Products / Cart   | E2E             | Increase quantity, verify in cart                      | tests\e2e\Cart_product_quantity.spec.ts         |
|✅| E2E-17  | Remove Products From Cart                    | Products / Cart   | E2E             | Delete products from cart                              |  tests\e2e\Cart_remove_products.spec.ts        |
|✅| E2E-20  | Search Products and Verify Cart After Login  | Products / Cart   | E2E             | Search, add to cart, login, verify persistence         | tests\e2e\Cart_search_persistence.spec.ts |
|✅| 23  | Verify address details in Checkout page      | Orders / Checkout | E2E             | Verify delivery and billing address match registration | tests\e2e\Checkout.spec.ts         |

### Medium Priority

|**Status**| **#**   | **Test Case**                             | **Category**              | **Automation Type** | **Notes**                                                 | **File Name** |
| --- | --- | ------------------------------------- | --------------------- | --------------- | ----------------------------------------------------- | --------- |
|✅| E2E-5   | Register User with existing email     | User / Account        | E2E             | Negative scenario for duplicate email                 |  tests\e2e\Account_create.spec.ts        |
|| 6   | Contact Us Form                       | Contact / Pages       | E2E             | Includes file upload and success message verification |          |
|| 10  | Verify Subscription in Home Page      | Pages / Subscription  | E2E             | Footer subscription; BF-002                           |          |
|| 11  | Verify Subscription in Cart Page      | Pages / Subscription  | E2E             | Footer subscription on cart page; BF-002              |          |
|✅| 18  | View Category Products                | Products / Navigation | E2E             | Check categories and subcategories                    |  tests\e2e\Category_products.spec.ts        |
|✅| 19  | View & Cart Brand Products            | Products / Navigation | E2E             | Check brand filter and product listing                | tests\e2e\Brand_products.spec.ts         |
|✅| 21  | Add review on product                 | Products / Reviews    | E2E             | Verify review submission and success message; BF-001  | tests\e2e\Product_review.spec.ts         |
|| 22  | Add to cart from Recommended items    | Products / Cart       | E2E             | Check recommended items section                       |          |
|| 24  | Download Invoice after purchase order | Orders / Checkout     | E2E             | Verify invoice download after purchase                |          |
|| 27  | Delete Account from UI                | User / Account        | E2E             | Verify delete account flow from navigation menu       |          |

### Low Priority

| #   | Test Case                                                             | Category        | Automation Type | Notes                                    | File Name |
| --- | --------------------------------------------------------------------- | --------------- | --------------- | ---------------------------------------- | --------- |
| 7   | Verify Test Cases Page                                                | Pages / UI           | UI  | Simple navigation check                                   |          |
| 10  | Verify Subscription in Home Page submits real request                 | Pages / Subscription | E2E | Known defect: success shown without network request; BF-002|          |
| 11  | Verify Subscription in Cart Page submits real request                 | Pages / Subscription | E2E | Known defect: success shown without network request; BF-002|          |
| 21  | Verify product review is actually submitted                           | Products / Reviews   | E2E | Known defect: success shown without network request; BF-001|          |
| 24  | Download Invoice after purchase order shows correct total             | Orders / Checkout    | E2E | Known defect: downloaded invoice total is zero        |          |
| 25  | Verify Scroll Up using 'Arrow' button and Scroll Down functionality   | UI / Navigation | UI              | Scroll verification with arrow button    |          |
| 26  | Verify Scroll Up without 'Arrow' button and Scroll Down functionality | UI / Navigation | UI              | Scroll verification without arrow button |          |

### Performance & Monitoring (Chromium Only)

|**Status**| **#** | **Scope** | **Method** | **Description** | **Priority** | **Notes** | **File Name** |
| --- | ----- | --------------- | ---------- | --------------------------------------- | ------------ | ----------------------------- | ----|
|✅| M-1   | Performance & Monitoring   | Playwright + CDP        | Network Throttling & Resource TTFB| **Medium** | Metrics: TTFB, DNS, Total     |tests/monitoring/performance.spec.ts|
|✅| C-1   | Concurrency    | API / Stress | Parallel User Registration (5 threads)      | **Low** | Identification of slow assets |tests/api/auth/concurrency.spec.ts|










