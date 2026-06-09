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

- **Progressive Web App (PWA):** Fully installable with offline caching and background sync queueing for mutations.
- **Premium UI:** Glassmorphic design, dynamic dark mode, and mobile-first responsiveness.
- **Data Visualization:** Interactive charts and graphs for budgeting and reports.
- **PDF Export Engine:** On-demand professional report generation powered by dynamic React components (`html2canvas-pro` + `jsPDF`).

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
