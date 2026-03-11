# GoKwik CRM Automation — Products Module

Playwright + TypeScript automation framework for the GoKwik CRM Admin Panel — Products Module.

---

## Tech Stack

- **Playwright** — browser automation
- **TypeScript** — type-safe test code
- **Page Object Model (POM)** — maintainable, scalable structure

---

## Project Structure

```
gokwik-crm-automation/
├── config/
│   └── env.config.ts          # Base URL, login credentials, merchant ID
├── pages/
│   ├── base.page.ts           # Base POM — shared navigation and wait utilities
│   ├── login.page.ts          # Login flow (email → password → OTP)
│   ├── dashboard.page.ts      # Merchant switching
│   └── products.page.ts       # Products CRUD operations
├── tests/
│   ├── login.spec.ts          # Script 1 — Login flow (3 test cases)
│   ├── products.spec.ts       # Script 2 — Product CRUD (4 test cases)
│   └── additional.spec.ts     # Script 3 — Filter, Pagination, Negative (3 test cases)
├── test-data/
│   └── products.data.ts       # Test data helpers
├── utils/
│   ├── logger.ts              # Structured step-by-step logging
│   └── wait-helper.ts         # Smart wait strategies (no hard waits)
├── .github/workflows/
│   └── playwright.yml         # GitHub Actions CI pipeline
└── playwright.config.ts       # Playwright config — headed, screenshots, video, HTML report
```

---

## Setup & Run

### 1. Clone the repo
```bash
git clone https://github.com/vipulgusain0401/gokwik-crm-automation.git
cd gokwik-crm-automation
```

### 2. Install dependencies
```bash
npm install
npx playwright install chromium
```

### 3. Run all tests
```bash
npm test
```

### 4. Run with browser visible
```bash
npx playwright test --headed
```

### 5. Run a specific script
```bash
npx playwright test tests/login.spec.ts --headed
npx playwright test tests/products.spec.ts --headed
npx playwright test tests/additional.spec.ts --headed
```

### 6. Run products CRUD with custom product name and SKU
```bash
PRODUCT_NAME="MyProduct" PRODUCT_SKU="MySKU001" npx playwright test tests/products.spec.ts --headed
```
> If not provided, defaults to `TestProduct_1` / `TestSKUId_1`

### 7. View HTML report after run
```bash
npx playwright show-report
```

---

## Test Cases

### Script 1 — Login Flow (`login.spec.ts`)

| ID | Test | Type |
|----|------|------|
| TC_LOGIN_01 | Valid email + password + OTP → redirects to dashboard | Positive |
| TC_LOGIN_02 | New/unregistered email → triggers signup flow | Negative |
| TC_LOGIN_03 | Valid email + wrong password → login blocked | Negative |

### Script 2 — Product CRUD (`products.spec.ts`)
> Login and merchant switch happen **once** — session is shared across all 4 tests

| ID | Test | Type |
|----|------|------|
| TC_PRODUCT_01 | Create product with title + SKU → verify in listing | Create |
| TC_PRODUCT_02 | Search product by name → verify on detail page | Read |
| TC_PRODUCT_03 | Clear SKU → validate error → update SKU → verify saved | Update |
| TC_PRODUCT_04 | Select product → delete → confirm modal → verify removed | Delete |

### Script 3 — Additional Scenarios (`additional.spec.ts`)
> Login and merchant switch happen **once** — session is shared across all 3 tests

| ID | Test | Type |
|----|------|------|
| TC_ADD_01 | All / Active / Draft / Archived filter tabs → verify row counts | Filter |
| TC_ADD_02 | Change page size (5 / 20 / 50) → navigate Next → Prev | Pagination |
| TC_ADD_03 | Submit without title → submit without SKU → fill all → submit | Negative |

---

## Framework Design Decisions

| Feature | Implementation |
|---------|---------------|
| Page Object Model | Each page has its own class — no selectors in test files |
| Single login per script | `beforeAll` logs in once, all tests share the browser session |
| No hard waits | Uses `waitFor`, `networkidle`, and smart polling throughout |
| data-test-id locators | Uses stable `data-test-id` attributes from the app — not brittle CSS |
| Screenshots + Video | Captured for every test run, saved to `test-results/` |
| HTML Report | Auto-opens after every run with full step-by-step trace |
| Retry on flakiness | 1 retry locally, 2 retries in CI |
| Custom test data | Pass via env vars: `PRODUCT_NAME` and `PRODUCT_SKU` |
| CI Pipeline | GitHub Actions runs on every push to main |

---

## Environment Details (QA)

| Config | Value |
|--------|-------|
| Dashboard URL | https://qa-mdashboard.dev.gokwik.in |
| Login Email | sandboxuser1@gokwik.co |
| OTP | 123456 (hardcoded) |
| Merchant ID | 19h577u3p4be |

