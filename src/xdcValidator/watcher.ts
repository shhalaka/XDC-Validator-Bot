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
  validatorDailyStats
} from "../stats/validatorStats.js";
import { getActiveValidators } from "../stats/validatorStats.js";

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

  const store = new CheckpointStore({ filePath: ".data/checkpoint.json" });

  const twitter = new TwitterPoster({
    appKey: cfg.twitterAppKey ?? "",
    appSecret: cfg.twitterAppSecret ?? "",
    accessToken: cfg.twitterAccessToken ?? "",
    accessSecret: cfg.twitterAccessSecret ?? "",
    dryRun: cfg.dryRun
  });

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

      if (parsed?.name === "Transfer") {
        const from = String(parsed.args.from).toLowerCase();
        const to = String(parsed.args.to).toLowerCase();
        const value = parsed.args.value as bigint;

        if (from === ZERO_ADDRESS) recordMint(value);
        else if (to === ZERO_ADDRESS) recordBurn(value);
        else recordTransfer();

        console.log("Daily statistics snapshot:", {
          mint: dailyStats.mint.toString(),
          burn: dailyStats.burn.toString(),
          transferCount: dailyStats.transferCount
        });
      }

      if (parsed?.name === "Propose") {
        recordProposedValidator();
      }

      if (parsed?.name === "Resign") {
        recordResignedValidator();
      }

      console.log("Validator health:", {
        proposed: validatorDailyStats.proposed,
        resigned: validatorDailyStats.resigned,
        active: getActiveValidators()
      });

      if (parsed?.name === "Propose") {
        recordProposedValidator();

        console.log("Validator statistics snapshot:", {
          resigned: validatorDailyStats.resigned,
          proposed: validatorDailyStats.proposed
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