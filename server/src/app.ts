import express from "express";
import cors from "cors";
import helmet from "helmet";
import compression from "compression";
import cookieParser from "cookie-parser";
import { rateLimiter } from "./middleware/rateLimiter";
import { errorHandler } from "./middleware/errorHandler";
import routes from "./routes";
import morgan from "morgan";
import { logger } from "./utils/logger";

const app = express();

// Trust proxy for rate limiting behind reverse proxies (Render, Vercel, etc.)
app.set("trust proxy", 1);

// Security headers
app.use(
  helmet({
    crossOriginOpenerPolicy: { policy: "same-origin-allow-popups" },
  }),
);

// CORS — allow only your frontend origin
const clientUrls = process.env.CLIENT_URL || "http://localhost:5173";
const allowedOrigins = clientUrls.split(",").map((url) => url.trim());

app.use(
  cors({
    origin: allowedOrigins,
    credentials: true, // Required for httpOnly cookies
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  }),
);

app.use(compression());
app.use(express.json({ limit: "10kb" })); // Prevent payload bombs
app.use(express.urlencoded({ extended: true, limit: "10kb" }));
app.use(cookieParser());

// HTTP request logging
app.use(
  morgan("combined", { stream: { write: (msg) => logger.info(msg.trim()) } }),
);

// Rate limiting: 100 requests per 15 minutes per IP
app.use("/api", rateLimiter);

// All API routes
app.use("/api", routes);

// 404 handler
app.use((req, res) => {
  res.status(404).json({ success: false, message: "Route not found" });
});

// Global error handler (must be last)
app.use(errorHandler);

export default app;
