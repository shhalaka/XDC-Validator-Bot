import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { validatorDailyStats } from "../stats/validatorStats.js";
import { recomputeNetworkStats } from "../stats/validatorStats.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const SNAPSHOT_DIR = path.resolve(__dirname, "../../data/validators");

export interface ValidatorDailySnapshot {
  date: string;
  resigned: number;
  proposed: number;
  vote: number;
  unvote: number;
  withdraw: number;
  active: number | null;
  standby: number | null;
  owners: number | null;
}


function ensureDir() {
  if (!fs.existsSync(SNAPSHOT_DIR)) {
    fs.mkdirSync(SNAPSHOT_DIR, { recursive: true });
  }
}

function today(): string {
  return new Date().toISOString().slice(0, 10);
}

export function writeDailyValidatorSnapshot(date = today()) {
  ensureDir();
  recomputeNetworkStats();
  
  const snapshot: ValidatorDailySnapshot = {
  date,
  resigned: validatorDailyStats.resigned,
  proposed: validatorDailyStats.proposed,
  vote: validatorDailyStats.vote,
  unvote: validatorDailyStats.unvote,
  withdraw: validatorDailyStats.withdraw,
  active: validatorDailyStats.active,
  standby: validatorDailyStats.standby,
  owners: validatorDailyStats.owners,
};

  const filePath = path.join(SNAPSHOT_DIR, `${date}.json`);

  fs.writeFileSync(filePath, JSON.stringify(snapshot, null, 2), "utf-8");

  return filePath;
}
