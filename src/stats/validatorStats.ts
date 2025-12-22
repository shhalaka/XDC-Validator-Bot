// src/stats/validatorStats.ts

export type ValidatorDailyStats = {
  resigned: number;
  proposed: number;
};

export const validatorDailyStats: ValidatorDailyStats = {
  resigned: 0,
  proposed: 0,
};

export function recordResignedValidator() {
  validatorDailyStats.resigned += 1;
}

export function recordProposedValidator() {
  validatorDailyStats.proposed += 1;
}

export function resetValidatorDailyStats() {
  validatorDailyStats.resigned = 0;
  validatorDailyStats.proposed = 0;
}

export function getActiveValidators() {
  return validatorDailyStats.proposed - validatorDailyStats.resigned;
}
