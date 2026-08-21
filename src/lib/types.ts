export type TxType = "expense" | "income" | "transfer";

export interface Account {
  id: string;
  name: string;
  type: string;
  opening_balance: number;
  currency: string;
  icon: string;
  color: string;
  is_active: boolean;
  created_at: string;
}

export interface Category {
  id: string;
  name: string;
  parent_id: string | null;
  icon: string;
  kind: "expense" | "income";
}

export interface Transaction {
  id: string;
  account_id: string;
  transfer_account_id: string | null;
  category_id: string | null;
  amount: number;
  type: TxType;
  date: string;
  description: string;
  created_at: string;
}

export interface Budget {
  id: string;
  category_id: string | null;
  account_id: string | null;
  amount: number;
  period: "monthly" | "weekly";
  start_date: string;
  end_date: string | null;
}

export interface Recurring {
  id: string;
  account_id: string;
  category_id: string | null;
  amount: number;
  type: "expense" | "income";
  description: string;
  frequency: "daily" | "weekly" | "monthly" | "yearly";
  start_date: string;
  next_occurrence: string;
  end_date: string | null;
  is_active: boolean;
}

export interface SavingGoal {
  id: string;
  name: string;
  target_amount: number;
  target_date: string | null;
  icon: string;
  color: string;
  description: string;
  created_at: string;
  updated_at: string;
}

export interface SavingGoalContribution {
  id: string;
  goal_id: string;
  account_id: string;
  transaction_id: string | null;
  amount: number;
  date: string;
  note: string;
  created_at: string;
}

export interface AppData {
  accounts: Account[];
  categories: Category[];
  transactions: Transaction[];
  budgets: Budget[];
  recurring: Recurring[];
  savingGoals: SavingGoal[];
  savingGoalContributions: SavingGoalContribution[];
}
