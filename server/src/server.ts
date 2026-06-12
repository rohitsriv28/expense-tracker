import dotenv from "dotenv";
dotenv.config();

import mongoose from "mongoose";
import app from "./app";
import { logger } from "./utils/logger";
import { startDataRetentionJob } from "./jobs/dataRetention.job";

const PORT = process.env.PORT || 5000;
const MONGODB_URI =
  process.env.MONGODB_URI || "mongodb://localhost:27017/cashflow";

mongoose
  .connect(MONGODB_URI)
  .then(async () => {
    logger.info("Connected to MongoDB");
    try {
      await mongoose.connection.db?.collection("_cron_locks").createIndex(
        { lockedAt: 1 },
        { expireAfterSeconds: 7200, background: true }
      );
    } catch (e) {}
    startDataRetentionJob();
    const server = app.listen(PORT, () => {
      logger.info(`Server is running on port ${PORT}`);
    });

    const shutdown = async (signal: string) => {
      logger.info(`Received ${signal}. Graceful shutdown initiated...`);

      server.close(async () => {
        logger.info("HTTP server closed.");
        try {
          await mongoose.connection.close();
          logger.info("MongoDB connection closed.");
        } catch (err) {
          logger.error("Error closing MongoDB connection:", err);
        }
        process.exit(0);
      });

      // Force exit after 10 seconds if graceful shutdown hangs
      setTimeout(() => {
        logger.error("Graceful shutdown timed out. Forcing exit.");
        process.exit(1);
      }, 10_000);
    };

    process.on("SIGTERM", () => shutdown("SIGTERM"));
    process.on("SIGINT", () => shutdown("SIGINT"));
  })
  .catch((err) => {
    logger.error("Failed to connect to MongoDB", err);
    process.exit(1);
  });
