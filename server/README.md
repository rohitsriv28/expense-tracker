# CashFlow Server

This is the custom backend API for CashFlow, built to handle secure authentication, user data isolation, and robust financial tracking.

## Technology Stack

- **Runtime**: Node.js
- **Framework**: Express
- **Database**: MongoDB (via Mongoose)
- **Language**: TypeScript

## Key Features

- **JWT Authentication:** Secure `httpOnly` cookie-based authentication via Google OAuth.
- **Data Isolation:** Strict Mongoose schemas with user-bound queries for multi-tenant security.
- **Security Middlewares:** Preconfigured with Helmet, CORS, and Rate Limiting for production readiness.

## Setup Instructions

1. Install dependencies:
   ```bash
   npm install
   ```

2. Create a `.env` file based on your environment:
   ```env
   PORT=5000
   MONGODB_URI=mongodb://localhost:27017/expense-tracker
   CLIENT_URL=http://localhost:5173
   JWT_SECRET=your_jwt_secret
   JWT_REFRESH_SECRET=your_refresh_secret
   GOOGLE_CLIENT_ID=your_google_client_id
   ```

3. Start the development server:
   ```bash
   npm run dev
   ```

## Scripts

- `npm run dev`: Start development server using `ts-node-dev`.
- `npm run build`: Compile TypeScript to JavaScript.
- `npm start`: Run the compiled production server.
