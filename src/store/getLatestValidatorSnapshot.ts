import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import type { ValidatorDailySnapshot } from "./validatorSnapshots.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const SNAPSHOT_DIR = path.resolve(__dirname, "../../data/validators");

export function getLatestValidatorSnapshot(): ValidatorDailySnapshot | null {
  if (!fs.existsSync(SNAPSHOT_DIR)) return null;

  const files = fs
    .readdirSync(SNAPSHOT_DIR)
    .filter((f) => f.endsWith(".json"))
    .sort();

  if (files.length === 0) return null;

  const latest = files[files.length - 1];

  console.log(`[SNAPSHOT] Using validator snapshot: ${latest}`);

  const raw = fs.readFileSync(path.join(SNAPSHOT_DIR, latest), "utf-8");
  return JSON.parse(raw);
}

