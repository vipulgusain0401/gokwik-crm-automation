# GoKwik CRM Automation — Products Module

Playwright automation framework for the GoKwik CRM Admin Panel — Products Module.

## Tech Stack
- **Playwright** — browser automation
- **TypeScript** — type-safe test code
- **Page Object Model (POM)** — maintainable structure

## Project Structure
```
gokwik-crm-automation/
├── config/
│   └── env.config.ts          # Environment variables (URL, credentials)
├── pages/
│   ├── base.page.ts           # Base POM (shared utilities)
│   ├── login.page.ts          # Login flow
│   ├── dashboard.page.ts      # Merchant switching
│   └── products.page.ts       # Products CRUD operations
├── tests/
│   ├── login.spec.ts          # Login test cases
│   └── products.spec.ts       # Products CRUD test cases
├── test-data/
│   └── products.data.ts       # Test data separated from logic
├── utils/
│   ├── logger.ts              # Structured logging
│   └── wait-helper.ts         # Smart wait strategies
├── .github/workflows/
│   └── playwright.yml         # GitHub Actions CI
└── playwright.config.ts       # Playwright configuration
```

## Setup & Run

### 1. Install dependencies
```bash
npm install
npx playwright install chromium
```

### 2. Run all tests
```bash
npm test
```

### 3. Run with browser visible (headed)
```bash
npm run test:headed
```

### 4. Run only smoke tests
```bash
npm run test:smoke
```

### 5. View HTML report
```bash
npm run test:report
```

## Test Cases Covered

| ID | Test | Category |
|----|------|----------|
| TC_LOGIN_01 | Successful login with OTP | Smoke |
| TC_LOGIN_02 | Invalid credentials rejected | Negative |
| TC_PRODUCT_01 | Create new product | Smoke / CRUD |
| TC_PRODUCT_02 | Search and verify product | Read |
| TC_PRODUCT_03 | Update product name | Update |
| TC_PRODUCT_04 | Delete product and verify | Delete |
| TC_PRODUCT_05 | No results for invalid search | Bonus |
| TC_PRODUCT_06 | Pagination navigation | Bonus |
| TC_PRODUCT_07 | Validation on empty form | Negative |

## Framework Design Decisions

- **Page Object Model**: Each page has its own class — tests don't contain selectors
- **Resilient locators**: Multiple selector fallbacks per element (no brittle XPaths)
- **No hard waits**: Uses `waitFor`, `networkidle`, and smart polling
- **Screenshots on failure**: Auto-captured and saved to `test-results/`
- **Retry on flakiness**: 1 retry locally, 2 in CI
- **Test data separation**: Dynamic names with timestamps avoid conflicts
- **Logging**: Every step logged with context and timestamp
