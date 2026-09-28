# 🎭 Scalable Web Testing Framework Built with Playwright

### End-to-end UI and API testing with a composite CI quality gate: functional, accessibility, security, performance, and visual checks

## Preview

This testing framework is built around a currency-conversion app: [Currency Exchange](https://currency-exchange-nadiia.netlify.app).

## Why this framework?

This repository is a production-style, scalable testing framework that can be
adapted for a wide range of web applications. It combines component,
integration, API, browser, accessibility, security, performance, and visual
testing with CI workflows and reporting.

Its reusable test structure and tooling provide a starting point for a new
application. Adapting it involves replacing the current app-specific tests,
selectors, API assumptions, and visual baselines.

| What it provides          | How it helps                                                                                           |
| ------------------------- | ------------------------------------------------------------------------------------------------------ |
| Layered test coverage     | Separate component, integration, API, browser, accessibility, security, performance, and visual checks |
| Browser automation        | Playwright projects support Chromium, Firefox, and WebKit                                              |
| Repeatable test data      | MSW and a local API support deterministic test scenarios                                               |
| Environment configuration | Vite environment settings support local and CI runs                                                    |
| Visual regression         | Screenshot comparisons use version-controlled baselines                                                |
| Failure diagnostics       | HTML and Allure reports, plus screenshots, videos, and traces, help investigate failures               |
| CI workflows              | Blocking checks provide merge feedback, while informational jobs report additional results             |

For another application, adapt its specific tests and configuration before
relying on this framework as a complete test suite.

---

## Architecture

The project keeps the React/Vite application, local API, and test suites in
separate areas. Vitest covers components and integrated UI flows; Playwright
tests the running app and local API in browser and API contexts. CI starts the
local services and runs the applicable suites.

### Directory layout

```text
.
├── .github/workflows/ # CI quality gate and reporting workflows
├── scripts/ # Local and CI startup helpers
├── server/ # Local Node.js API
├── src/ # React application
│   ├── components/ # UI components
│   ├── context/ # Shared currency state
│   └── hooks/ # Application hooks
├── tests/
│   ├── accessibility/ # Accessibility checks
│   ├── api/ # API contract tests
│   ├── components/ # Component tests
│   ├── e2e/ # Browser user-flow tests
│   ├── fixtures/ # Shared test setup and providers
│   ├── integration/ # Multi-component flows
│   ├── mocks/ # MSW network handlers
│   ├── performance/ # k6 scripts
│   ├── security/ # API and HTTP security tests
│   └── visual/ # Screenshot checks and baselines
├── playwright.config.js # Playwright projects and browser settings
├── vite.config.js # Vite and Vitest configuration
└── package.json # Dependencies and project scripts
```

### Tech stack

| Tool                                                                                    | Purpose                                                |
| --------------------------------------------------------------------------------------- | ------------------------------------------------------ |
| [React](https://react.dev/), [Vite](https://vite.dev/), [Material UI](https://mui.com/) | Application UI and development/build tooling           |
| [Axios](https://axios-http.com/), [React Query](https://tanstack.com/query/v3/)         | API requests and server-state fetching                 |
| [world-countries](https://www.npmjs.com/package/world-countries)                        | Country and currency data for the selector             |
| [Node.js](https://nodejs.org/) 22+ and npm                                              | JavaScript runtime and package management              |
| [Playwright](https://playwright.dev/)                                                   | Browser automation, API checks, and visual comparisons |
| [Vitest](https://vitest.dev/) and [Testing Library](https://testing-library.com/)       | Component and integration checks                       |
| [MSW](https://mswjs.io/)                                                                | HTTP mocks for deterministic API responses             |
| [axe-core](https://github.com/dequelabs/axe-core) with Playwright                       | Automated accessibility checks                         |
| [k6](https://grafana.com/docs/k6/latest/)                                               | HTTP performance smoke and load checks                 |
| [Allure Report](https://allurereport.org/)                                              | Detailed results and history for Vitest and Playwright |
| Java runtime                                                                            | Required by the Allure CLI                             |
| [ESLint](https://eslint.org/)                                                           | JavaScript and JSX linting                             |
| GitHub Actions                                                                          | CI checks and downloadable artifacts                   |

---

## Quick start

### Prerequisites

```bash
node --version
npm --version
```

- Node.js 22 or higher
- npm, included with Node.js (no `.nvmrc` is provided)

### Install

```bash
git clone https://github.com/NadiiaSka/playwright-automation-framework.git
cd playwright-automation-framework
npm ci
npx playwright install
cp .env.ci.example .env.ci
```

In Windows PowerShell, create the CI environment file with:

```powershell
Copy-Item .env.ci.example .env.ci
```

Playwright starts the local Vite app and Node API using the CI environment
configuration. Conversion responses in browser tests are deterministic; the
live exchange-rate provider is not required.

### Run the main test suites

```bash
npm run test:run
npm run test:chrome
```

`test:run` runs the Vitest component and integration suites once. `test:chrome`
runs the Playwright specs in Chromium. The bare `npm test` command starts
Vitest in watch mode.

### Run against a specific browser

```bash
npm run test:chrome
npm run test:firefox
npm run test:webkit
npm run test:cross-browser
```

Chromium is used by the blocking Playwright CI jobs. Firefox and WebKit projects
are available locally; the optional CI cross-browser job runs the functional
currency-conversion flow in both. The committed visual baselines are for
Chromium only, so the visual spec is not currently baseline-ready in Firefox or
WebKit.

### Run focused suites

```bash
npm run test:component
npm run test:integration
npm run test:api
npm run test:security
npm run test:functional
npm run test:accessibility
npm run test:visual
```

Update Chromium visual baselines on the current platform with
`npm run test:visual:update`.

Performance checks are separate and require k6:

```bash
npm run test:performance:smoke
npm run test:performance:health
```

---

## Reporting and debugging

The configured test reporters and CI jobs produce these artifacts:

| Artifact               | Purpose                                                                      |
| ---------------------- | ---------------------------------------------------------------------------- |
| Playwright HTML report | Interactive browser results, generated and uploaded in CI                    |
| Allure HTML report     | Detailed results and history, generated as a CI artifact                     |
| Vitest JUnit XML       | Machine-readable component and integration results in CI                     |
| Allure raw results     | Written to `allure-results/` by Vitest and Playwright, including failed runs |
| Screenshots            | Captured on failure; visual checks also compare explicit page snapshots      |
| Traces                 | Captured on the first retry                                                  |
| Videos                 | Retained on failure                                                          |

Generate and open the Allure report locally with:

```bash
npm run allure:report
```

The Allure CLI requires a Java runtime. To serve directly from the raw results,
use `npm run allure:serve`.

In CI, the non-blocking **Allure report** job uploads the report as the
`allure-report` artifact. On pushes to `master`, the non-blocking Pages job
publishes it with history restored from the previous report:

[View the Allure report](https://NadiiaSka.github.io/playwright-automation-framework/)

Trend history is available after a successful Pages deployment. The reporting
and Pages jobs are informational and do not gate merges.

---

## Quality Gates

CI is defined in the single [Quality Gate workflow](.github/workflows/quality-gate.yml).
Each quality dimension runs as a separate GitHub Actions job, and the final
`quality-gate` job aggregates the required results. The workflow runs on pushes
to `main`, `master`, `develop`, and `production`, pull requests targeting
`main`, a daily schedule, and manual dispatch. Jobs use `ubuntu-latest`;
Playwright jobs install the browsers they need.

### Blocking

These jobs feed the required `quality-gate` status. Dependency review is
required only for pull requests.

| Job                  | Script or action                                                              | Why it blocks                                     |
| -------------------- | ----------------------------------------------------------------------------- | ------------------------------------------------- |
| Lint                 | `npm run lint`                                                                | Enforces JavaScript and JSX code quality          |
| Compile              | `npm run build:ci`                                                            | Confirms the app builds in CI mode                |
| Unit                 | `npx vitest run tests/components --outputFile=reports/unit-tests.xml`         | Checks component behavior                         |
| Integration          | `npx vitest run tests/integration --outputFile=reports/integration-tests.xml` | Checks integrated app flows                       |
| API contract         | `npm run test:api`                                                            | Verifies local API responses and validation       |
| Functional           | `npm run test:functional`                                                     | Checks the main browser conversion flow           |
| Accessibility        | `npm run test:accessibility`                                                  | Runs browser accessibility checks                 |
| Security             | `npm run test:security`                                                       | Checks local API and HTTP security behavior       |
| Secret scanning      | Gitleaks GitHub Action                                                        | Detects secrets in repository history             |
| CodeQL               | GitHub CodeQL action                                                          | Performs JavaScript/TypeScript static analysis    |
| PR dependency review | GitHub dependency-review action                                               | Flags high-severity dependencies in pull requests |

### Non-blocking

These jobs remain visible and upload results, but do not gate merges.

| Job                          | Script or action                                 | Why it is non-blocking                                        |
| ---------------------------- | ------------------------------------------------ | ------------------------------------------------------------- |
| Dependency audit             | `npm audit --audit-level=high`                   | Report-only dependency risk signal                            |
| Performance smoke            | `k6 run tests/performance/health-smoke.js`       | Supplemental performance signal                               |
| Visual regression            | `npm run test:visual`                            | Informational screenshot comparison                           |
| k6 load                      | `k6 run tests/performance/health.js`             | Supplemental load and latency signal                          |
| Cross-browser                | Playwright currency flow on Firefox and WebKit   | Additional compatibility signal; Chromium is the primary gate |
| Allure report                | `npm run allure:generate`                        | Reporting artifact, not a quality check                       |
| Pages publish                | GitHub Pages actions, on pushes to `master` only | Publishes the report without gating merges                    |
| Visual baseline regeneration | Manual `workflow_dispatch` input                 | Optional baseline update for review                           |

## Test design skills

Reusable instructions for authoring tests and designing behavior-based cases
are available in the Skills folder: [test-authoring.md](tests/skills/test-authoring.md)
and [test-case-design.md](tests/skills/test-case-design.md). They cover
component, integration, and end-to-end testing.

## Extending the framework

To use this framework with another application, configure its local or test
environment, replace the app-specific selectors and API expectations, and add
visual baselines for the target screens. Then adjust the required Quality Gate
checks to match the application's release risks.

## Planned updates

I plan to add version-controlled guidance and reusable prompts for AI coding
agents, so they can follow this project's conventions and verify changes
through the Quality Gate.
