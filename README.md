# CashFlow - Modern Expense Tracker

<p align="center">
  <img height="24" src="https://ziadoua.github.io/m3-Markdown-Badges/badges/React/react1.svg" />
  <img height="24" src="https://ziadoua.github.io/m3-Markdown-Badges/badges/TypeScript/typescript1.svg" />
  <img height="24" src="https://ziadoua.github.io/m3-Markdown-Badges/badges/TailwindCSS/tailwindcss1.svg" />
  <img height="24" src="https://ziadoua.github.io/m3-Markdown-Badges/badges/ViteJS/vitejs1.svg" />
  <img height="24" src="https://ziadoua.github.io/m3-Markdown-Badges/badges/Firebase/firebase1.svg" />
</p>

CashFlow is a premium, feature-rich expense tracking application built with modern web technologies. It helps users manage their finances with a clean, responsive interface, detailed analytics, and seamless cross-device synchronization.

## Key Features

* **Modern and responsive UI**
  Built with a mobile-first approach using Tailwind CSS v4, featuring glassmorphism, smooth transitions, and a premium aesthetic.

* **Secure authentication**
  Google Sign-In integration via Firebase Authentication for secure and convenient access.

* **Interactive dashboard**
  Real-time overview of spending, expense trends, and category breakdowns using Recharts.

* **Expense management**
  Full CRUD support for tracking expenses.

  * Custom expense categories
  * Date range filters (Today, Week, Month, Custom)
  * Sorting and search capabilities

* **Visual analytics**
  Charts and graphs to clearly visualize spending habits.

* **PDF reports**
  Generate and download detailed expense reports using `pdf-lib`.

* **Dark mode**
  System-aware dark mode for comfortable viewing in any environment.

* **PWA and offline support**
  Progressive Web App functionality allows offline usage and installation on devices.

* **Real-time data sync**
  Seamless synchronization across devices using Firestore.

## Technology Stack

* **Frontend framework:** React 19
* **Build tool:** Vite
* **Language:** TypeScript
* **Styling:** Tailwind CSS v4
* **Backend-as-a-Service:** Firebase (Authentication, Firestore, Hosting)
* **Icons:** Lucide React
* **Charts:** Recharts
* **Routing:** React Router v7

## Getting Started

Follow these steps to set up the project locally.

### Prerequisites

* Node.js v18 or higher
* npm or yarn
* A Firebase project

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

* Create a project in the Firebase Console
* Enable Google Authentication
* Enable Firestore Database
* Create a `.env.local` file in the project root and add:

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

* `npm run dev` – Starts the development server
* `npm run build` – Type-checks and builds the app for production
* `npm run lint` – Runs ESLint for code quality checks
* `npm run preview` – Previews the production build locally

## Project Structure

```
src/
├── components/       # Reusable UI components
├── context/          # React Context providers
├── hooks/            # Custom React hooks
├── pages/            # Application pages
├── services/         # Firebase and PDF logic
├── utils/            # Helper utilities
├── App.tsx           # Main application with routing
├── main.tsx          # Entry point
└── firebase.ts       # Firebase configuration
```

## Privacy and Terms

The application includes dedicated Privacy Policy and Terms of Service pages. User data is securely stored in Firebase and is accessible only to the authenticated user.

## License

This project is licensed under the MIT License. See the `LICENSE` file for details.
