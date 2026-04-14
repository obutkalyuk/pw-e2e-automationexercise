# API / Request Inventory

## Purpose

This document captures observed API and web requests used by AutomationExercise, along with their actual behavior and the recommended testing approach.

It is a technical working document for QA research and automation design.

## Test Type Legend

- `Schema contract`: structured JSON response, suitable for schema validation
- `Message contract`: response is mainly code/message based
- `Transport/document contract`: HTML, redirect, download, content-type, or document flow validation
- `Hybrid`: request is useful in automation setup or combined API/UI checks
- `UI-only / broken flow`: UI interaction exists, but no network request is sent

## Coverage Status Legend

- `Covered` Covered by direct automated test(s) at the recommended or closely related layer
- `Indirect` Covered indirectly or only at a broader adjacent layer
- `Planned` Planned in the test plan but not automated yet

## Confirmed Requests

| Status | ID | Flow | URL / Action | Method | Source | Response type | Recommended test type | Priority | Covered by | Notes |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Covered | RQ-001 | Authentication | `/api/verifyLogin` with valid credentials | `POST` | Documented API | `message-based response` | `Message contract` | High | `API-3` | Valid login scenario. |
| Covered | RQ-002 | Authentication | `/api/verifyLogin` with missing parameter | `POST` | Documented API | `message-based response` | `Message contract` | Medium | `API-14` | Missing email/password scenario. |
| Covered | RQ-003 | Authentication | `/api/verifyLogin` | `DELETE` | Documented API | `message-based response` | `Message contract` | Medium | `API-15` | Unsupported method scenario. |
| Covered | RQ-004 | Authentication | `/api/verifyLogin` with invalid credentials | `POST` | Documented API | `message-based response` | `Message contract` | High | `API-7` | Site behavior may still return HTTP 200 while business response code indicates failure. |
| Covered | RQ-005 | Authentication | `/login` | `POST` | Observed web flow | `HTML redirect` | `Transport/document contract` | High | `TR-1`, `API-18` | Observed `302` redirect to `/`. |
| Covered | RQ-006 | Authentication | `/logout` | `GET` | Observed web flow | `HTML redirect` | `Transport/document contract` | Medium | `E2E-4`, `TR-7` | Observed `302` redirect to `/login`. No dedicated transport check yet. |
| Covered | RQ-007 | Account lifecycle | `/api/createAccount` | `POST` | Documented API | `message-based response` | `Message contract` | High | `API-1`, `API-16` | Account creation API. |
| Covered | RQ-008 | Account lifecycle | `/api/deleteAccount` | `DELETE` | Documented API | `message-based response` | `Message contract` | High | `API-2`, `API-17` | Site behavior may still return HTTP 200 for negative outcomes. |
| Covered | RQ-009 | Account lifecycle | `/api/updateAccount` | `PUT` | Documented API | `message-based response` | `Message contract` | High | `API-9`, `API-10` | Account update API. |
| Covered | RQ-010 | Account lifecycle | `/api/getUserDetailByEmail` | `GET` | Documented API | `JSON` | `Schema contract` | High | `API-6` | User details contract validation via Zod schema. |
| Planned | RQ-011 | Account lifecycle | `/delete_account` | `GET` | Observed web flow | `HTML document` | `Transport/document contract` | Medium | `E2E-27` (planned) | UI account deletion flow. |
| Covered | RQ-012 | Catalog | `/api/productsList` | `GET` | Documented API | `JSON` | `Schema contract` | High | `API-4` | Product list contract validated with Zod schema. |
| Covered | RQ-013 | Catalog | `/api/productsList` | `POST` | Documented API | `message-based response` | `Message contract` | Medium | `API-11` | Verify actual transport behavior together with business response code/message. |
| Covered | RQ-014 | Catalog | `/api/brandsList` | `GET` | Documented API | `JSON` | `Schema contract` | High | `API-8` | Brand list contract validated with Zod schema. |
| Covered | RQ-015 | Catalog | `/api/brandsList` | `PUT` | Documented API | `message-based response` | `Message contract` | Medium | `API-12` | Unsupported method scenario. |
| Covered | RQ-016 | Catalog | `/api/searchProduct` | `POST` | Documented API | `JSON` | `Schema contract` | High | `API-5` | Search results contract validated with Zod schema. |
| Covered | RQ-017 | Catalog | `/api/searchProduct` without `search_product` | `POST` | Documented API | `message-based response` | `Message contract` | Medium | `API-13` | Missing parameter scenario. |
| Covered | RQ-018 | Cart | `/add_to_cart/{product_id}` | `GET` | Observed web flow | `HTML` | `Transport/document contract` | High | `TR-2`, `API-18` | Useful shortcut in hybrid automation. |
| Covered | RQ-019 | Cart | `/view_cart` | `GET` | Observed web flow | `HTML document` | `Transport/document contract` | High | `E2E-12`, `E2E-13`, `E2E-17`, `E2E-20`, `TR-8`, `TR-9`| Cart page view. No dedicated transport check yet. |
| Covered | RQ-020 | Cart | `/delete_cart/{product_id}` | `GET` | Observed web flow | `HTML` | `Transport/document contract` | High | `E2E-17`, `TR-9`| Removes whole product from cart. No dedicated transport check yet. |
| Covered | RQ-021 | Checkout | `/checkout` | `GET` | Observed web flow | `HTML document` | `Transport/document contract` | High | `TR-3`, `API-18` | Checkout page open. |
| Covered | RQ-022 | Payment | `/payment` | `GET` | Observed web flow | `HTML document` | `Transport/document contract` | High | `TR-4`, `API-18` | Payment page open. |
| Covered | RQ-023 | Payment | `/payment` | `POST` | Observed web flow | `HTML redirect` | `Transport/document contract` | High | `TR-5` | Observed `302` redirect to `/payment_done/{value}`. Requires valid session and CSRF token. |
| Covered | RQ-024 | Payment | `/payment_done/{value}` | `GET` | Observed web flow | `HTML document` | `Transport/document contract` | High | `TR-5`, `API-18` | Useful for order completion artifact checks. Current research shows `{value}` should not be assumed to be a unique order identifier. Known defect `#24`: arbitrary integer values can still render the generic success page. |
| Covered | RQ-025 | Payment | `/download_invoice/{value}` | `GET` | Observed web flow | `text/plain` | `Transport/document contract` | Low | `TR-6`, `E2E-24` (planned), `API-25`, `TR-16` | Endpoint exists. Download behavior and content validation require dedicated checks. Valid purchase flow amount matched checkout in API-25/TR-16; earlier zero-like observations likely came from replay-created artifacts or from arbitrary amount-based success artifacts related to defect `#24`. |

## Broken Or Non-Submitting UI Flows

| Status | ID | Flow | URL / Action | UI behavior | Network activity | Recommended test type | Priority | Covered by | Notes |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Indirect | BF-001 | Product details | Review submission | Success message is shown and fields are cleared | None observed | `UI-only / broken flow` | Medium | `E2E-21`, `Low-21` (planned) | Functional bug. UI confirms successful submission without sending any request. |
| Planned | BF-002 | Footer subscription | Newsletter subscription | Success message is shown | None observed | `UI-only / broken flow` | Medium | `E2E-10` (planned), `E2E-11` (planned), `Low-10` (planned), `Low-11` (planned) | Functional bug. UI confirms successful subscription without sending any request. |

## Open Questions

- Determine whether any documented message-based API endpoints return JSON bodies consistently enough for lightweight schema validation.
- Confirm whether invalid payment submission is blocked only by client-side validation or can also reach a transport-level failure flow.
- Decide whether UI account creation/update/delete flows need separate web-flow coverage in addition to existing API tests.

## Security / Exposure Notes

- Known defect `#25`: public Django debug pages can expose internal URL patterns and framework details, including `payment_done/<int:overall_amount>` and `download_invoice/<int:overall_amount>`.
