import { schedule } from "node-cron";
import type { AppConfig } from "../config.js";
import { TwitterPoster } from "../twitter.js";
import { scheduleMonthlyValidatorStats } from "./monthly.js";
import { scheduleWeeklyValidatorStats } from "./weekly.js";
import { scheduleYearlyValidatorStats } from "./yearly.js";
import { scheduleMonthlyMasternodeAwareness } from "./masternodeAwarenessMonthly.js";

export function startScheduler(
  _cfg: AppConfig,
  _twitter: TwitterPoster
): void {
  scheduleWeeklyValidatorStats(_cfg, _twitter);
  scheduleMonthlyValidatorStats(_cfg, _twitter);
  scheduleYearlyValidatorStats(_cfg, _twitter);

  scheduleMonthlyMasternodeAwareness(_cfg, _twitter);
}
