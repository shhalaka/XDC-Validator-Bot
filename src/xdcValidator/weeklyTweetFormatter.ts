import type { WeeklyValidatorStats } from "../stats/weeklyValidatorStats.js";

export function formatWeeklyValidatorTweet(
  stats: WeeklyValidatorStats
): string {
  return `
📊 XDC Validator Stats (Weekly Summary) 📊

➕ Proposed (This Week): ${stats.proposed}
➖ Resigned (This Week): ${stats.resigned}

📈 Weekly Averages
🟢 Active Validators: ${stats.avgActive}
⏸ Standby Validators: ${stats.avgStandby}

📅 Period: ${stats.weekStart} → ${stats.weekEnd}

#XDCNetwork #XDC #Validators #BuildOnXDC
`.trim();
}
