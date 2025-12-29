import { YearlyValidatorStats } from "../stats/yearlyValidatorStats.js";

export function formatYearlyValidatorTweet(
  stats: YearlyValidatorStats
): string {
  return `
📊 XDC Validator Stats (Yearly Summary) 📊

➕ Total Validators: ${stats.proposed}
➖ Resigned: ${stats.resigned}

📈 Averages
🟢 Active Validators: ${stats.avgActive}
⏸ Standby Validators: ${stats.avgStandby}

📅 Period: ${stats.yearStart} → ${stats.yearEnd}

#XDCNetwork #XDC #Validators #BuildOnXDC
`.trim();
}
