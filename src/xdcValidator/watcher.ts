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
  setActiveValidators,
  recordVote,
  recordUnvote,
  recordWithdraw,
  getActiveValidators
} from "../stats/validatorStats.js";

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
  const provider = new ethers.JsonRpcProvider(cfg.rpcHttpUrl);
  const iface = new ethers.Interface(XDC_VALIDATOR_ABI);

  const validatorContract = new ethers.Contract(
    cfg.contractAddress,
    XDC_VALIDATOR_ABI,
    provider
  );

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

      const text = `
  📊 XDC Validator Activity

  ➕  Proposed: ${validatorDailyStats.proposed}
  ➖ Resigned: ${validatorDailyStats.resigned}
  🗳 Votes: ${validatorDailyStats.vote}
  ↩️ Unvotes: ${validatorDailyStats.unvote}
  💸 Withdrawals: ${validatorDailyStats.withdraw}

  🟢 Active Validators: ${getActiveValidators()}

  #XDCNetwork #Validators #XDC #BuildOnXDC
  `.trim();

    await twitter.postTweet(text);
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

  const getLatestBlock = async () =>
    await pRetry(() => provider.getBlockNumber(), { retries: 5 });

  const getLogs = async (fromBlock: number, toBlock: number) =>
    await pRetry(
      () =>
        provider.getLogs({
          address: cfg.contractAddress,
          fromBlock,
          toBlock
        }),
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
      let parsed;
      try {
        parsed = iface.parseLog(log);
      } catch {
        continue;
      }

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
          active: getActiveValidators()
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

    await sleep(cfg.pollIntervalMs);
  }
}
