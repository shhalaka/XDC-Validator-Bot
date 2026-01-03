import { ethers } from "ethers";
import { validatorDailyStats, setNetworkValidatorStats } from "../stats/validatorStats.js";

const VALIDATOR_MIN_ABI = [
  "function candidateCount() view returns (uint256)",
  "function getOwnerCount() view returns (uint256)",
];

export type NetworkValidatorStats = {
  total: number;
  owners: number;
};

export async function fetchValidatorNetworkStats(
  provider: ethers.JsonRpcProvider,
  contractAddress: string
) {
  const contract = new ethers.Contract(
    contractAddress,
    VALIDATOR_MIN_ABI,
    provider
  );

  const total = Number(await contract.candidateCount());
  const owners = Number(await contract.getOwnerCount());
  
  const resigned = validatorDailyStats.resigned;
  const active = Math.max(0, total - resigned);
  const standby = resigned;

  setNetworkValidatorStats({
    active,
    standby,
    owners,
  });

  return {
    total,
    active,
    standby,
    owners,
  };
}
