# CashFlow - Modern Expense Tracker

<p align="center">
  <img height="24" src="https://ziadoua.github.io/m3-Markdown-Badges/badges/React/react1.svg" />
  <img height="24" src="https://ziadoua.github.io/m3-Markdown-Badges/badges/TypeScript/typescript1.svg" />
  <img height="24" src="https://ziadoua.github.io/m3-Markdown-Badges/badges/TailwindCSS/tailwindcss1.svg" />
  <img height="24" src="https://ziadoua.github.io/m3-Markdown-Badges/badges/ViteJS/vitejs1.svg" />
  <img height="24" src="https://ziadoua.github.io/m3-Markdown-Badges/badges/Firebase/firebase1.svg" />
</p>

CashFlow is a modern, offline-first personal expense tracking application designed to help users record, analyze, and understand their spending. It combines a polished user interface with robust data handling, real-time synchronization, and professional reporting to deliver a reliable day-to-day finance companion.

The project has evolved through multiple iterations, with significant improvements in performance, usability, and report generation, making it suitable for real-world personal finance tracking.

## Key Features

- **Modern and responsive interface**
  Mobile-first UI built with Tailwind CSS v4, featuring refined spacing, smooth transitions, glassmorphism elements, and a premium visual style.

- **Secure authentication**
  Google Sign-In powered by Firebase Authentication ensures simple and secure access while keeping user data isolated.

- **Interactive dashboard**
  A centralized dashboard showing total spending, recent activity, trends, and category-wise breakdowns using Recharts.

- **Comprehensive expense management**
  Full create, read, update, and delete workflows for expenses.

  - Custom expense categories
  - Flexible date-range filters (Today, Week, Month, Custom)
  - Sorting and search for fast retrieval

- **Advanced visual analytics**
  Clean, readable charts that help users identify spending patterns and make informed financial decisions.

- **Professional PDF reports**
  High-quality, exportable PDF reports generated using a custom PDF engine built with `pdf-lib`, designed for clarity, structure, and print-ready output.

- **Dark mode support**
  Fully system-aware light and dark themes for comfortable usage in all lighting conditions.

- **Offline-first PWA experience**
  Progressive Web App support allows CashFlow to work offline, cache data locally, and be installed like a native app.

- **Reliable data synchronization**
  Real-time syncing across devices using Firestore, ensuring data consistency when connectivity is restored.

## Technology Stack

- **Frontend framework:** React 19
- **Build tool:** Vite
- **Language:** TypeScript
- **Styling:** Tailwind CSS v4
- **Backend-as-a-Service:** Firebase (Authentication, Firestore, Hosting)
- **Charts:** Recharts
- **Icons:** Lucide React
- **Routing:** React Router v7

## Getting Started

Follow the steps below to run the project locally.

### Prerequisites

- Node.js v18 or higher
- npm or yarn
- A Firebase project

### Installation

1. Clone the repository

```bash
git clone https://github.com/yourusername/expense-tracker.git
cd expense-tracker
```

2. Install dependencies

```bash
npm install
```

3. Configure Firebase

- Create a project in the Firebase Console
- Enable Google Authentication
- Enable Firestore Database
- Create a `.env.local` file in the project root and add:

```env
VITE_FIREBASE_API_KEY=your_api_key
VITE_FIREBASE_AUTH_DOMAIN=your_project_id.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_project_id.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
VITE_FIREBASE_APP_ID=your_app_id
```

4. Start the development server

```bash
npm run dev
```

5. Open the app
   Visit `http://localhost:5173` in your browser.

## Scripts

- `npm run dev` – Starts the development server
- `npm run build` – Type-checks and builds the app for production
- `npm run lint` – Runs ESLint for code quality checks
- `npm run preview` – Previews the production build locally

## Project Structure

```
src/
├── components/       # Reusable UI components
├── context/          # Global state and theme providers
├── hooks/            # Custom React hooks
├── pages/            # Application pages
├── services/         # Firebase logic and PDF export engine
├── utils/            # Helper utilities
├── App.tsx           # Main application with routing
├── main.tsx          # Application entry point
└── firebase.ts       # Firebase configuration
```

## Privacy and Terms

CashFlow includes dedicated Privacy Policy and Terms of Service pages to ensure transparency. All user data is securely stored in Firebase and is accessible only to the authenticated user.
