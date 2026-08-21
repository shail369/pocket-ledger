import type { SavingGoalContribution } from "./types";

export function reservedForAccount(accountId: string, contributions: SavingGoalContribution[]): number {
  return contributions.filter((c) => c.account_id === accountId).reduce((sum, c) => sum + Number(c.amount), 0);
}

export function reservedByGoal(goalId: string, contributions: SavingGoalContribution[]): number {
  return contributions.filter((c) => c.goal_id === goalId).reduce((sum, c) => sum + Number(c.amount), 0);
}

export function availableAccountBalance(balance: number, accountId: string, contributions: SavingGoalContribution[]): number {
  return balance - reservedForAccount(accountId, contributions);
}
