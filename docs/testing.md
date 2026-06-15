# Testing Guide

This project includes comprehensive, production-grade test suites for both the **Frontend** (React + Vite) and **Backend** (Express + MongoDB).

## Backend Testing

The backend is tested using **Jest** and **Supertest**, along with **MongoDB Memory Server** for an isolated, in-memory database during tests.

### Running Backend Tests
1. Navigate to the `server/` directory:
   ```bash
   cd server
   ```
2. Run the full test suite:
   ```bash
   npm run test
   ```

### Backend Coverage
- **Controllers**: Full CRUD coverage for Expenses, Incomes, Budgets, Categories, and Income Sources. Tests validate expected HTTP status codes, missing field rejection, unique constraints, and edit limits.
- **Middleware**: Authentication (JWT) validation, expiration checks, rate limiting, and global error handling logic.
- **Ownership Isolation**: Tests guarantee that User A cannot modify or delete documents owned by User B.

---

## Frontend Testing

The frontend relies on **Vitest** for blazing-fast execution, using **JSDOM** to simulate browser APIs and **fake-indexeddb** to mock `localForage` operations.

### Running Frontend Tests
1. Navigate to the `client/` directory:
   ```bash
   cd client
   ```
2. Run the test suite:
   ```bash
   npm run test
   ```

### Frontend Coverage
- **Offline Sync Engine (`offlineSync.ts`)**: Exhaustive tests for offline caching, queueing algorithms, cache invalidation, queue reconciliation, and temporary ID mapping.
- **Budget Service (`budgetService.ts`)**: Logic tests for envelope summaries, progress calculation, and health scoring.
- **Utilities**: 
  - `mathParser.ts`: Evaluates safe calculation of PEMDAS equations entered in forms.
  - `formatters.ts` & `dataMappers.ts`: Validates INR currency rules, hex color conversions, and category fallback mappings.
