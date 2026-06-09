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
  .then(() => {
    logger.info("Connected to MongoDB");
    startDataRetentionJob();
    app.listen(PORT, () => {
      logger.info(`Server is running on port ${PORT}`);
    });
  })
  .catch((err) => {
    logger.error("Failed to connect to MongoDB", err);
    process.exit(1);
  });
