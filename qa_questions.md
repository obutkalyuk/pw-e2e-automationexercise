## 📋 QA Questionnaire for Development Team

|**#**|**Category**|**Question (Description & Impact)**|**Developer Response / Action Item**|
|---|---|---|---|
|**1**|**API**|**Rate Limiting:** Are there any limits on the number of requests per IP? This is critical for running Playwright tests in parallel.||
|**2**|**API**|**Independent Cleanup:** Does the `DELETE` user API work without prior UI authorization? We need this for fast post-test data cleanup.|Answer: Yes, it works via API by passing email and password as form data. Issue Found: Missing/invalid params return "Fake 200". https://github.com/obutkalyuk/pw-e2e-automationexercise/issues/1|
|**3**|**API**|**Error Schema:** What is the expected JSON structure for error responses (400/404/405/500)? Currently, only codes are listed without Error Object details.||
|**4**|**API**|**HTTP Status Standards:** Is there a plan to move from "Fake 200 OK" to standard REST status codes (4xx/5xx) for business errors?|https://github.com/obutkalyuk/pw-e2e-automationexercise/issues/1|
|**5**|**API**|**Response Consistency:** Is there a universal response schema (e.g., is it always `responseCode`, or can it be `status` or `code`)?||
|**6**|**API**|**Data Synchronization:** Are API and UI using the same DB? If a user is created via API, will they be visible in the UI immediately (any Cache/Lag)?||
|**7**|**API**|**Field Naming Mismatch:** Why do field names differ between UI (`email_address`) and API (`email`)? This doubles the effort for test data maintenance.|https://github.com/obutkalyuk/pw-e2e-automationexercise/issues/2|
|**8**|**UI**|**Stable Locators:** Can we implement `data-qa` or `data-testid` attributes for all key components to ensure selector stability?||
|**9**|**UI**|**State Injection:** Can we inject `StorageState` (cookies/tokens) directly to skip Login pages in specific E2E scenarios?||
|**10**|**UI**|**Mixed Content Issues:** Why are Google fonts and styles blocked (`mixed-content`)? Loading `http` resources over `https` is a security/UX risk.||
|**11**|**UI**|**Third-party Scripts:** Why are there so many legacy jQuery scripts (prettyPhoto, etc.)? These are potential points of failure for automation.||
|**12**|**Data**|**Password Policy:** Are there specific requirements for password length or special characters? This isn't documented.||
|**13**|**Data**|**Cascade Deletion:** When a user is deleted, is their order history also wiped, or do orphaned records remain in the database?||
|**14**|**Infra**|**Test Environment:** Can we disable ads (`adsbygoogle`) in the testing environment to reduce network noise and improve stability?|Workaround Implemented: Added handleConsent() logic to bypass the "Consent" overlay that was blocking the UI.|
|**15**|**Infra**|**Timeout Handling:** How are DB timeouts handled? Will we get an internal "Fake 200" error or a standard `504 Gateway Timeout`?|
### 📝 Strategic Observations & Risks (For the QA Lead/PO)


- **Risk:** Missing `data-qa` attributes on several UI components (e.g., review success messages) makes selectors brittle and increases maintenance costs.
    
- **Observation:** Significant redundancy in original Test Cases. Optimization was performed to reduce the test suite execution time by ~40% without losing coverage.
    
- **Observation:** The API documentation shows `GET` method errors but lacks successful `POST` request/response examples, leading to "trial and error" development.
    
- **Solution Implemented:** To mitigate the "Fake 200 OK" architecture, a custom assertion layer has been integrated into `ApiClient.ts` to validate internal business logic codes.