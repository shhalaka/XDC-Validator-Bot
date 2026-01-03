import type { MonthlyValidatorStats } from "../stats/monthlyValidatorStats.js";

export function formatMonthlyValidatorTweet(
  stats: MonthlyValidatorStats
): string {
  return `
📊 XDC Validator Stats (Monthly Summary) 📊

➕ Proposed (This Month): ${stats.proposed}
➖ Resigned (This Month): ${stats.resigned}

📈 Monthly Averages
🟢 Active Validators: ${stats.avgActive}
⏸ Standby Validators: ${stats.avgStandby}

📅 Period: ${stats.monthStart} → ${stats.monthEnd}

#XDCNetwork #XDC #Validators #BuildOnXDC
`.trim();
}
