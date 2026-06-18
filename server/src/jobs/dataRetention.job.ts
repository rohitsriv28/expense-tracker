import cron from "node-cron";
import mongoose from "mongoose";
import crypto from "crypto";
import Expense from "../models/Expense.model";
import User from "../models/User.model";
import { logger } from "../utils/logger";

const instanceId = crypto.randomBytes(16).toString("hex");

async function acquireLock(lockKey: string): Promise<boolean> {
  try {
    const db = mongoose.connection.db;
    if (!db) return false;

    const twoHoursAgo = new Date(Date.now() - 2 * 60 * 60 * 1000);

    await db
      .collection("_cron_locks")
      .findOneAndUpdate(
        { _id: lockKey as any, lockedAt: { $lt: twoHoursAgo } },
        { $set: { lockedAt: new Date(), instanceId } },
        { upsert: true },
      );
    return true;
  } catch (error: any) {
    if (error.code === 11000) {
      return false; // Duplicate key error - another instance holds fresh lock
    }
    return false;
  }
}

async function releaseLock(lockKey: string): Promise<void> {
  try {
    const db = mongoose.connection.db;
    if (!db) return;
    await db
      .collection("_cron_locks")
      .deleteOne({ _id: lockKey as any, instanceId });
  } catch (err) {}
}

export function startDataRetentionJob() {
  // Run daily at 02:00 UTC
  cron.schedule("0 2 * * *", async () => {
    const lockKey = "data-retention-job";
    const acquired = await acquireLock(lockKey);
    if (!acquired) {
      logger.debug(`[DataRetention] Lock not acquired. Skipping run.`);
      return;
    }
    logger.info(
      `[DataRetention] Lock acquired by instance ${instanceId}. Starting scheduled cleanup...`,
    );
    let totalDeleted = 0;

    try {
      const cursor = User.find({}, "_id settings").cursor();
      const batchSize = 10;
      let usersBatch = [];
      let doc;

      while ((doc = await cursor.next())) {
        usersBatch.push(doc);
        if (usersBatch.length === batchSize) {
          const deletePromises = usersBatch.map(async (user) => {
            const retentionMonths = user.settings?.dataRetentionMonths ?? 12;
            const cutoff = new Date();
            cutoff.setMonth(cutoff.getMonth() - retentionMonths);

            const result = await Expense.deleteMany({
              userId: user._id,
              date: { $lt: cutoff },
            });

            return result.deletedCount;
          });

          const counts = await Promise.all(deletePromises);
          totalDeleted += counts.reduce((acc, count) => acc + count, 0);
          usersBatch = [];
        }
      }

      if (usersBatch.length > 0) {
        const deletePromises = usersBatch.map(async (user) => {
          const retentionMonths = user.settings?.dataRetentionMonths ?? 12;
          const cutoff = new Date();
          cutoff.setMonth(cutoff.getMonth() - retentionMonths);

          const result = await Expense.deleteMany({
            userId: user._id,
            date: { $lt: cutoff },
          });

          return result.deletedCount;
        });

        const counts = await Promise.all(deletePromises);
        totalDeleted += counts.reduce((acc, count) => acc + count, 0);
      }

      logger.info(
        `[DataRetention] Cleanup complete. Deleted ${totalDeleted} records.`,
      );
    } catch (error) {
      logger.error("[DataRetention] Cleanup failed:", error);
    } finally {
      await releaseLock(lockKey);
      logger.info(`[DataRetention] Lock released by instance ${instanceId}.`);
    }
  });

  logger.info("[DataRetention] Job scheduled (daily 02:00 UTC)");
}
