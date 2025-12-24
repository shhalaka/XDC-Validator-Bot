import { validatorDailyStats } from "../stats/validatorStats.js";

export type NetworkValidatorStats = {
  active: number;
  standby: number;
  total: number;
  owners: number;
};

export async function fetchValidatorNetworkStats(): Promise<NetworkValidatorStats> {
  const active = validatorDailyStats.active ?? 0;
  const standby = validatorDailyStats.standby ?? 0;
  const owners = validatorDailyStats.owners ?? 0;

  const total = active + standby;

  console.log("RPC-derived (event-based) validator stats:", {
    active,
    standby,
    total,
    owners
  });

  return { active, standby, total, owners };
}
