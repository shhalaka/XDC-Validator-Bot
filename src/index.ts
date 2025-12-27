import fs from "node:fs";
import dotenv from "dotenv";
import { loadConfig } from "./config.js";
import { runXdcValidatorWatcher } from "./xdcValidator/watcher.js";

async function main() {
  const explicitEnvFile = process.env.ENV_FILE;
  const envFile =
    explicitEnvFile ||
    (fs.existsSync(".env")
      ? ".env"
      : fs.existsSync("config/local.env")
        ? "config/local.env"
        : undefined);
  if (envFile) dotenv.config({ path: envFile });
  else dotenv.config();

  const cfg = loadConfig();
  await runXdcValidatorWatcher(cfg);
}

main().catch((err) => {
  console.error(err);
  process.exitCode = 1;
});