# CashFlow Client

This is the frontend application for CashFlow, a premium, offline-first personal finance tracker.

## Technology Stack

- **Framework**: React 19
- **Build Tool**: Vite
- **Styling**: Tailwind CSS v4
- **Language**: TypeScript
- **Charts**: Recharts
- **PWA**: vite-plugin-pwa

## Key Features

- **Progressive Web App (PWA):** Fully installable standalone application with offline view caching, background database synchronization, and fallback auth-state persistence via LocalStorage to circumvent WebKit's third-party cookie restrictions on iOS devices.
- **Premium UI:** Glassmorphic layout structure, system-aware dark mode adaptation, and mobile-first responsive views.
- **Data Visualization:** Interactive graphs and multi-tab comparison charts built with Recharts.
- **PDF Export Engine:** Thread-safe PDF export offloading compilation to background Web Workers to prevent main-thread locking.

## Setup Instructions

1. Install dependencies:

   ```bash
   npm install
   ```

2. Create a `.env` file based on your environment:

   ```env
   VITE_API_URL=http://localhost:5000/api
   VITE_GOOGLE_CLIENT_ID=your_google_client_id
   ```

3. Start the development server:
   ```bash
   npm run dev
   ```

## Scripts

- `npm run dev`: Start dev server.
- `npm run build`: Compile and build for production.
- `npm run lint`: Run ESLint checks.
