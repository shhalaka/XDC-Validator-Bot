import { ethers } from "ethers";
import { validatorDailyStats } from "../stats/validatorStats.js";

const VALIDATOR_MIN_ABI = [
  "function candidateCount() view returns (uint256)",
  "function getOwnerCount() view returns (uint256)"
];

export type NetworkValidatorStats = {
  active: number;
  standby: number;
  total: number;
  owners: number;
};

export async function fetchValidatorNetworkStats(
  provider: ethers.JsonRpcProvider,
  contractAddress: string
): Promise<NetworkValidatorStats> {

  const contract = new ethers.Contract(
    contractAddress,
    VALIDATOR_MIN_ABI,
    provider
  );

  // Proposed / Total validators
  const totalBig = await contract.candidateCount();
  const total = Number(totalBig);

  // Owners
  const ownersBig = await contract.getOwnerCount();
  const owners = Number(ownersBig);

  // Resigned validators 
  const resigned = validatorDailyStats.resigned;

  // Active & Standby
  const active = Math.max(0, total - resigned);
  const standby = Math.max(0, total - active);

  // Inject into existing state (minimal change)
  validatorDailyStats.proposed = total;
  validatorDailyStats.active = active;
  validatorDailyStats.standby = standby;
  validatorDailyStats.owners = owners;

  console.log("RPC-derived validator stats (contract-based):", {
    total,
    active,
    standby,
    resigned
  });

  return {
    total,
    active,
    standby,
    owners
  };
}
