# GoKwik CRM Automation — Products Module

Playwright + TypeScript automation framework for the GoKwik CRM Admin Panel — Products Module.

---

## Tech Stack

| Tool | Purpose |
|------|---------|
| Playwright | Browser automation |
| TypeScript | Type-safe test code |
| Page Object Model | Maintainable, scalable structure |
| GitHub Actions | CI pipeline |

---

## Project Structure

```
gokwik-crm-automation/
├── config/
│   └── env.config.ts          # Base URL, credentials, merchant ID
├── pages/
│   ├── base.page.ts           # Base POM — shared utils, auto chat-popup dismissal
│   ├── login.page.ts          # 3-step login (email → password → OTP)
│   ├── dashboard.page.ts      # Merchant switching
│   └── products.page.ts       # Products CRUD operations
├── tests/
│   ├── login.spec.ts          # Script 1 — Login flow (3 tests)
│   ├── products.spec.ts       # Script 2 — Product CRUD E2E (4 tests)
│   └── additional.spec.ts     # Script 3 — Pagination + Negative (2 tests)
├── test-data/
│   └── products.data.ts       # Test data helpers
├── utils/
│   ├── logger.ts              # Structured step-by-step logging
│   ├── wait-helper.ts         # Smart wait strategies (no hard waits)
│   └── dismiss-chat.ts        # AI chat popup dismissal utility
├── .github/workflows/
│   └── playwright.yml         # GitHub Actions CI pipeline
└── playwright.config.ts       # Playwright config
```

---

## Setup & Run

### 1. Clone and install
```bash
git clone https://github.com/vipulgusain0401/gokwik-crm-automation.git
cd gokwik-crm-automation
npm install
npx playwright install chromium
```

### 2. Run all tests
```bash
npx playwright test --headed
```

### 3. Run individual scripts
```bash
npx playwright test tests/login.spec.ts --headed
npx playwright test tests/products.spec.ts --headed
npx playwright test tests/additional.spec.ts --headed
```

### 4. Run with custom product name and SKU
```bash
PRODUCT_NAME="MyProduct" PRODUCT_SKU="MySKU001" npx playwright test tests/products.spec.ts --headed
```
> Defaults to `TestProduct_1` / `TestSKUId_1` if not provided

### 5. View HTML report
```bash
npx playwright show-report
```

---

## Test Cases

### Script 1 — Login (`login.spec.ts`)

| ID | Description | Type |
|----|-------------|------|
| TC_LOGIN_01 | Valid email + password + OTP → redirects to dashboard | Positive |
| TC_LOGIN_02 | Unregistered email → signup flow triggered | Negative |
| TC_LOGIN_03 | Valid email + wrong password → login blocked | Negative |

### Script 2 — Product CRUD (`products.spec.ts`)
> Single login in `beforeAll` — all 4 tests share one session (E2E flow)

| ID | Description | Type |
|----|-------------|------|
| TC_PRODUCT_01 | Create product with title + SKU → verify in listing + Active status | Create |
| TC_PRODUCT_02 | Search by name → verify name, status, variant count | Read |
| TC_PRODUCT_03 | Update product name → verify updated in listing, old name gone | Update |
| TC_PRODUCT_04 | Delete product → confirm modal → toast → search returns no results | Delete |

### Script 3 — Additional (`additional.spec.ts`)
> Single login in `beforeAll` — session shared across both tests

| ID | Description | Type |
|----|-------------|------|
| TC_ADD_01 | Change page size 5/20/50 → verify row counts → navigate next page | Pagination |
| TC_ADD_02 | Submit with empty SKU → validate error → fill SKU → error clears | Negative |

---

## Framework Checklist

### Mandatory ✅
| Feature | Implementation |
|---------|---------------|
| Page Object Model | Each page has its own class — no selectors in test files |
| Reusable utilities | `logger.ts`, `wait-helper.ts`, `dismiss-chat.ts` |
| Environment config | `config/env.config.ts` — URL, credentials, merchant ID |
| Folder structure | `pages / tests / utils / config / test-data` |
| Readable test naming | `TC_LOGIN_01`, `TC_PRODUCT_01` etc. with descriptive titles |
| Meaningful assertions | Every `expect()` has a failure message |

### Good to Have ✅
| Feature | Implementation |
|---------|---------------|
| Test data separation | `test-data/products.data.ts` + env vars (`PRODUCT_NAME`, `PRODUCT_SKU`) |
| Logging | Step-by-step structured logging via `utils/logger.ts` |
| Retry mechanism | `retries: 1` locally, `2` in CI |
| Screenshot on failure | `screenshot: 'on'` — saved to `test-results/` |
| HTML reporting | Auto-opens after every run |
| CI pipeline | GitHub Actions — `.github/workflows/playwright.yml` |

---

## Design Decisions

**Single login per script** — `beforeAll` logs in once, all tests in the script share the browser session. No repeated logins within a script.

**Sequential execution** — `workers: 1` — all scripts share the same QA account and merchant. Parallel execution would require separate credentials per script.

**data-test-id locators** — uses stable `data-test-id` attributes throughout. No brittle XPaths or CSS class selectors.

**Chat popup handling** — the app has an AI chat widget that appears intermittently on post-login pages. `BasePage` registers a `page.on('load')` listener that automatically dismisses it on every navigation, preventing it from intercepting keyboard input.

**Update tests name, not SKU** — SKU is only visible on the product detail page. Product name appears in the listing table, making it the right field to verify update end-to-end.

---

## Environment (QA)

| Config | Value |
|--------|-------|
| Dashboard URL | https://qa-mdashboard.dev.gokwik.in |
| Login email | sandboxuser1@gokwik.co |
| OTP | 123456 |
| Merchant ID | 19h577u3p4be |
