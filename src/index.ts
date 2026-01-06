import fs from "node:fs";
import dotenv from "dotenv";
import { loadConfig } from "./config.js";
import { runXdcValidatorWatcher } from "./xdcValidator/watcher.js";
import { ethers } from "ethers";
import { fetchValidatorNetworkStats } from "./utils/fetchValidatorNetworkStats.js";       
import { setNetworkValidatorStats } from "./stats/validatorStats.js";
import { startScheduler } from "./scheduler/index.js";
import { TwitterPoster } from "./twitter.js";

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

  const cfg = loadConfig();

  //twitter client (watcher+scheduler)

  const twitter = new TwitterPoster({
    appKey: cfg.twitterAppKey!,
    appSecret: cfg.twitterAppSecret!,
    accessToken: cfg.twitterAccessToken!,
    accessSecret: cfg.twitterAccessSecret!,
    dryRun: cfg.dryRun,
  });

  //start scheduler
  startScheduler(cfg, twitter);
  
  //network state
  const provider = new ethers.JsonRpcProvider(process.env.RPC_HTTP_URL!);
  const contractAddress = process.env.CONTRACT_ADDRESS!;

  const network = await fetchValidatorNetworkStats(provider, contractAddress);

  setNetworkValidatorStats({
    // active & standby come from snapshots / watcher logic
    active: null as any,   // watcher will update these
    standby: null as any,
    owners: network.owners,
  });

  await runXdcValidatorWatcher(cfg); //start watcher
}

main().catch((err) => {
  console.error(err);
  process.exitCode = 1;
});