import cron from "node-cron";
import path from "path";
import { fileURLToPath } from "url";
import type { AppConfig } from "../config.js";
import { TwitterPoster } from "../twitter.js";
import { computeWeeklyValidatorStats } from "../stats/weeklyValidatorStats.js";
import { formatWeeklyValidatorTweet } from "../xdcValidator/weeklyTweetFormatter.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const WEEKLY_STATS_IMAGE = path.resolve(
  __dirname,
  "..",
  "assets",
  "weekstats.jpg"
);


 //Schedules the weekly validator stats tweet.
 
export function scheduleWeeklyValidatorStats(
  cfg: AppConfig,
  twitter: TwitterPoster
): void {
  if (!cfg.enableWeeklyStats) {
    console.log("[SCHEDULER] Weekly stats scheduler disabled");
    return;
  }

  // ┌──────────── minute (10)
  // │ ┌────────── hour (0 = midnight)
  // │ │ ┌──────── day of month
  // │ │ │ ┌────── month
  // │ │ │ │ ┌──── day of week (0 = Sunday)
  // │ │ │ │ │
  // 10 0 * * 0  → Sunday 00:10 UTC
  
  cron.schedule(
    //"*/1 * * * *", for testing
    "10 0 * * 0",
    async () => {
      try {
        const stats = computeWeeklyValidatorStats();

        if (!stats) {
          console.log("[SCHEDULER] Weekly stats skipped (not enough data)");
          return;
        }

        const text = formatWeeklyValidatorTweet(stats);
        await twitter.postTweet(text, WEEKLY_STATS_IMAGE);

        console.log("[SCHEDULER] Weekly validator stats tweet sent");
      } catch (err) {
        console.error("[SCHEDULER] Weekly stats job failed:", err);
      }
    },
    {
      timezone: "UTC"
    }
  );

  console.log("[SCHEDULER] Weekly validator stats scheduled (Sunday UTC)");
}
