import type { AppConfig } from "../config.js";
import { TwitterPoster } from "../twitter.js";
import { scheduleWeeklyValidatorStats } from "./weekly.js";

export function startScheduler(
  _cfg: AppConfig,
  _twitter: TwitterPoster
): void {
  scheduleWeeklyValidatorStats(_cfg, _twitter);
}
