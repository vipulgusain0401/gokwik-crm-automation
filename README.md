# GoKwik CRM Automation — Products Module

Playwright + TypeScript automation for the GoKwik CRM Admin Panel — Products Module CRUD operations.

---

## Tech Stack

- **Playwright** — browser automation
- **TypeScript** — type-safe tests
- **Page Object Model** — selectors and actions live in page classes, not in test files
- **GitHub Actions** — CI on every push

---

## Project Structure

```
gokwik-crm-automation/
├── config/
│   └── env.config.ts          # URL, credentials, merchant ID
├── pages/
│   ├── base.page.ts           # Shared utilities + auto chat-popup dismissal
│   ├── login.page.ts          # 3-step login flow
│   ├── dashboard.page.ts      # Merchant switching
│   └── products.page.ts       # All product actions
├── tests/
│   ├── login.spec.ts          # Login scenarios
│   ├── products.spec.ts       # CRUD — create, read, update, delete
│   └── additional.spec.ts     # Pagination and negative validation
├── utils/
│   ├── logger.ts              # Step-by-step logging
│   ├── wait-helper.ts         # Reusable wait strategies
│   └── dismiss-chat.ts        # Closes AI chat widget if it appears
├── test-data/
│   └── products.data.ts
├── .github/workflows/
│   └── playwright.yml
└── playwright.config.ts
```

---

## Setup

```bash
git clone https://github.com/vipulgusain0401/gokwik-crm-automation.git
cd gokwik-crm-automation
npm install
npx playwright install chromium
```

---

## Running Tests

```bash
# Run everything
npx playwright test --headed

# Run a specific script
npx playwright test tests/products.spec.ts --headed
npx playwright test tests/login.spec.ts --headed
npx playwright test tests/additional.spec.ts --headed

# Pass custom product name and SKU
PRODUCT_NAME="MyProduct" PRODUCT_SKU="MySKU001" npx playwright test tests/products.spec.ts --headed

# Open the HTML report
npx playwright show-report
```

---

## Test Coverage

**Login** — valid credentials, unregistered email, wrong password

**Product CRUD** — all 4 tests run in a single browser session (one login, shared context):
- Create product → verify it appears in listing with Active status
- Search by name → verify name, status, and variant count
- Update product name → confirm updated name shows in listing
- Delete product → confirm modal → check toast → search returns no results

**Bonus** — page size changes (5 / 20 / 50) with next page navigation, and empty SKU validation with error message

---

## Framework Highlights

Tests use `data-test-id` attributes for locators — these are stable and don't break when styles or layout change.

Each script logs in once via `beforeAll` and shares the browser session across all tests in that file. No repeated logins mid-suite.

Product names get a timestamp suffix on every run (`TestProduct_1741234567890`) so leftover data from a previous run never causes a false failure.

The app has an AI chat widget that opens intermittently on post-login pages and intercepts keyboard input. `BasePage` registers a `page.on('load')` listener that automatically closes it on every navigation — no manual handling needed in individual tests.

Wait strategy is `waitFor` with explicit states (`visible`, `hidden`) and `networkidle` throughout. No `waitForTimeout` except where the UI genuinely needs a moment to settle after an action.

Workers are set to 1 because all scripts run against the same QA account and merchant. Running in parallel would need separate credentials per script to avoid session conflicts — the config comment explains this for whoever picks this up next.

---

## Environment

| | |
|--|--|
| URL | https://qa-mdashboard.dev.gokwik.in |
| Email | sandboxuser1@gokwik.co |
| OTP | 123456 |
| Merchant ID | 19h577u3p4be |
