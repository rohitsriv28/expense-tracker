# Changelog

All notable changes to this project will be documented in this file.

## Upcoming Features

- **Debt & Borrow Tracker:** A dedicated module to keep track of what you owe and what others owe you, seamlessly integrated into your expense history.
- **Shared Expenses & Group Splits:** Collaborative expense tracking for groups to easily share bills and manage settlements.

---

## [3.0.2] - 2026-06-12

A major maintenance and optimization update focusing on background processing, cache safety, component memoization, and production analytics.

### Added

- **PDF Web Worker:** Offloaded the heavy HTML-to-PDF rendering engine to a dedicated background Web Worker, preventing main-thread freezing and improving application responsiveness during large exports.
- **Web Analytics:** Integrated Vercel Web Analytics to track production frontend usage and page views.
- **Uptime Health Endpoint:** Added a standard `/api/health` endpoint designed to be pinged by external cron services (e.g., cron-job.org via `*/14 * * * *`) to prevent Render free-tier backend cold starts.
- **Failed Sync UI:** Introduced `FailedSyncModal` to explicitly notify users if any offline queue mutations permanently fail (HTTP 400), allowing them to retry or discard corrupted transactions.
- **Distributed Cron Locks:** Implemented a MongoDB-backed distributed lock utilizing atomic `$lt` checks on a `_cron_locks` collection to prevent race conditions during the nightly data retention cron job across multiple scaling instances.

### Changed

- **Auth Memoization:** Wrapped all `AuthContext` provider values and functions with `useMemo` and `useCallback` to drastically reduce unnecessary cascading component re-renders.
- **Rate Limiting:** Enforced a strict 10 requests per 15 minutes rate limit on all authentication routes (`/auth/google`, `/auth/refresh`, `/auth/logout`) via `express-rate-limit`.

### Fixed

- **Optimistic UI Cache Drift:** Fixed a pagination cache bug by injecting optimistic `stale` flags into local `localforage` GET caches when a mutation occurs offline, triggering a seamless background refresh when internet returns.
- **PDF Memory Leak:** Resolved a critical DOM memory leak by ensuring the temporary hidden PDF container is forcefully destroyed within a `finally` block after generation.
- **Logout Race Condition:** Placed the `pushFrequencyMapToServer()` synchronization call behind a 3-second `Promise.race` timeout during the logout flow so a slow server doesn't trap the user trying to sign out.
- **TypeScript Strictness:** Resolved build errors by properly isolating types with `import type` due to `verbatimModuleSyntax` rules, and clearing out dead code.
- **Environment Parity:** Configured `cross-env NODE_ENV=production` in the server's start script to guarantee correct runtime initialization.

---

## [3.0.1] - 2026-06-11

A crucial production-readiness patch addressing offline sync race conditions, memory optimization, caching, and server stability.

### Added

- **Graceful Shutdown:** Implemented robust `SIGTERM` and `SIGINT` handlers in the Express server to ensure active MongoDB connections and HTTP requests drain safely before process exit, enabling zero-downtime deploys.
- **Structured Production Logging:** Upgraded `winston` to output parsable, structured JSON logs when running in `NODE_ENV=production`.
- **Robust Database Connectivity:** Replaced standard MongoDB Atlas SRV connection strings with fully expanded, explicit replica-set URIs to bypass aggressive network DNS/ISP blocking and resolve frequent `querySrv ECONNREFUSED` crashes without resorting to unsafe global DNS overrides.

### Changed

- **JWT TTL Synchronization:** Aligned `JWT_REFRESH_EXPIRES_IN` in `.env` to 30 days and synchronized the HTTP-only cookie `maxAge` in `auth.controller.ts` to strictly match.
- **AuthContext Memoization:** Wrapped the React `AuthContext` provider values in `useMemo` and functions in `useCallback` to drastically reduce unnecessary component re-renders.

### Removed

- **Firebase Dependency:** Fully uninstalled the legacy `firebase` package from `client/package.json`, shedding ~1.2MB of dead weight from the Vite build.

### Fixed

- **Sync Queue Race Condition:** Introduced atomic `status` (`pending`, `processing`, `failed`) and `retryCount` fields to IndexedDB offline queues to prevent the same request from being sent multiple times. Added a `resetStuckQueueItems` recovery mechanism on reconnect.
- **Mutation Cache Invalidation:** Implemented dynamic prefix-based cache invalidation in `apiClient.ts`. Mutations (`POST`, `PUT`, `DELETE`) now correctly evict stale `GET` queries from IndexedDB.
- **Production Stack Traces:** Hardened the global `errorHandler.ts` to strictly suppress sensitive stack traces unless `NODE_ENV !== "production"`.

---

## [3.0.0] - 2026-06-10

A massive architectural overhaul migrating the application from Firebase to a robust, custom Node.js, Express, and MongoDB backend (a monumental effort underway since early May 2026!), alongside restoring and upgrading full Progressive Web App (PWA) and Offline functionality.

### Added

- **Custom Backend Architecture:** Built a fully custom REST API using Node.js, Express, and MongoDB (Mongoose) to handle users, budgets, expenses, incomes, and categories.
- **Custom Offline Sync Architecture:** Designed a robust caching layer using `localforage` (IndexedDB) and advanced `Axios` interceptors to enable full application usability without an internet connection.
- **Offline Mutation Queue:** Added the ability to seamlessly log expenses and incomes even while completely offline. The application locally stages requests and optimistically updates the UI with mock `temp-` identifiers.
- **Multi-Device Session Support:** Replaced the legacy single-token architecture with a multi-token array, enabling users to maintain up to 5 concurrent active sessions across different devices (e.g., phone, tablet, laptop).
- **SmartDefaults Cross-Device Sync:** The predictive expense classification engine now synchronizes to the remote server, intelligently merging classification patterns via an LRU-capped LocalStorage policy so your phone and laptop learn together.
- **BroadcastChannel Multi-Tab Sync:** Implemented a robust native BroadcastChannel adapter. Data mutations happening in one browser tab automatically trigger re-fetches in other open tabs, providing a seamless multi-screen experience.
- **Automated Background Re-Sync:** Re-engineered the application's network awareness so the moment internet connectivity is restored, all offline mutations are reliably replayed against the remote MongoDB server.
- **Offline Conflict Protection:** Implemented intelligent UI safety blockers that prevent the editing or deletion of locally staged (un-synced) records until the background sync resolves, preventing data collisions.
- **Priority Sorting:** Categories and Income Sources now feature an `order` field, ensuring they appear consistently in dropdowns and lists based on predefined priority.
- **HTML-to-PDF Export Engine:** Completely overhauled the reporting module, replacing the legacy `pdf-lib` renderer with a robust HTML-to-PDF engine (`html2canvas-pro` & `jsPDF`).
- **Premium PDF Templates:** Built highly aesthetic, token-driven React templates for PDF exports (`PdfReportTemplate.tsx`), featuring dynamic `conic-gradients`, beautiful data visualizations, and robust micro-components.

### Changed

- **Monorepo Restructure:** The codebase is now cleanly split into `client/` (React/Vite) and `server/` (Node/Express) directories.
- **PWA Re-Integration:** Successfully re-implemented `vite-plugin-pwa` to auto-generate fully cached Service Workers within the new Vite client build architecture, restoring instantaneous offline load times and native "Add to Home Screen" prompts across all platforms.
- **Codebase Standardization:** Executed a massive, codebase-wide refactoring pass to enforce consistent syntax (e.g., standardizing double quotes) and clean up imports.
- **UI Color Logic:** Reserved slate/grey colors strictly for "Unallocated" or "Uncategorized" entities. Updated the default "Transport" category color to Blue.

### Removed

- **Firebase Deprecation:** Completely removed all legacy Firebase configuration files, services, and dependencies from the project.
- **Dead Code Eradication:** Utilized strict dependency analysis (`knip`) to identify and securely delete unused React components, stale hooks, and obsolete task scripts across both client and server.

### Fixed

- **IndexedDB Cache Eviction Strategy:** Hardened the `localforage` offline API cache by introducing an advanced envelope architecture. Cache entries are now subject to an aggressive 30-day age limit and a 100-item LRU cap, preventing unbounded browser quota consumption.
- **Offline Sync Queue Resolution:** Fixed an issue with offline sequential mutations by deploying an internal `tempIdMap`. If an expense is created offline and immediately edited, the system safely maps the temporary ID to the real MongoDB ObjectID before dispatching the edit request.
- **Data Retention Job Scalability:** Refactored the nightly `dataRetention` cron job from a sequential loop to a heavily concurrent cursor-paginated architecture, allowing scalable data purges for tens of thousands of users without stalling the database pool.
- **Google Auth COOP Policy:** Resolved an issue where the Google Sign-In popup was blocked by setting correct `Cross-Origin-Opener-Policy: same-origin-allow-popups` headers in both the Vite dev server and the Express production `helmet` configuration.

---

## [2.4.1] - 2026-06-07

A minor patch to enhance security and fix database sync issues caused by strict Firestore security rules.

### Added

- **Secure Math Parser:** Implemented a custom recursive descent parser for mathematical expressions in the Add Expense form, removing the dangerous `new Function()` dynamic evaluation method.

### Fixed

- **Firestore Sync Denial:** Fixed a critical bug where categories (both custom and default) were failing to sync to the remote Firestore database due to a missing `userId` property required by strict database rules.
- **Database Schema Alignment:** Renamed the `income` collection to `incomes` to exactly match the target architectural schema layout across the application.

---

## [2.4.0] - 2026-06-04

A major update refactoring the budgeting system to a unified "Monthly Envelope" model, along with a complete premium visual redesign of the Authentication (Login) page, Terms of Service page, and Privacy Policy page.

### Added

- **Monthly Envelope Budgets:** Introduced a unified budget model where users set a total monthly spending envelope and can optionally allocate specific amounts to categories. Unallocated funds are tracked automatically.
- **Allocation UI:** Added `AllocationSheet` and `AllocationPromptModal` to facilitate seamless category allocation after creating a monthly budget.
- **Budget Health Tracking:** Budgets now dynamically compute health status (safe, warning, danger, exceeded) based on expenditures matching the envelope's active month.

### Changed

- **Auth (Login) Overhaul:** Completely redesigned the Login page with a premium dual-panel grid layout (featuring a rich hero panel with CashFlow value props, security badges, and dynamic visual layouts) and a refined Google authentication interface compliant with brand guidelines.
- **Privacy Policy & Terms Overhaul:** Substantially expanded and visually overhauled the legal pages into clean, highly readable, structured layouts with distinct icons, clear typographic hierarchies, and detailed sections matching modern compliance standards.
- **Budget Creation Flow:** Redesigned the budget creation form to focus entirely on the new Monthly Envelope model, completely removing tabs for recurring/goal budgets.
- **UI Simplification:** Removed legacy `GoalCard` and `RecurringBudgetCard` components. Cleaned up budget references across `Dashboard`, `AddExpenseForm`, `FinancialOverview`, and `ReportsSection`.
- **Category Ordering:** Categories are now deduplicated and sorted by a predefined priority list (defaults first, followed by custom ones alphabetically) for a consistent user experience.

### Fixed

- **Chart Dimension Warnings:** Resolved Recharts responsive width/height container issues by wrapping all charts in fixed pixel height wrappers and ensuring correct Flexbox bounds.
- **Offline Persistence Deprecation:** Modernized Firebase config by replacing the deprecated `enableIndexedDbPersistence` with the new `persistentLocalCache` API.
- **Invalid Date Crashes:** Fixed a crash in legacy budget parsing caused by `startDate.toDate is not a function` by implementing robust date resolution in `convertLegacyBudget`.
- **Query Optimizations:** Removed redundant filtering from `incomeService.ts` to avoid unnecessary composite index requirements.
- **Income Source Sorting:** Corrected the sorting order of default income sources so they appear sequentially as intended.

---

## [2.3.0] - 2026-06-01

A major quality-of-life update focusing on UX improvements, pagination logic, UI refinements, and performance optimization.

### Added

- **Custom Calendar Modal:** Replaced the native browser date input with a fully custom, premium calendar modal. Includes interactive month and year grid views for rapid date selection without clunky dropdowns, plus quick presets for "Today" and "Yesterday".
- **Legacy Category Fallbacks:** Built a mapping layer to gracefully support legacy string-based categories (e.g., "Food & Drink"), assigning them consistent colors and icons across the Dashboard, Expense List, Reports, and PDF exports.
- **Premium Install Prompts:** Redesigned the PWA installation prompts for Android, iOS, and Desktop. Features a sleek, dark-gray aesthetic, red branding, and highly accurate native-feel iOS Share Sheet instructions.

### Changed

- **Codebase Modularization:** Completely restructured the project architecture from a flat `components` directory into a scalable, feature-based domain model (`features/expenses`, `features/budgeting`, `components/layout`, etc.), leveraging AST codemods to dynamically update and type-check all module imports.
- **Date-Aware Pagination:** Overhauled Dashboard data fetching to rely on a single unified data stream. Implemented a custom client-side, date-group-aware pagination algorithm in the Expense List ensuring transactions from the same day are never split across pages.
- **Optional Categories:** Expense logging no longer requires selecting a category. Uncategorized expenses seamlessly default to a generic "Uncategorized" display globally.

### Fixed

- **Vite Bundler Optimization:** Resolved a build warning by converting the PDF generation library (`jspdf`) import to a dynamic import inside the Reports section, correctly isolating it into a separate chunk and significantly reducing the main bundle size.
- **TypeScript Strictness:** Cleaned up unused imports across components to satisfy strict compilation checks.

---

## [2.2.0] - 2026-05-30

A comprehensive upgrade introducing dynamic income tracking, automated budget allocation with dynamic expense depletion, an advanced dedicated reports and comparisons dashboard, and premium responsive design aesthetics.

### Added

- **Dynamic Income Tracking:** Added a dedicated module to log incomes with source descriptions, dates, and amounts. Displays a real-time Total Income card on the main dashboard.
- **Automated Budget Allocation:** Introduced a weekly, monthly, and trip-based budget manager. Logged expenses falling within budget date ranges are automatically debited, displaying active depletion status bars and warning colors if limits are exceeded.
- **Dedicated Financial Reports Panel:** Added a first-class Reports tab containing:
  - _Overview:_ Quick cards showcasing spending stats (total, avg, peak transaction) and a Day-of-Week spending bar chart.
  - _Categories:_ Spent breakdown list with dedicated color-assigned progress bars and category share Pie Charts.
  - _Trends:_ Real-time daily spending trend Area/Line graphs tracking the past 30 days.
  - _Compare:_ A period-over-period comparison engine (This Month vs Last Month / This Week vs Last Week) with absolute and percentage diff metrics, alongside Grouped Bar Charts.
- **Premium Footer Redesign:** Upgraded to a fully responsive, glassmorphic layout featuring gradient-styled typography, bouncing micro-animated heart credit, quick link icons, and clean mobile wrapping.
- **Firestore Security Configuration:** Added a `firestore.rules` template specifying strict user-based read/write access constraints across all collections (Expenses, Categories, Incomes, and Budgets).

---

## [2.1.0] - 2026-05-26

### Added

- **Server-Side Pagination:** Migrated `ExpenseList` to Firestore cursor-based pagination (`startAfter` and `limit`) to significantly improve performance on large datasets.
- **Unpaginated Chart Data:** Introduced a separate `getAllExpenses` function in `expenseService.ts` to supply full-range data specifically to `SpendingCharts` and `InsightsSummary`. This fixes a bug where charts were artificially limited to the 10 most recent paginated expenses.
- **Inline Confirmations:** Replaced the native `window.confirm` dialog in `CategoryManager.tsx` with a polished, inline confirmation UI using a new `pendingDeleteId` state.
- **Batched Deletion Chunking:** Added chunking to `dataRetentionService.ts` to process bulk database deletions in chunks of 500 items, preventing Firestore transaction limit errors.

### Fixed

- **Chart Data Missing Bug:** Resolved an issue where the pie chart and insights summary only displayed "Uncategorized" and "Food" by ensuring they receive the full unpaginated dataset for the selected period.
- **Colorless/Grey Pie Chart:** Fixed an issue where the pie chart rendered in grey by filtering out `slate` and `gray` variants from the auto-assignment fallback palette. Also updated category matching to be case-insensitive to ensure reliable color mapping.
- **Missing Tailwind Colors:** Expanded the `TAILWIND_COLORS` utility map to include all `-400`, `-500`, and `-600` variants (slate, red, orange, amber, yellow, lime, green, emerald, teal, cyan, sky, blue, indigo, violet, purple, fuchsia, pink, rose) with fallback logging.
- **Firestore Index Errors:** Improved error handling for missing composite indexes (`failed-precondition`), surfacing a clear, dismissable error toast directly in the Dashboard UI.
- **Deprecation Warnings:** Updated `index.html` to replace the deprecated `<meta name="apple-mobile-web-app-capable" content="yes">` with `<meta name="mobile-web-app-capable" content="yes">`.

### Security / Stability

- **Cache Conflict Prevention:** Investigated and safely reverted an attempt to migrate Firestore offline persistence to `persistentLocalCache()`. This protects existing users' live applications from critical IndexedDB cache conflicts and `permission-denied` errors. The application securely retains `enableIndexedDbPersistence()`.

---

## [2.0.0] - 2025-12-25

A polished, production-grade personal finance PWA with professional reporting, native-like installation flows, improved dashboard usability, and stronger documentation and code quality.

### Added

- **PDF Reporting:** PDF engine completely rewritten using `pdf-lib` with a professional Red & Black report theme, Financial Summary & Analysis header, and top spending category breakdowns.
- **PWA Install Experience:** Replaced generic browser prompts with native-style Bottom Sheet (Android) and custom Add to Home Screen instruction sheets (iOS).

### Changed

- **Dashboard & UI:** Fixed Light Mode contrast issues, improved theme awareness between dark and light modes, and standardized color usage across components.
- **Codebase Health:** Cleaned up unused variables and imports, resolved ESLint warnings, and verified production builds.

### Documentation

- Added a comprehensive README (Project overview, Tech stack, Setup, Project structure).
- Added a structured CHANGELOG.
