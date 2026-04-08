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

## Confirmed Requests

| ID | Flow | URL / Action | Method | Source | Response type | Recommended test type | Priority | Notes |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| RQ-001 | Authentication | `/api/verifyLogin` with valid credentials | `POST` | Documented API | `message-based response` | `Message contract` | High | Valid login scenario. |
| RQ-002 | Authentication | `/api/verifyLogin` with missing parameter | `POST` | Documented API | `message-based response` | `Message contract` | Medium | Missing email/password scenario. |
| RQ-003 | Authentication | `/api/verifyLogin` | `DELETE` | Documented API | `message-based response` | `Message contract` | Medium | Unsupported method scenario. |
| RQ-004 | Authentication | `/api/verifyLogin` with invalid credentials | `POST` | Documented API | `message-based response` | `Message contract` | High | Site behavior may still return HTTP 200 while business response code indicates failure. |
| RQ-005 | Authentication | `/login` | `POST` | Observed web flow | `HTML redirect` | `Transport/document contract` | High | Observed `302` redirect to `/`. |
| RQ-006 | Authentication | `/logout` | `GET` | Observed web flow | `HTML redirect` | `Transport/document contract` | Medium | Observed `302` redirect to `/login`. |
| RQ-007 | Account lifecycle | `/api/createAccount` | `POST` | Documented API | `message-based response` | `Message contract` | High | Account creation API. |
| RQ-008 | Account lifecycle | `/api/deleteAccount` | `DELETE` | Documented API | `message-based response` | `Message contract` | High | Site behavior may still return HTTP 200 for negative outcomes. |
| RQ-009 | Account lifecycle | `/api/updateAccount` | `PUT` | Documented API | `message-based response` | `Message contract` | High | Account update API. |
| RQ-010 | Account lifecycle | `/api/getUserDetailByEmail` | `GET` | Documented API | `JSON` | `Schema contract` | High | User details contract validation. |
| RQ-011 | Account lifecycle | `/delete_account` | `GET` | Observed web flow | `HTML document` | `Transport/document contract` | Medium | UI account deletion flow. |
| RQ-012 | Catalog | `/api/productsList` | `GET` | Documented API | `JSON` | `Schema contract` | High | Suitable for Zod schema validation. |
| RQ-013 | Catalog | `/api/productsList` | `POST` | Documented API | `message-based response` | `Message contract` | Medium | Verify actual transport behavior together with business response code/message. |
| RQ-014 | Catalog | `/api/brandsList` | `GET` | Documented API | `JSON` | `Schema contract` | High | Suitable for Zod schema validation. |
| RQ-015 | Catalog | `/api/brandsList` | `PUT` | Documented API | `message-based response` | `Message contract` | Medium | Unsupported method scenario. |
| RQ-016 | Catalog | `/api/searchProduct` | `POST` | Documented API | `JSON` | `Schema contract` | High | Search results contract validation. |
| RQ-017 | Catalog | `/api/searchProduct` without `search_product` | `POST` | Documented API | `message-based response` | `Message contract` | Medium | Missing parameter scenario. |
| RQ-018 | Cart | `/add_to_cart/{product_id}` | `GET` | Observed web flow | `HTML` | `Transport/document contract` | High | Useful shortcut in hybrid automation. |
| RQ-019 | Cart | `/view_cart` | `GET` | Observed web flow | `HTML document` | `Transport/document contract` | High | Cart page view. |
| RQ-020 | Cart | `/delete_cart/{product_id}` | `GET` | Observed web flow | `HTML` | `Transport/document contract` | High | Removes whole product from cart. |
| RQ-021 | Checkout | `/checkout` | `GET` | Observed web flow | `HTML document` | `Transport/document contract` | High | Checkout page open. |
| RQ-022 | Payment | `/payment` | `GET` | Observed web flow | `HTML document` | `Transport/document contract` | High | Payment page open. |
| RQ-023 | Payment | `/payment` | `POST` | Observed web flow | `HTML redirect` | `Transport/document contract` | High | Observed `302` redirect to `/payment_done/{orderId}`. Requires valid session and CSRF token. |
| RQ-024 | Payment | `/payment_done/{orderId}` | `GET` | Observed web flow | `HTML document` | `Transport/document contract` | High | Useful for order completion and extracting order identifier. |
| RQ-025 | Payment | `/download_invoice/{orderId}` | `GET` | Observed web flow | `text/plain` | `Transport/document contract` | Low | Endpoint exists. Download behavior and content validation require dedicated checks. Known defect observed: invoice total amount returned as `0`. |

## Broken Or Non-Submitting UI Flows

| ID | Flow | URL / Action | UI behavior | Network activity | Recommended test type | Priority | Notes |
| --- | --- | --- | --- | --- | --- | --- | --- |
| BF-001 | Product details | Review submission | Success message is shown and fields are cleared | None observed | `UI-only / broken flow` | Medium | Functional bug. UI confirms successful submission without sending any request. |
| BF-002 | Footer subscription | Newsletter subscription | Success message is shown | None observed | `UI-only / broken flow` | Medium | Functional bug. UI confirms successful subscription without sending any request. |

## Open Questions

- Determine whether any documented message-based API endpoints return JSON bodies consistently enough for lightweight schema validation.
- Confirm whether invalid payment submission is blocked only by client-side validation or can also reach a transport-level failure flow.
- Decide whether UI account creation/update/delete flows need separate web-flow coverage in addition to existing API tests.
