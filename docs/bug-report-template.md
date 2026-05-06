# Bug Report Template

## [Short title: what is broken, where, and under what condition]

**Severity:** Critical / High / Medium / Low  
**Layer:** API / Web flow / UI  
**Area:** Checkout / Payment / Auth / Contact / ...  
**Observed:** YYYY-MM-DD

---

### Preconditions

- Session: anonymous / authenticated / ...
- State: cart empty / product added / ...
- Data: any valid email / specific account / ...

---

### Steps to Reproduce

1. Step 1
2. Step 2
3. Step 3

---

### Actual Result

> Describe what actually happens. Include HTTP status, visible UI state, and network behavior where relevant.

### Expected Result

> Describe what should happen. Be specific: expected HTTP status, redirect target, or UI state after the action.

---

### Impact / Risk

- Impact point 1
- Impact point 2 (security / privacy / data loss / regulatory)
- Impact point 3

---

### Recommendation

Specific suggestion: what to fix, what validation to add, whether additional protection is needed.

---

### Coverage

`TEST-ID-1` `TEST-ID-2`

Brief note on which test cases or transport checks document this defect, and whether a dedicated negative/xfail test is still missing.

---

### Evidence

Network trace, screenshot, debug page output, or link to a related GitHub issue if available.

---

## Severity Guide

| Severity     | When to use                                                                                   |
| ------------ | --------------------------------------------------------------------------------------------- |
| **Critical** | Blocks a core user flow (purchase, auth, account); security vulnerability; data loss at scale |
| **High**     | Feature produces incorrect output or silently fails; user is misled; no workaround            |
| **Medium**   | Degraded behavior with a workaround; edge case with moderate impact                           |
| **Low**      | Cosmetic issue, minor UX inconsistency, or low-traffic edge case                              |

## Layer Guide

| Layer      | When to use                                                                                                      |
| ---------- | ---------------------------------------------------------------------------------------------------------------- |
| `API`      | Defect is in the API contract: wrong status code, missing or incorrect field, unexpected response message        |
| `Web flow` | Defect is in redirect, session, cookie, CSRF, or download behavior: observable at the HTTP level without browser |
| `UI`       | Defect is visible in the browser: wrong state shown, missing access gate, broken or misleading feedback          |

---

## Example

## `/checkout` is accessible to anonymous users without a login gate

**Severity:** High  
**Layer:** Web flow  
**Area:** Checkout  
**Observed:** 2026-04-12

---

### Preconditions

- Session: anonymous (no authenticated session)
- State: at least one product added to cart

---

### Steps to Reproduce

1. Start a new anonymous session.
2. Add any product to cart via `/add_to_cart/{product_id}`.
3. Send a `GET` request to `/checkout` directly.

---

### Actual Result

> Server returns HTTP 200. Checkout HTML is rendered. Address Details and Review Your Order markers are visible. No login gate is enforced.

### Expected Result

> Server returns HTTP 302 to `/login`, or renders a login gate before any checkout content is shown. Anonymous users should not be able to reach an active checkout state.

---

### Impact / Risk

- Breaks checkout access control.
- Exposes an authenticated purchase step to an anonymous session.
- Enables partial purchase-flow exploration without credentials.

---

### Recommendation

Enforce session authentication check before rendering the checkout page. Any unauthenticated request to `/checkout` should redirect to `/login`. Verify the same guard is applied at the transport layer, not only in UI navigation.

---

### Coverage

`API-19` `TR-10`

Transport check `TR-10` and chain test `API-19` document this defect as a known-defect assertion. No separate xfail is needed: tests already assert the broken behavior explicitly.

---

### Evidence

Confirmed via direct `GET /checkout` with an anonymous session cookie. No redirect observed. Related: defect `#17` in GitHub Issues.
