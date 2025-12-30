import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import type { ValidatorDailySnapshot } from "../store/validatorSnapshots.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const SNAPSHOT_DIR = path.resolve(__dirname, "../../data/validators");

export interface WeeklyValidatorStats {
  weekStart: string;
  weekEnd: string;
  proposed: number;
  resigned: number;
  avgActive: number;
  avgStandby: number;
}

function listSnapshotFiles(): string[] {
  if (!fs.existsSync(SNAPSHOT_DIR)) return [];

  return fs
    .readdirSync(SNAPSHOT_DIR)
    .filter((f) => f.endsWith(".json"))
    .sort(); // YYYY-MM-DD.json sorts naturally
}

function loadLast7Snapshots(): ValidatorDailySnapshot[] {
  const files = listSnapshotFiles();

  const last7 = files.slice(-7);

  return last7.map((file) => {
    const fullPath = path.join(SNAPSHOT_DIR, file);
    const raw = fs.readFileSync(fullPath, "utf-8");
    return JSON.parse(raw) as ValidatorDailySnapshot;
  });
}

export function computeWeeklyValidatorStats(): WeeklyValidatorStats | null {
  const snapshots = loadLast7Snapshots();
  if (snapshots.length < 2) return null;

  const firstDay = snapshots[0];
  const lastDay = snapshots[snapshots.length - 1];
  let activeSum = 0;
  let standbySum = 0;
  let activeDays = 0;
  let standbyDays = 0;

  for (const day of snapshots) {
    if (typeof day.active === "number") {
      activeSum += day.active;
      activeDays ++;
    }

    if (typeof day.standby === "number") {
      standbySum += day.standby;
      standbyDays ++;
    }
  }

    const avgActive = activeDays ? Math.round(activeSum / activeDays) : 0;
    const avgStandby = standbyDays ? Math.round(standbySum / standbyDays) : 0;

  return {
    weekStart: firstDay.date,
    weekEnd: lastDay.date,
    proposed: lastDay.proposed - firstDay.proposed,
    resigned: lastDay.resigned - firstDay.resigned,
    avgActive,
    avgStandby,
};
}
