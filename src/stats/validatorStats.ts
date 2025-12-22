export type ValidatorDailyStats = {
  resigned: number;
  proposed: number;
  vote: number;
  unvote: number;
  withdraw: number;
};

export const validatorDailyStats: ValidatorDailyStats = {
  resigned: 0,
  proposed: 0,
  vote: 0,
  unvote: 0,
  withdraw: 0,
};

export function recordResignedValidator() {
  validatorDailyStats.resigned += 1;
}

export function recordProposedValidator() {
  validatorDailyStats.proposed += 1;
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

export function resetValidatorDailyStats() {
  validatorDailyStats.resigned = 0;
  validatorDailyStats.proposed = 0;
  validatorDailyStats.vote = 0;
  validatorDailyStats.unvote = 0;
  validatorDailyStats.withdraw = 0;
}

let activeValidators = 0;

export function setActiveValidators(count: number) {
  activeValidators = count;
}

export function getActiveValidators() {
  return activeValidators;
}
