import cron from "node-cron";
import path from "path";
import { fileURLToPath } from "url";
import type { AppConfig } from "../config.js";
import { TwitterPoster } from "../twitter.js";
import { formatMasternodeAwarenessTweet } from "../xdcValidator/masternodeAwarenessFormatter.js";
import { getLatestValidatorSnapshot } from "../store/getLatestValidatorSnapshot.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const MASTERNODE_IMAGE = path.resolve(
  __dirname,
  "..",
  "assets",
  "masternode.jpg"
);

//Monthly masternode awareness tweet (Runs once per month)
 
export function scheduleMonthlyMasternodeAwareness(
  cfg: AppConfig,
  twitter: TwitterPoster
): void {
  if (!cfg.enableMonthlyMasternodeAwareness) {
    console.log("[SCHEDULER] Monthly masternode awareness disabled");
    return;
  }

  // 30 0 1 * * → 1st day of month, 00:30 UTC
  cron.schedule(
    //"*/1 * * * *", for testing
    "30 0 1 * *",
    async () => {
      try {
        const snapshot = getLatestValidatorSnapshot();

        if (!snapshot || snapshot.active === null || snapshot.standby === null) {
          console.log(
            "[SCHEDULER] Monthly masternode awareness skipped: No snapshot data"
          );
          return;
        }

        const text = formatMasternodeAwarenessTweet({
          active: snapshot.active,   
          standby: snapshot.standby,
        });

        await twitter.postTweet(text, MASTERNODE_IMAGE);

        console.log("[SCHEDULER] Monthly masternode awareness tweet sent");
      } catch (err) {
        console.error(
          "[SCHEDULER] Monthly masternode awareness failed:",
          err
        );
      }
    },
    { timezone: "UTC" }
  );

  console.log("[SCHEDULER] Monthly masternode awareness scheduled");
}
