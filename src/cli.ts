import fs from "node:fs";
import dotenv from "dotenv";
import { loadConfig } from "./config.js";
import { writeDailyValidatorSnapshot } from "./store/validatorSnapshots.js";
import { ethers } from "ethers";
import { fetchValidatorNetworkStats } from "./utils/fetchValidatorNetworkStats.js";

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

  loadConfig(); // load once for consistency

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
      const path = writeDailyValidatorSnapshot();

      console.log(`[CLI] Validator snapshot written to ${path}`);
      break;
    }

    case "dry-run": {
      console.log("[CLI] Dry run mode — no actions executed");
      break;
    }

    case "weekly-validator-stats": {
      const { computeWeeklyValidatorStats } =
        await import("./stats/weeklyValidatorStats.js");
      const { formatWeeklyValidatorTweet } =
        await import("./xdcValidator/weeklyTweetFormatter.js");

      const stats = computeWeeklyValidatorStats();
      if (!stats) {
        console.log("No weekly stats available yet.");
        break;
      }

      const tweet = formatWeeklyValidatorTweet(stats);
      console.log(tweet);
      break;
    }

    default:
      console.error("Unknown command");
      console.error("Available commands:");
      console.error("  snapshot-validators");
      console.error("  dry-run");
      process.exitCode = 1;
  }
}

main().catch((err) => {
  console.error(err);
  process.exitCode = 1;
});
