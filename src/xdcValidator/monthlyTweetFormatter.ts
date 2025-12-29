import type { MonthlyValidatorStats } from "../stats/monthlyValidatorStats.js";

export function formatMonthlyValidatorTweet(
  stats: MonthlyValidatorStats
): string {
  return `
📊 XDC Validator Stats (Monthly Summary) 📊

➕ Total Validators: ${stats.proposed}
➖ Resigned: ${stats.resigned}

📈 Averages
🟢 Active Validators: ${stats.avgActive}
⏸ Standby Validators: ${stats.avgStandby}

📅 Period: ${stats.monthStart} → ${stats.monthEnd}

#XDCNetwork #XDC #Validators #BuildOnXDC
`.trim();
}
