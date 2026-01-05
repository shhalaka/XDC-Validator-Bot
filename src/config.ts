import process from "node:process";
import { ethers } from "ethers";

export type AppConfig = {
  rpcHttpUrl: string;
  contractAddress: string;

  pollIntervalMs: number;
  confirmations: number;
  maxBlocksPerQuery: number;
  startBlock?: number;
  tweetDelayMs: number;

  txExplorerBase: string;
  nativeSymbol: string;

  twitterAppKey?: string;
  twitterAppSecret?: string;
  twitterAccessToken?: string;
  twitterAccessSecret?: string;

  dryRun: boolean;

  //weekly
  enableWeeklyStats: boolean;
};

function mustGetEnv(name: string): string {
  const v = process.env[name];
  if (!v) throw new Error(`Missing required env var: ${name}`);
  return v;
}

function getEnvInt(name: string, def: number): number {
  const v = process.env[name];
  if (!v) return def;
  const n = Number.parseInt(v, 10);
  if (!Number.isFinite(n)) throw new Error(`Invalid int env var ${name}=${v}`);
  return n;
}

function getEnvBool(name: string, def: boolean): boolean {
  const v = process.env[name];
  if (!v) return def;
  return ["1", "true", "yes", "y", "on"].includes(v.toLowerCase());
}

export function loadConfig(): AppConfig {
  const startBlockRaw = process.env.START_BLOCK;
  const startBlock =
    startBlockRaw && startBlockRaw.length > 0 ? Number.parseInt(startBlockRaw, 10) : undefined;
  if (startBlockRaw && !Number.isFinite(startBlock ?? NaN)) {
    throw new Error(`Invalid START_BLOCK=${startBlockRaw}`);
  }

  const dryRun = getEnvBool("DRY_RUN", false);

  const contractAddressRaw = mustGetEnv("CONTRACT_ADDRESS");
  const contractAddress0x = contractAddressRaw.toLowerCase().startsWith("xdc")
    ? `0x${contractAddressRaw.slice(3)}`
    : contractAddressRaw;
  const contractAddress = ethers.getAddress(contractAddress0x);

  return {
    rpcHttpUrl: mustGetEnv("RPC_HTTP_URL"),
    contractAddress,

    pollIntervalMs: getEnvInt("POLL_INTERVAL_MS", 7000),
    confirmations: getEnvInt("CONFIRMATIONS", 3),
    maxBlocksPerQuery: getEnvInt("MAX_BLOCKS_PER_QUERY", 2000),
    startBlock,
    tweetDelayMs: getEnvInt("TWEET_DELAY_MS", 1500),

    txExplorerBase: process.env.TX_EXPLORER_BASE || "https://xdcscan.com/tx/",
    nativeSymbol: process.env.NATIVE_SYMBOL || "XDC",

    twitterAppKey: dryRun ? process.env.TWITTER_APP_KEY : mustGetEnv("TWITTER_APP_KEY"),
    twitterAppSecret: dryRun ? process.env.TWITTER_APP_SECRET : mustGetEnv("TWITTER_APP_SECRET"),
    twitterAccessToken: dryRun ? process.env.TWITTER_ACCESS_TOKEN : mustGetEnv("TWITTER_ACCESS_TOKEN"),
    twitterAccessSecret: dryRun
      ? process.env.TWITTER_ACCESS_SECRET
      : mustGetEnv("TWITTER_ACCESS_SECRET"),

    dryRun,
  
    enableWeeklyStats: getEnvBool("ENABLE_WEEKLY_STATS", false),
  };
}


