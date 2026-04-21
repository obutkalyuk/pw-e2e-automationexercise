# Naming Conventions

> Applies to: test files, page objects, helpers, data, utils  
> Stack: Playwright + TypeScript

---

## General Rules

- **kebab-case** for all file names — no exceptions
- **camelCase** for variables, functions, class methods
- **PascalCase** for class names
- No abbreviations unless universally known (`url`, `api`, `id`)
- Name should answer: _what does this do / what is this?_ — not _how_ it does it

---

## File Naming

### Pattern by layer

| Layer | Pattern | Example |
|-------|---------|---------|
| E2E spec | `<feature>-<scenario>.spec.ts` | `cart-add-products.spec.ts` |
| API spec | `<feature>-<scenario>.api.spec.ts` | `account-flow.api.spec.ts` |
| Chain spec | `<feature>-<scenario>.chain.api.spec.ts` | `purchase-happy-path.chain.api.spec.ts` |
| Transport spec | `<feature>.transport.api.spec.ts` | `purchase.transport.api.spec.ts` |
| Monitoring spec | `<feature>-<scenario>.spec.ts` | `account-create-concurrency.spec.ts` |
| Page Object | `<feature>.page.ts` | `cart.page.ts` |
| Section | `<feature>.section.ts` | `cart-table.section.ts` |
| API Helper | `<feature>.api.helper.ts` | `account.api.helper.ts` |
| General util | `<name>.ts` | `fixtures.ts`, `address-formatter.ts` |
| Data | `<entity>.data.ts` | `user.data.ts`, `payment.data.ts` |
| Types | `<entity>.types.ts` | `user.types.ts` |

> **Layer prefix** is carried by the **folder**, not the file name — e.g. `tests/e2e/` means all files inside are E2E, no need to add `e2e` to the file name itself.

---

## Folder Structure

```
tests/
  e2e/              ← UI end-to-end tests
  api/
    auth/           ← auth-related API tests
    catalog/
    chain/          ← multi-step API scenarios
    transport/      ← raw transport-level tests
  monitoring/       ← concurrency, health checks

pages/              ← Page Object classes
  sections/         ← reusable DOM sections

utils/              ← shared utilities and helpers
  api/              ← API-specific helpers

data/               ← test data and schemas
```

---

## Class Naming

```ts
// Page Objects
class CartPage {}
class ProductDetailsPage {}

// Sections
class CartTableSection {}
class ProductCatalogSection {}

// Helpers
class AccountApiHelper {}
class PurchaseTransportHelper {}
```

---

## Method Naming

Methods should read as **actions** or **queries** — use verb-first naming.

```ts
// ✅ Good
addProductToCart()
loginUser()
submitOrder()
getProductById()
assertOrderConfirmed()
waitForOverlayToDisappear()

// ❌ Bad
doLogin()
handleSubmit()
process()
check()
```

### Assertions in helpers

Prefix with `assert` or `verify` — never hide assertions inside generic method names:

```ts
// ✅
assertProductInCart(productName: string)
verifyOrderStatus(expected: string)

// ❌
checkCart()     // unclear what "check" means
validate()      // too vague
```

---

## Locator Naming

Locators are **nouns** — they describe the element, not the action:

```ts
// ✅ Good
readonly submitButton = this.page.getByRole('button', { name: 'Submit' });
readonly productCard = this.page.locator('[data-testid="product-card"]');
readonly cartItemRow = this.page.locator('.cart_info tbody tr');
readonly errorMessage = this.page.getByRole('alert');

// ❌ Bad
readonly btn = ...
readonly el = ...
readonly item1 = ...
readonly clickHere = ...
```

---

## Test Description Naming

Test descriptions should describe **behavior**, not implementation:

```ts
// ✅ Good
test('should add product to cart from search results')
test('should retain cart contents after logout and login')
test('should reject payment with expired card')

// ❌ Bad
test('cart test')
test('add product')
test('test login form')
```

`describe` blocks group by **feature** or **user flow**:

```ts
describe('Cart', () => {
  describe('Adding products', () => {
    test('should add single product from product page')
    test('should add multiple products from search results')
  })
})
```

---

## Variables

```ts
// ✅ Good
const productName = 'Blue Top';
const expectedTotal = 150;
const isLoggedIn = true;

// ❌ Bad
const pn = 'Blue Top';
const x = 150;
const flag = true;
```

Boolean variables: prefix with `is`, `has`, `should`:

```ts
const isVisible = await element.isVisible();
const hasError = response.status !== 200;
```

---

## TypeScript

- No `any` — use proper types or `unknown` + type guard
- API responses: always type with an interface or Zod schema
- Page Object constructor: always typed `Page` from `@playwright/test`

```ts
// ✅
constructor(private readonly page: Page) {}

// ❌
constructor(private page: any) {}
```

---

## What Goes Where

| Thing | Where |
|-------|-------|
| Reusable locator logic | Page Object or Section |
| Multi-step UI flow | Page Object method |
| API request/response | `utils/api/<feature>.api.helper.ts` |
| Test data (static) | `data/<entity>.data.ts` |
| Fixtures (setup/teardown) | `utils/fixtures.ts` |
| One-off test data | inside the test itself |
| Shared assertion logic | helper method with `assert` prefix |

---

## When to Create a Section

Extract to `pages/sections/` when the DOM block:

- appears on **more than one page**, OR
- has its **own behavior** (methods, not just locators), OR
- has meaningful **internal structure** (table rows, card grid, etc.)

Do **not** extract:
- a single button or input
- a block used in only one place with no reuse potential

---

## Helper File Responsibility

One helper = one responsibility. If a file does more than one of these — split it:

- HTTP request/response
- HTML parsing
- Assertions
- Flow orchestration (chaining steps)

Signal to split: file exceeds ~150 lines or has imports from 3+ unrelated domains.