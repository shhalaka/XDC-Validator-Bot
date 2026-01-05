import { ethers, type Log } from "ethers";
import pRetry from "p-retry";
import path from "path";
import { fileURLToPath } from "url";
import { XDC_VALIDATOR_ABI } from "../abi/xdcValidator.js";
import type { AppConfig } from "../config.js";
import { CheckpointStore } from "../store/checkpoint.js";
import { sleep } from "../utils/sleep.js";
import { TwitterPoster } from "../twitter.js";
import { formatTweetForLog } from "./tweetFormatter.js";
import {
  recordMint,
  recordBurn,
  recordTransfer,
  dailyStats
} from "../stats/dailyStats.js";
import {
  recordResignedValidator,
  recordProposedValidator,
  validatorDailyStats,
  recordVote,
  recordUnvote,
  recordWithdraw,
} from "../stats/validatorStats.js";
import { fetchValidatorNetworkStats } from "../utils/fetchValidatorNetworkStats.js";
import { writeDailyValidatorSnapshot, readLastValidatorSnapshot } from "../store/validatorSnapshots.js";


const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const ZERO_ADDRESS = "0x0000000000000000000000000000000000000000";

function sortLogs(a: Log, b: Log): number {
  const ab = a.blockNumber ?? 0;
  const bb = b.blockNumber ?? 0;
  if (ab !== bb) return ab - bb;

  const atx = a.transactionIndex ?? 0;
  const btx = b.transactionIndex ?? 0;
  if (atx !== btx) return atx - btx;

  return (a.index ?? 0) - (b.index ?? 0);
}

export async function runXdcValidatorWatcher(cfg: AppConfig): Promise<void> {
  let lastSnapshotDate: string | null = null;

  function todayUTC(): string {
    return new Date().toISOString().slice(0, 10);
  }

  const provider = new ethers.JsonRpcProvider(cfg.rpcHttpUrl);
  const iface = new ethers.Interface(XDC_VALIDATOR_ABI);

  const store = new CheckpointStore({ filePath: ".data/checkpoint.json" });

  const twitter = new TwitterPoster({
    appKey: cfg.twitterAppKey ?? "",
    appSecret: cfg.twitterAppSecret ?? "",
    accessToken: cfg.twitterAccessToken ?? "",
    accessSecret: cfg.twitterAccessSecret ?? "",
    dryRun: cfg.dryRun
  });

  // Automated validator stats tweet (TEMP / DEMO)
  const VALIDATOR_STATS_INTERVAL_MS = 2 * 60 * 1000; // 2 mins testing
  const DEMO_FORCE_TWEET = true; // TEMP: force one stats tweet for demo

  setInterval(async () => {
    try {
    // Skip tweeting if there is no validator activity
      if (
        !DEMO_FORCE_TWEET &&
        validatorDailyStats.proposed === 0 &&
        validatorDailyStats.resigned === 0 &&
        validatorDailyStats.vote === 0 &&
        validatorDailyStats.unvote === 0 &&
        validatorDailyStats.withdraw === 0
      ) {
        return;
      }
      
      // Fetch live network validator stats (active / total / owners)
      try {
        await fetchValidatorNetworkStats(provider, cfg.contractAddress);
      } catch (err) {
        console.error("Failed to fetch network validator stats:", err);
    }

      const text = `
📊 XDC Validator Activity 📊

➕ Proposed Today: ${validatorDailyStats.proposed}
🗳 Votes Today: ${validatorDailyStats.vote}
↩ Unvotes Today: ${validatorDailyStats.unvote}
💸 Withdrawals Today: ${validatorDailyStats.withdraw}

🟢 Network Status 

➖ Total Resigned Validators: ${validatorDailyStats.resigned}
🔹 Active Validators (Nodes): ${validatorDailyStats.active ?? "—"}
⏸ Standby Validators: ${validatorDailyStats.standby ?? "—"}
👤 Validator Owners: ${validatorDailyStats.owners ?? "—"}

#XDCNetwork #Validators #XDC 
`.trim();

    await twitter.postTweet(text, VALIDATOR_STATS_IMAGE);
  } catch (err) {
    console.error("Validator stats tweet failed:", err);
  }
}, VALIDATOR_STATS_INTERVAL_MS);

  const DEFAULT_ALERT_IMAGE = path.resolve(
    __dirname,
    "..",
    "assets",
    "alert.jpg"
  );

  const VALIDATOR_STATS_IMAGE = path.resolve(
    __dirname,
    "..",
    "assets",
    "stat.jpeg"
  );


  const getLatestBlock = async () =>
    await pRetry(() => provider.getBlockNumber(), { retries: 5 });

  const getLogs = async (fromBlock: number, toBlock: number) =>
    await pRetry(
      async () => {
        const logs = await provider.getLogs({
          address: cfg.contractAddress,
          fromBlock,
          toBlock
        });

        // small delay to avoid RPC burst / rate limit
        await sleep(100);

        return logs;
      },
      { retries: 5 }
    );

  const latest = await getLatestBlock();
  const safeLatest = Math.max(0, latest - cfg.confirmations);

  const checkpoint = store.getLastProcessedBlock();
  let fromBlock: number;
  if (checkpoint !== undefined) fromBlock = checkpoint + 1;
  else if (cfg.startBlock !== undefined) fromBlock = cfg.startBlock;
  else fromBlock = safeLatest - 5000;

  if (fromBlock > safeLatest) fromBlock = safeLatest;

  console.log(
    `Watching XDCValidator at ${cfg.contractAddress} via ${cfg.rpcHttpUrl}`
  );

// Seed cumulative resigned count from last snapshot (if any)
  const lastSnapshot = readLastValidatorSnapshot();
  if (lastSnapshot?.resigned !== undefined) {
    validatorDailyStats.resigned = lastSnapshot.resigned;
  }

  //BOOTSTRAP VALIDATOR STATE FROM HISTORICAL EVENTS
  console.log("Bootstrapping validator state from historical events...");

  const BOOTSTRAP_CHUNK_SIZE = 2000;
  const bootstrapStart =
    store.getLastProcessedBlock() ??
    cfg.startBlock ??
    Math.max(0, safeLatest - 50_000); // sane fallback

  for (
    let start = bootstrapStart;
    start <= safeLatest;
    start += BOOTSTRAP_CHUNK_SIZE
  ) {
    const end = Math.min(start + BOOTSTRAP_CHUNK_SIZE - 1, safeLatest);

    const logs = await getLogs(start, end);

    for (const log of logs) {
      let parsed: ethers.LogDescription | null;
      try {
        parsed = iface.parseLog(log);
      } catch {
        continue;
      }
      if (!parsed) continue;

      if (parsed.name === "Resign") {
        recordResignedValidator();
      }
    }

    await sleep(300); // protect RPC
  }

  console.log("Bootstrap complete:", {
    resigned: validatorDailyStats.resigned
});

  // resume AFTER bootstrap safely
  fromBlock = safeLatest + 1;
  store.setLastProcessedBlock(safeLatest);

  while (true) {
    const tip = await getLatestBlock();
    const toTip = Math.max(0, tip - cfg.confirmations);

    if (toTip < fromBlock) {
      await sleep(cfg.pollIntervalMs);
      continue;
    }

    const toBlock = Math.min(
      toTip,
      fromBlock + Math.max(1, cfg.maxBlocksPerQuery) - 1
    );

    const logs = (await getLogs(fromBlock, toBlock)).sort(sortLogs);

    for (const log of logs) {
      let parsed: ethers.LogDescription | null;

      try {
        parsed = iface.parseLog(log);
      } catch {
        continue;
      }

      if (!parsed) continue;

      // Token stats
      if (parsed?.name === "Transfer") {
        const from = String(parsed.args.from).toLowerCase();
        const to = String(parsed.args.to).toLowerCase();
        const value = parsed.args.value as bigint;

        if (from === ZERO_ADDRESS) recordMint(value);
        else if (to === ZERO_ADDRESS) recordBurn(value);
        else recordTransfer();

        console.log("Daily token stats:", {
          mint: dailyStats.mint.toString(),
          burn: dailyStats.burn.toString(),
          transferCount: dailyStats.transferCount
        });
      }

      // Validator stats
      if (parsed?.name === "Propose") recordProposedValidator();
      if (parsed?.name === "Resign") recordResignedValidator();
      if (parsed?.name === "Vote") recordVote();
      if (parsed?.name === "Unvote") recordUnvote();
      if (parsed?.name === "Withdraw") recordWithdraw();

      if (
        parsed?.name === "Propose" ||
        parsed?.name === "Resign" ||
        parsed?.name === "Vote" ||
        parsed?.name === "Unvote" ||
        parsed?.name === "Withdraw"
      ) {
        console.log("Validator health:", {
          proposed: validatorDailyStats.proposed,
          resigned: validatorDailyStats.resigned,
          vote: validatorDailyStats.vote,
          unvote: validatorDailyStats.unvote,
          withdraw: validatorDailyStats.withdraw,
          active: validatorDailyStats.active,
          standby: validatorDailyStats.standby,
          owners: validatorDailyStats.owners
        });
      }

      const res = formatTweetForLog(iface, log, {
        nativeSymbol: cfg.nativeSymbol,
        txExplorerBase: cfg.txExplorerBase,
        maxLen: 275
      });

      if (!res) continue;
      if (store.hasEvent(res.eventId)) continue;

      await twitter.postTweet(res.text, DEFAULT_ALERT_IMAGE);
      store.markEvent(res.eventId);

      if (cfg.tweetDelayMs > 0) {
        await sleep(cfg.tweetDelayMs);
      }
    }

    store.setLastProcessedBlock(toBlock);
    fromBlock = toBlock + 1;

    // Daily validator snapshot at UTC midnight
    const currentDate = todayUTC();
    if (lastSnapshotDate !== currentDate) {
      try {
          await fetchValidatorNetworkStats(provider, cfg.contractAddress);
      } catch (err) {
        console.error("Failed to fetch network stats before snapshot:", err);
      }
      writeDailyValidatorSnapshot(currentDate);
      lastSnapshotDate = currentDate;
      console.log(`[SNAPSHOT] Daily validator snapshot written for ${currentDate}`);
    }

    await sleep(cfg.pollIntervalMs);
  }
}
