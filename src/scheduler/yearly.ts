import cron from "node-cron";
import path from "path";
import { fileURLToPath } from "url";
import type { AppConfig } from "../config.js";
import { TwitterPoster } from "../twitter.js";
import { computeYearlyValidatorStats } from "../stats/yearlyValidatorStats.js";
import { formatYearlyValidatorTweet } from "../xdcValidator/yearlyTweetFormatter.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const YEARLY_STATS_IMAGE = path.resolve(
  __dirname,
  "..",
  "assets",
  "weekstats.jpg"
);

//Schedules the yearly validator stats tweet
 
export function scheduleYearlyValidatorStats(
  cfg: AppConfig,
  twitter: TwitterPoster
): void {
  if (!cfg.enableYearlyStats) {
    console.log("[SCHEDULER] Yearly stats scheduler disabled");
    return;
  }

  // ┌──────────── minute (20)
  // │ ┌────────── hour (0 = midnight)
  // │ │ ┌──────── day of month (1st)
  // │ │ │ ┌────── month (January)
  // │ │ │ │ ┌──── day of week
  // │ │ │ │ │
  // 20 0 1 1 *  → Jan 1st, 00:20 UTC

  cron.schedule(
    //"/*1 * * * *", for testing
    "20 0 1 1 *",
    async () => {
      try {
        const stats = computeYearlyValidatorStats();

        if (!stats) {
          console.log("[SCHEDULER] Yearly stats skipped (not enough data)");
          return;
        }

        const text = formatYearlyValidatorTweet(stats);
        await twitter.postTweet(text, YEARLY_STATS_IMAGE);

        console.log("[SCHEDULER] Yearly validator stats tweet sent");
      } catch (err) {
        console.error("[SCHEDULER] Yearly stats job failed:", err);
      }
    },
    {
      timezone: "UTC"
    }
  );

  console.log("[SCHEDULER] Yearly validator stats scheduled (Jan 1st UTC)");
}
