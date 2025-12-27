import type { WeeklyValidatorStats } from "../stats/weeklyValidatorStats.js";

export function formatWeeklyValidatorTweet(
  stats: WeeklyValidatorStats
): string {
  return `
📊 XDC Validator Stats (Weekly – Week to Date)

➕ Total Validators: ${stats.proposed}
➖ Resigned: ${stats.resigned}

📈 Averages
🟢 Active Validators: ${stats.avgActive}
⏸ Standby Validators: ${stats.avgStandby}

📅 Period: ${stats.weekStart} → ${stats.weekEnd}

#XDCNetwork #XDC #Validators #BuildOnXDC
`.trim();
}
