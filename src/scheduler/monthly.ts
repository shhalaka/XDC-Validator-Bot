import cron from "node-cron";
import path from "path";
import { fileURLToPath } from "url";
import type { AppConfig } from "../config.js";
import { TwitterPoster } from "../twitter.js";
import { computeMonthlyValidatorStats } from "../stats/monthlyValidatorStats.js";
import { formatMonthlyValidatorTweet } from "../xdcValidator/monthlyTweetFormatter.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const MONTHLY_STATS_IMAGE = path.resolve(
  __dirname,
  "..",
  "assets",
  "weekstats.jpg"
);

// Schedules the monthly validator stats tweet

export function scheduleMonthlyValidatorStats(
  cfg: AppConfig,
  twitter: TwitterPoster
): void {
  if (!cfg.enableMonthlyStats) {
    console.log("[SCHEDULER] Monthly stats scheduler disabled");
    return;
  }

  // ┌──────────── minute (15)
  // │ ┌────────── hour (0 = midnight)
  // │ │ ┌──────── day of month (1st)
  // │ │ │ ┌────── month
  // │ │ │ │ ┌──── day of week
  // │ │ │ │ │
  // 15 0 1 * *  → 1st day of month, 00:15 UTC
  
  cron.schedule(
    //"*/1 * * * *",  for testing
    "15 0 1 * *",
    async () => {
      try {
        const stats = computeMonthlyValidatorStats();

        if (!stats) {
          console.log("[SCHEDULER] Monthly stats skipped (not enough data)");
          return;
        }

        const text = formatMonthlyValidatorTweet(stats);
        await twitter.postTweet(text, MONTHLY_STATS_IMAGE);

        console.log("[SCHEDULER] Monthly validator stats tweet sent");
      } catch (err) {
        console.error("[SCHEDULER] Monthly stats job failed:", err);
      }
    },
    {
      timezone: "UTC"
    }
  );

  console.log("[SCHEDULER] Monthly validator stats scheduled (1st of month UTC)");
}
