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

export function recordProposedValidator() {
  validatorDailyStats.proposed += 1;
}

export function recordResignedValidator() {
  validatorDailyStats.resigned += 1;
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
  active: number;
  standby: number;
  owners: number;
}) {
  if (params.active !== undefined) {
  validatorDailyStats.active = params.active;
  }
  if (params.standby !== undefined) {
    validatorDailyStats.standby = params.standby;
  }
  if (params.owners !== undefined) {
    validatorDailyStats.owners = params.owners;
  }
}

//daily reset

export function resetValidatorDailyStats() {
  validatorDailyStats.resigned = 0;
  validatorDailyStats.proposed = 0;
  validatorDailyStats.vote = 0;
  validatorDailyStats.unvote = 0;
  validatorDailyStats.withdraw = 0;
}