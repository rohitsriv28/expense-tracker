# CashFlow - Modern Expense Tracker

<p align="center">
  <img height="24" src="https://ziadoua.github.io/m3-Markdown-Badges/badges/React/react1.svg" />
  <img height="24" src="https://ziadoua.github.io/m3-Markdown-Badges/badges/TypeScript/typescript1.svg" />
  <img height="24" src="https://ziadoua.github.io/m3-Markdown-Badges/badges/TailwindCSS/tailwindcss1.svg" />
  <img height="24" src="https://ziadoua.github.io/m3-Markdown-Badges/badges/ViteJS/vitejs1.svg" />
  <img height="24" src="https://ziadoua.github.io/m3-Markdown-Badges/badges/NodeJS/nodejs1.svg" />
  <img height="24" src="https://ziadoua.github.io/m3-Markdown-Badges/badges/MongoDB/mongodb1.svg" />
</p>

CashFlow is a premium, feature-rich expense tracking application built with modern web technologies. It helps users manage their finances with a clean, responsive interface, detailed analytics, and seamless cross-device synchronization.

## Key Features

- **Modern and responsive UI**
  Built with a mobile-first approach using Tailwind CSS v4, featuring glassmorphism, smooth transitions, and a premium aesthetic.

- **Secure authentication**
  Google OAuth integration for secure access, utilizing HTTP-only cookies and robust JWT refresh token flows housed in a premium dual-panel login interface.

- **Interactive dashboard**
  Real-time overview of spending, total incomes, wallet balance, active budget depletion, and charts using Recharts.

- **Expense & Income management**
  Full CRUD support for tracking expenses and logging incomes with designated sources.
  - Custom expense categories and income source mapping
  - Date range filters (Today, Week, Month, Custom)
  - Sorting and search capabilities

- **Dynamic Budget Tracker**
  Create Monthly Envelope budgets to set an overall spending limit for the month. Optionally allocate specific amounts to categories, with unallocated funds tracked automatically. Expenses are dynamically debited to provide real-time health status bars.

- **Dedicated Financial Reports Section**
  Deep-dive analytics dashboard with four sub-modules:
  - _Overview:_ Stats summaries and Day-of-Week spending charts.
  - _Categories:_ Spent breakdown list and category distribution Pie Chart.
  - _Trends:_ Real-time daily spending trend graphs (30 days).
  - _Compare:_ Period-over-period comparisons (e.g. Month vs Last Month) with delta values and grouped bar charts.

- **Visual analytics & PDF reports**
  Detailed spending charts and on-demand professional PDF reports powered by a custom React-to-PDF rendering engine (`html2canvas-pro` + `jsPDF`).

- **Dark mode**
  System-aware dark mode for comfortable viewing in any environment.

- **PWA and Advanced Offline Sync**
  Progressive Web App functionality allows native-like installation on devices. Features a robust custom offline architecture: caches API requests for instant offline viewing, queues mutations locally (logging expenses/incomes offline), and auto-syncs securely in the background when connectivity returns.

- **Real-time data sync & Multi-Tenant Architecture**
  Seamless synchronization across devices using a custom REST API. Implements a highly scalable, user-centric database structure in MongoDB (Mongoose) to ensure strict data isolation and robust security via Express middlewares.

## Roadmap / Coming Soon 🚀

- **Debt & Borrow Tracker**: Keep a running ledger of who owes you and what you owe, integrated naturally with your expense dashboard.
- **Group Expenses & Splitting**: Share bills with friends, track group spending, and settle up easily using a shared data layer.

## Technology Stack

- **Frontend framework:** React 19
- **Build tool:** Vite
- **Language:** TypeScript
- **Styling:** Tailwind CSS v4
- **Backend:** Node.js, Express
- **Database:** MongoDB (Mongoose)
- **Icons:** Lucide React
- **Charts:** Recharts
- **Routing:** React Router v7

## Getting Started

Follow these steps to set up the project locally.

### Prerequisites

- Node.js v18 or higher
- npm or yarn
- MongoDB Instance (Local or MongoDB Atlas)

### Installation

1. Clone the repository

```bash
git clone https://github.com/yourusername/expense-tracker.git
cd expense-tracker
```

2. Setup the Server

```bash
cd server
npm install
```

Create a `.env` file in the `server` directory and configure:

```env
PORT=5000
MONGODB_URI=mongodb://localhost:27017/expense-tracker
CLIENT_URL=http://localhost:5173
JWT_SECRET=your_jwt_secret
JWT_REFRESH_SECRET=your_refresh_secret
GOOGLE_CLIENT_ID=your_google_client_id
```

> [!TIP]
> **MongoDB Atlas Users:** If you experience `querySrv ECONNREFUSED` crashes during local development, your network or ISP may be blocking DNS SRV records. To bypass this, go to your Atlas dashboard -> Connect -> Drivers, toggle off **SRV Connection String**, and use the provided standard connection string.

Start the server:
```bash
npm run dev
```

3. Setup the Client

Open a new terminal:
```bash
cd client
npm install
```

Create a `.env` file in the `client` directory and configure:

```env
VITE_API_URL=http://localhost:5000/api
VITE_GOOGLE_CLIENT_ID=your_google_client_id
```

Start the client:
```bash
npm run dev
```

4. Open the app
   Visit `http://localhost:5173` in your browser.

## Scripts

You can run these scripts from within the respective `client` or `server` directories.

- `npm run dev` – Starts the development server
- `npm run build` – Type-checks and builds the app for production
- `npm run lint` – Runs ESLint for code quality checks

## Project Structure

```
expense-tracker/
├── client/           # React Frontend
│   ├── src/
│   │   ├── components/  # Dedicated UI hub containing all visual elements
│   │   ├── contexts/    # React Context providers (Auth, Theme)
│   │   ├── pages/       # Top-level route views (Dashboard, Login, Privacy)
│   │   ├── services/    # API integration and export logic
│   │   └── utils/       # Helper utilities and formatters
│   └── vite.config.ts
└── server/           # Express/Node Backend
    ├── src/
    │   ├── controllers/ # Route handlers
    │   ├── middleware/  # Auth, Error handling, Rate limiting
    │   ├── models/      # Mongoose Schemas
    │   ├── routes/      # Express API Routes
    │   └── utils/       # Server utilities
    └── app.ts           # Express App Configuration
```

## Privacy and Terms

The application includes dedicated Privacy Policy and Terms of Service pages. User data is securely stored in MongoDB and is accessible only to the authenticated user via secure JWT tokens.

## License

This project is licensed under the MIT License. See the `LICENSE` file for details.
