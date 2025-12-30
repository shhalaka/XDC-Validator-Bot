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

function loadCurrentMonthSnapshots(): ValidatorDailySnapshot[] {
  const files = listSnapshotFiles();
  if (files.length === 0) return [];

  const today = new Date().toISOString().slice(0, 7); // YYYY-MM

  return files
    .filter((file) => file.startsWith(today))
    .map((file) => {
      const fullPath = path.join(SNAPSHOT_DIR, file);
      const raw = fs.readFileSync(fullPath, "utf-8");
      return JSON.parse(raw) as ValidatorDailySnapshot;
    });
}

export function computeMonthlyValidatorStats(): MonthlyValidatorStats | null {
  const snapshots = loadCurrentMonthSnapshots();
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
    monthStart: firstDay.date,
    monthEnd: lastDay.date,
    proposed: lastDay.proposed - firstDay.proposed,
    resigned: lastDay.resigned - firstDay.resigned,
    avgActive,
    avgStandby,
};
}