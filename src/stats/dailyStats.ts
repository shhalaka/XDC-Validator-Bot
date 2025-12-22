export type DailyStats = {
  mint: bigint;
  burn: bigint;
  transferCount: number;
};

export const dailyStats: DailyStats = {
  mint: 0n,
  burn: 0n,
  transferCount: 0,
};

export function recordMint(amount: bigint) {
  dailyStats.mint += amount;
}

export function recordBurn(amount: bigint) {
  dailyStats.burn += amount;
}

export function recordTransfer() {
  dailyStats.transferCount += 1;
}

export function resetDailyStats() {
  dailyStats.mint = 0n;
  dailyStats.burn = 0n;
  dailyStats.transferCount = 0;
}