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

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

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

  // Default image used for all tweets
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

  // Don't start from "future" relative to the confirmed tip.
  if (fromBlock > safeLatest) fromBlock = safeLatest;

  console.log(
    `Watching XDCValidator at ${cfg.contractAddress} via ${cfg.rpcHttpUrl}`
  );
  console.log(
    `Starting from block ${fromBlock} (confirmations=${cfg.confirmations}, maxBlocksPerQuery=${cfg.maxBlocksPerQuery})`
  );
  if (cfg.dryRun) console.log("DRY_RUN enabled: will not post tweets.");

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
      const res = formatTweetForLog(iface, log, {
        nativeSymbol: cfg.nativeSymbol,
        txExplorerBase: cfg.txExplorerBase,
        maxLen: 275
      });

      if (!res) continue;
      if (store.hasEvent(res.eventId)) continue;

      // Image tweet
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
