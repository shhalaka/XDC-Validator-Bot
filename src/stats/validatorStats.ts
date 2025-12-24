export type ValidatorDailyStats = {
  resigned: number;
  proposed: number;
  vote: number;
  unvote: number;
  withdraw: number;
  active: number | null;
  standby: number | null;
  owners: number | null;
};

export const validatorDailyStats: ValidatorDailyStats = {
  resigned: 0,
  proposed: 0,
  vote: 0,
  unvote: 0,
  withdraw: 0,
  active: null,
  standby: null,
  owners: null,
};

//event counters 

export function recordResignedValidator() {
  validatorDailyStats.resigned += 1;
  recomputeNetworkStats();  
}

export function recordProposedValidator() {
  validatorDailyStats.proposed += 1;
  recomputeNetworkStats();
}

export function recordVote() {
  validatorDailyStats.vote += 1;
}

export function recordUnvote() {
  validatorDailyStats.unvote += 1;
}

export function recordWithdraw() {
  validatorDailyStats.withdraw += 1;
}

//network snapshot setters

export function setNetworkValidatorStats(params: {
  owners: number;
}) {
  // Only owners can be externally set (optional / future)
  validatorDailyStats.owners = params.owners;
}

//daily reset

export function resetValidatorDailyStats() {
  validatorDailyStats.resigned = 0;
  validatorDailyStats.proposed = 0;
  validatorDailyStats.vote = 0;
  validatorDailyStats.unvote = 0;
  validatorDailyStats.withdraw = 0;
}

export function recomputeNetworkStats() {
  const proposed = validatorDailyStats.proposed;
  const resigned = validatorDailyStats.resigned;

  // Active validators are proposed minus resigned
  const active = Math.max(0, proposed - resigned);

  // Standby validators are proposed but not active
  const standby = Math.max(0, proposed - active);

  validatorDailyStats.active = active;
  validatorDailyStats.standby = standby;
}
