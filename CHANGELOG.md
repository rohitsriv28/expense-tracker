# Changelog

All notable changes to this project will be documented in this file.

## Upcoming Features
- **Debt & Borrow Tracker:** A dedicated module to keep track of what you owe and what others owe you, seamlessly integrated into your expense history.
- **Shared Expenses & Group Splits:** Collaborative expense tracking for groups to easily share bills and manage settlements.

---

## [2.2.0] - 2026-05-30

A comprehensive upgrade introducing dynamic income tracking, automated budget allocation with dynamic expense depletion, an advanced dedicated reports and comparisons dashboard, and premium responsive design aesthetics.

### Added
- **Dynamic Income Tracking:** Added a dedicated module to log incomes with source descriptions, dates, and amounts. Displays a real-time Total Income card on the main dashboard.
- **Automated Budget Allocation:** Introduced a weekly, monthly, and trip-based budget manager. Logged expenses falling within budget date ranges are automatically debited, displaying active depletion status bars and warning colors if limits are exceeded.
- **Dedicated Financial Reports Panel:** Added a first-class Reports tab containing:
  - *Overview:* Quick cards showcasing spending stats (total, avg, peak transaction) and a Day-of-Week spending bar chart.
  - *Categories:* Spent breakdown list with dedicated color-assigned progress bars and category share Pie Charts.
  - *Trends:* Real-time daily spending trend Area/Line graphs tracking the past 30 days.
  - *Compare:* A period-over-period comparison engine (This Month vs Last Month / This Week vs Last Week) with absolute and percentage diff metrics, alongside Grouped Bar Charts.
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
