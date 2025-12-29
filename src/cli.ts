import fs from "node:fs";
import dotenv from "dotenv";
import { loadConfig } from "./config.js";
import { writeDailyValidatorSnapshot } from "./store/validatorSnapshots.js";
import { ethers } from "ethers";
import { fetchValidatorNetworkStats } from "./utils/fetchValidatorNetworkStats.js";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const WEEKLY_STATS_IMAGE = path.resolve(
  __dirname,
  "assets",
  "weekstats.jpg"
  );

async function main() {
  const explicitEnvFile = process.env.ENV_FILE;
  const envFile =
    explicitEnvFile ||
    (fs.existsSync(".env")
      ? ".env"
      : fs.existsSync("config/local.env")
        ? "config/local.env"
        : undefined);

  if (envFile) dotenv.config({ path: envFile });
  else dotenv.config();

  const cfg = loadConfig();  // load once for consistency

  const command = process.argv[2];

  switch (command) {
    case "snapshot-validators": {
      const rpcUrl = process.env.RPC_HTTP_URL;
      const contractAddress = process.env.CONTRACT_ADDRESS;

      if (!rpcUrl || !contractAddress) {
        throw new Error("RPC_HTTP_URL or CONTRACT_ADDRESS missing in env");
      }

      const provider = new ethers.JsonRpcProvider(rpcUrl);

      // fetch validator stats from RPC using given contract
      await fetchValidatorNetworkStats(provider, contractAddress);

      // snapshot the populated validatorDailyStats
      const snapshotPath = writeDailyValidatorSnapshot();

      console.log(`[CLI] Validator snapshot written to ${snapshotPath}`);
      break;
    }

    case "dry-run": {
      console.log("[CLI] Dry run mode — no actions executed");
      break;
    }
    //Weekly validator stats tweet
    case "weekly-validator-stats": {
      const { computeWeeklyValidatorStats } =
        await import("./stats/weeklyValidatorStats.js");
      const { formatWeeklyValidatorTweet } =
        await import("./xdcValidator/weeklyTweetFormatter.js");
      const { TwitterPoster } = 
        await import("./twitter.js");
      
      const stats = computeWeeklyValidatorStats();
      if (!stats) {
        console.log("No weekly stats available yet.");
        break;
      }

      const tweet = formatWeeklyValidatorTweet(stats);

      const twitter = new TwitterPoster({
        appKey: cfg.twitterAppKey ?? "",
        appSecret: cfg.twitterAppSecret ?? "",
        accessToken: cfg.twitterAccessToken ?? "",
        accessSecret: cfg.twitterAccessSecret ?? "",
        dryRun: cfg.dryRun
      });

      await twitter.postTweet(tweet, WEEKLY_STATS_IMAGE);
      console.log("[CLI] Weekly validator stats tweet sent");
      break;    
    }

    //Monthly validator stats tweet
    case "monthly-validator-stats": {
      const { computeMonthlyValidatorStats } =
        await import("./stats/monthlyValidatorStats.js");
      const { formatMonthlyValidatorTweet } =
        await import("./xdcValidator/monthlyTweetFormatter.js");
      const { TwitterPoster } =
        await import("./twitter.js");

      const stats = computeMonthlyValidatorStats();
      if (!stats) {
        console.log("No monthly stats available yet.");
        break;
      }

      const tweet = formatMonthlyValidatorTweet(stats);

      const twitter = new TwitterPoster({
        appKey: cfg.twitterAppKey ?? "",
        appSecret: cfg.twitterAppSecret ?? "",
        accessToken: cfg.twitterAccessToken ?? "",
        accessSecret: cfg.twitterAccessSecret ?? "",
        dryRun: cfg.dryRun
      });

      await twitter.postTweet(tweet, WEEKLY_STATS_IMAGE);
      console.log("[CLI] Monthly validator stats tweet sent");
      break;
    }

    //Yearly validator stats tweet
    case "yearly-validator-stats": {
      const { computeYearlyValidatorStats } =
        await import("./stats/yearlyValidatorStats.js");
      const { formatYearlyValidatorTweet } =
        await import("./xdcValidator/yearlyTweetFormatter.js");
      const { TwitterPoster } =
        await import("./twitter.js");

      const stats = computeYearlyValidatorStats();
      if (!stats) {
        console.log("No yearly stats available yet.");
        break;
      }

      const tweet = formatYearlyValidatorTweet(stats);

      const twitter = new TwitterPoster({
        appKey: cfg.twitterAppKey ?? "",
        appSecret: cfg.twitterAppSecret ?? "",
        accessToken: cfg.twitterAccessToken ?? "",
        accessSecret: cfg.twitterAccessSecret ?? "",
        dryRun: cfg.dryRun
      });

      await twitter.postTweet(tweet, WEEKLY_STATS_IMAGE);
      console.log("[CLI] Yearly validator stats tweet sent");
      break;
    }

    default:
      console.error("Unknown command");
      console.error("Available commands:");
      console.error("weekly-validator-stats");
      console.error("monthly-validator-stats");
      console.error("yearly-validator-stats");
      process.exitCode = 1;
  }
}

main().catch((err) => {
  console.error(err);
  process.exitCode = 1;
});
