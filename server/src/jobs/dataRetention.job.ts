import cron from "node-cron";
import Expense from "../models/Expense.model";
import User from "../models/User.model";
import { logger } from "../utils/logger";

export function startDataRetentionJob() {
  // Run daily at 02:00 UTC
  cron.schedule("0 2 * * *", async () => {
    logger.info("[DataRetention] Starting scheduled cleanup...");
    let totalDeleted = 0;

    try {
      const batchSize = 10;
      let skip = 0;
      let hasMore = true;

      while (hasMore) {
        const users = await User.find({}, "_id settings")
          .skip(skip)
          .limit(batchSize)
          .lean();

        if (users.length === 0) {
          hasMore = false;
          break;
        }

        const deletePromises = users.map(async (user) => {
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

        skip += batchSize;
      }

      logger.info(
        `[DataRetention] Cleanup complete. Deleted ${totalDeleted} records.`,
      );
    } catch (error) {
      logger.error("[DataRetention] Cleanup failed:", error);
    }
  });

  logger.info("[DataRetention] Job scheduled (daily 02:00 UTC)");
}
