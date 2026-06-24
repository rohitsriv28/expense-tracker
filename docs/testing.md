# Testing Guide

Welcome to the **CashFlow** testing guide. This document details the automated testing architecture, coverage, and instructions for running and maintaining test suites across both the client and server components.

---

## 📊 Test Suite Overview

CashFlow maintains a strict testing regimen to ensure database isolation, offline data consistency, and reliable financial calculations.

| Layer                 | Framework             | Environment / Mocking         | Tests Passed  |      Status       |
| :-------------------- | :-------------------- | :---------------------------- | :-----------: | :---------------: |
| **Backend (API)**     | Jest + Supertest      | MongoDB Memory Server         |    69 / 69    |    🟢 Passing     |
| **Frontend (Client)** | Vitest                | JSDOM + `fake-indexeddb`      |    85 / 85    |    🟢 Passing     |
| **Total Suite**       | **13 Suites / Files** | **Isolated Testing Mock Env** | **154 / 154** | **🟢 100% Green** |

---

## 🖥️ Backend Testing

The backend test suite verifies endpoint routing, request body payload validation, controller logic, middleware execution, and database security constraints.

### ⚙️ Environment Setup

Backend tests leverage an in-memory database (`mongodb-memory-server`) to ensure that tests run in complete isolation. No real data is touched, and the database state is cleanly seeded and wiped before and after each test run.

### 🏃 How to Run Tests

1. Navigate to the server workspace:
   ```bash
   cd server
   ```
2. Execute the test command:
   ```bash
   npm run test
   ```

> [!TIP]
> To run tests in watch mode during development, you can use:
>
> ```bash
> npx jest --watch
> ```

### 🔍 Coverage Areas

- **API Controllers:**
  - **Expenses & Incomes:** Validates CRUD limits (e.g., maximum of 3 edits per expense, no deletion allowed on expenses for ledger integrity).
  - **Budgets & Categories:** Validates envelope budgeting constraints, duplicate prevention, and category isolation.
- **Security & Middleware:**
  - **JWT Validation:** Tests token verification, expiration guards, and refresh cycles.
  - **Ownership Isolation:** Strict verification verifying that `User A` is forbidden from querying, editing, or deleting documents belonging to `User B`.
  - **Rate Limiting:** Ensures API rate limiters trigger under high load (adjusted for dev environments).

---

## 📱 Frontend Testing

The frontend test suite focuses on client-side state stability, caching persistence layers, math evaluation components, and background syncing operations.

### ⚙️ Environment Setup

Vitest simulates a browser environment using **JSDOM** and hooks up **fake-indexeddb** to mock `localForage` transactions, enabling deep validation of offline queries and queues without browser dependencies.

### 🏃 How to Run Tests

1. Navigate to the client workspace:
   ```bash
   cd client
   ```
2. Execute the single run command:
   ```bash
   npm run test
   ```

> [!TIP]
> To launch the interactive Vitest watcher UI:
>
> ```bash
> npm run test:watch
> ```

### 🔍 Coverage Areas

- **Offline Sync Engine (`offlineSync.ts`):**
  - Verifies IndexedDB request queueing and temporary ID lookup mapping during network restoration.
  - Validates FIFO cache eviction thresholds (evicts items older than 30 days or exceeding 100 entries).
  - Tests safety flows, such as ignoring deletions on failed/skipped offline POST commands.
- **Budget Logic Service (`budgetService.ts`):**
  - Validates envelope budgeting math, remaining pool calculations, and progressive health-status colors.
- **Mathematical Utilities (`mathParser.ts`):**
  - Validates safe extraction and execution of PEMDAS equations entered in numeric forms.
- **Formatting and Data Mappers:**
  - Validates INR currency format representation and system theme matching controls.

---

## 🛠️ Resolved Bugs Discovered via Testing

Robust test coverage helped detect and repair the following bugs prior to deployment:

- **Category Deletion Bug:** Fixed a query discrepancy where attempts to delete custom categories would crash/fail due to incorrect filtering on default properties.
- **Income Source Frequency Bug:** Fixed an oversight in the creation flow where request parameters for income frequencies were discarded, triggering schema validation failures.
