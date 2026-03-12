# Automation Test Cases Plan

## API Tests
### Critical Priority (Smoke API)

|**Status**| **#** | **API Endpoint** | **Method** | **Description**                 | **Priority** | **Notes**                 | **File Name** |
|----------| ----- | ---------------- | ---------- | ------------------------------- | ------------ | ------------------------- | --------------|
|✅| API-1 | `/createAccount` | POST       | Create user account             | **Critical** | Base for all hybrid tests |tests\api\auth\account_flow.spec.ts|
|✅| API-2 | `/deleteAccount` | DELETE     | Delete user account             | **Critical** | Cleanup                   |tests\api\auth\account_flow.spec.ts|
|✅| API-3 | `/verifyLogin`   | POST       | Verify login with valid details | **Critical** | authorization check       |tests\api\auth\account_flow.spec.ts|
### High Priority (Regression API)

|**Status**| **#** | **API Endpoint**        | **Method** | **Description**         | **Priority** | **Notes**               | **File Name** |
|------| ----- | ----------------------- | ---------- | ----------------------- | ------------ | ----------------------- |---------------|
|| 4     | `/productsList`         | GET        | Get all products list   | **High**     | check  JSON products    ||
|| 5     | `/searchProduct`        | POST       | Search for a product    | **High**     | search logic validation ||
|✅| API-6 | `/getUserDetailByEmail` | GET        | Get user account detail | **High**     |                         |tests\api\auth\account_flow.spec.ts|

### Medium/Low Priority (Extended Validation)

_Negative cases and additional methods_

|**Status**| **#** | **API Endpoint** | **Method** | **Description**             | **Priority** | **Notes**                     |**File Name**|
| -------- | ----- | ---------------- | ---------- | --------------------------- | ------------ | ----------------------------- |-------------|
|✅| API-7 | `/verifyLogin`   | POST       | Login with invalid details  | **Medium**   | Negative: error codes check   |tests\api\auth\account_flow.spec.ts|
|| 8     | `/brandsList`    | GET        | Get all brands list         | **Medium**   | brand list verification       ||
|| 9     | `/updateAccount` | PUT        | Update user account details | **Medium**   | update profile  verification  ||

## E2E and  Hybrid tests
### Critical Priority

|**Status**| **#**   | **Test Case**                                  | **Category**      | **Automation Type** | **Notes**                                                         | **File Name** | 
| --- | --- | :----------------------------------------- | -------------- | --------------- | ------------------------------------------------------------- | --------- | 
|| E2E-1   | Register User                              | User / Account | E2E             | Full sign up + delete account, can optimize via API for setup |  tests\e2e\Account.spec.ts         |
|| E2E-2   | Login User with correct email and password | User / Account | E2E             | Include delete account after login                            | tests\e2e\Account.spec.ts          |
|| 14  | Place Order: Register while Checkout       | Orders         | E2E             | Full checkout flow with account creation                      |           | 
|| 15  | Place Order: Register before Checkout      | Orders         | E2E (Hybrid)    | Create account first, then checkout                           |           |
|| 16  | Place Order: Login before Checkout         | Orders         | E2E (Hybrid)    | Login first, then checkout                                    |           | 


### High Priority

|**Status**| **#**   | **Test Case**                                    | **Category**         | **Automation Type** | **Notes**                                                  | **File Name** |
| ---- | --- | :------------------------------------------- | ----------------- | --------------- | ------------------------------------------------------ | --------- |
|| 3   | Login User with incorrect email and password | User / Account    | E2E             | Negative scenario                                      |           |
|| 4   | Logout User                                  | User / Account    | E2E             | Login + logout flow                                    |           |
|| 8   | Verify All Products and product detail page  | Products          | E2E             | Check product list and details                         |           |
|| 9   | Search Product                               | Products          | E2E             | Verify search results                                  |           |
|| 12  | Add Products in Cart                         | Products / Cart   | E2E             | Hover, add multiple products, verify prices and totals |           |
|| 13  | Verify Product quantity in Cart              | Products / Cart   | E2E             | Increase quantity, verify in cart                      |           |
|| 17  | Remove Products From Cart                    | Products / Cart   | E2E             | Delete products from cart                              |           |
|| 20  | Search Products and Verify Cart After Login  | Products / Cart   | E2E             | Search, add to cart, login, verify persistence         |           |
|| 23  | Verify address details in Checkout page      | Orders / Checkout | E2E             | Verify delivery and billing address match registration |           |

### Medium Priority


|**Status**| **#**   | **Test Case**                             | **Category**              | **Automation Type** | **Notes**                                                 | **File Name** |
| --- | --- | ------------------------------------- | --------------------- | --------------- | ----------------------------------------------------- | --------- |
|| 5   | Register User with existing email     | User / Account        | E2E             | Negative scenario for duplicate email                 |           |
|| 6   | Contact Us Form                       | Contact / Pages       | E2E             | Includes file upload and success message verification |           |
|| 10  | Verify Subscription in Home Page      | Pages / Subscription  | E2E             | Footer subscription                                   |           |
|| 11  | Verify Subscription in Cart Page      | Pages / Subscription  | E2E             | Footer subscription on cart page                      |           |
|| 18  | View Category Products                | Products / Navigation | E2E             | Check categories and subcategories                    |           |
|| 19  | View & Cart Brand Products            | Products / Navigation | E2E             | Check brand filter and product listing                |           |
|| 21  | Add review on product                 | Products / Reviews    | E2E             | Verify review submission and success message          |           |
|| 22  | Add to cart from Recommended items    | Products / Cart       | E2E             | Check recommended items section                       |           |
|| 24  | Download Invoice after purchase order | Orders / Checkout     | E2E             | Verify invoice download after purchase                |           |

### Low Priority

| #   | Test Case                                                             | Category        | Automation Type | Notes                                    | File Name |
| --- | --------------------------------------------------------------------- | --------------- | --------------- | ---------------------------------------- | --------- |
| 7   | Verify Test Cases Page                                                | Pages / UI      | UI              | Simple navigation check                  |           |
| 25  | Verify Scroll Up using 'Arrow' button and Scroll Down functionality   | UI / Navigation | UI              | Scroll verification with arrow button    |           |
| 26  | Verify Scroll Up without 'Arrow' button and Scroll Down functionality | UI / Navigation | UI              | Scroll verification without arrow button |           |

### Performance & Monitoring (Chromium Only)

| **#** | **Scope** | **Method** | **Description** | **Priority** | **Notes** | **File Name** |
| ----- | --------------- | ---------- | --------------------------------------- | ------------ | ----------------------------- | ----|
| M-1   | `Performance`   | CDP        | Network Throttling (Slow 3G emulation)  | **Medium** | Metrics: TTFB, DNS, Total     ||
| M-2   | `Monitoring`    | Listeners  | Resource TTFB tracking (XHR/Fetch)      | **Low** | Identification of slow assets ||