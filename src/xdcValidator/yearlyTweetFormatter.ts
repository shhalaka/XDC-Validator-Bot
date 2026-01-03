import { YearlyValidatorStats } from "../stats/yearlyValidatorStats.js";

export function formatYearlyValidatorTweet(
  stats: YearlyValidatorStats
): string {
  return `
📊 XDC Validator Stats (Yearly Summary) 📊

➕ Proposed (This Year): ${stats.proposed}
➖ Resigned (This Year): ${stats.resigned}

📈 Yearly Averages
🟢 Active Validators: ${stats.avgActive}
⏸ Standby Validators: ${stats.avgStandby}

📅 Period: ${stats.yearStart} → ${stats.yearEnd}

#XDCNetwork #XDC #Validators #BuildOnXDC
`.trim();
}
