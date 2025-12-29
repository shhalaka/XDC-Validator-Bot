import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import type { ValidatorDailySnapshot } from "../store/validatorSnapshots.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const SNAPSHOT_DIR = path.resolve(__dirname, "../../data/validators");

export interface MonthlyValidatorStats {
  monthStart: string;
  monthEnd: string;
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

function loadLast30Snapshots(): ValidatorDailySnapshot[] {
  const files = listSnapshotFiles();

  const last30 = files.slice(-30);

  return last30.map((file) => {
    const fullPath = path.join(SNAPSHOT_DIR, file);
    const raw = fs.readFileSync(fullPath, "utf-8");
    return JSON.parse(raw) as ValidatorDailySnapshot;
  });
}

export function computeMonthlyValidatorStats(): MonthlyValidatorStats | null {
  const snapshots = loadLast30Snapshots();

  if (snapshots.length === 0) return null;

  let proposed = 0;
  let resigned = 0;
  let activeSum = 0;
  let standbySum = 0;
  let activeDays = 0;
  let standbyDays = 0;

  for (const day of snapshots) {
        proposed += day.proposed;
        resigned += day.resigned;

    if (typeof day.active === "number") {
      activeSum += day.active;
      activeDays += 1;
    }

    if (typeof day.standby === "number") {
      standbySum += day.standby;
      standbyDays += 1;
    }
  }

    const avgActive = activeDays ? Math.round(activeSum / activeDays) : 0;
    const avgStandby = standbyDays ? Math.round(standbySum / standbyDays) : 0;

  return {
    monthStart: snapshots[0].date,
    monthEnd: snapshots[snapshots.length - 1].date,
    proposed,
    resigned,
    avgActive,
    avgStandby,
};
}
