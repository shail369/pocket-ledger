import { useCallback } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { Account, AppData, Budget, Category, Recurring, SavingsGoal, SavingsGoalContribution, Transaction } from "./types";

export const DATA_KEY = ["wallet-data"];

async function fetchAllTransactions(): Promise<Transaction[]> {
  const pageSize = 1000;
  const rows: Transaction[] = [];
  let from = 0;
  while (true) {
    const { data, error } = await supabase.from("transactions").select("*").order("date", { ascending: false }).order("created_at", { ascending: false }).range(from, from + pageSize - 1);
    if (error) throw error;
    const page = (data ?? []) as unknown as Transaction[];
    rows.push(...page);
    if (page.length < pageSize) break;
    from += pageSize;
  }
  return rows;
}

async function fetchAppData(): Promise<AppData> {
  const [accounts, categories, transactions, budgets, recurring, savingsGoals, savingsGoalContributions] = await Promise.all([
    supabase.from("accounts").select("*").order("created_at"),
    supabase.from("categories").select("*").order("name"),
    fetchAllTransactions(),
    supabase.from("budgets").select("*").order("created_at"),
    supabase.from("recurring_transactions").select("*").order("next_occurrence"),
    supabase.from("savings_goals").select("*").order("created_at", { ascending: false }),
    supabase.from("savings_goal_contributions").select("*").order("date", { ascending: false }).order("created_at", { ascending: false }),
  ]);
  const err = accounts.error || categories.error || budgets.error || recurring.error || savingsGoals.error || savingsGoalContributions.error;
  if (err) throw err;
  return {
    accounts: (accounts.data ?? []) as unknown as Account[],
    categories: (categories.data ?? []) as unknown as Category[],
    transactions,
    budgets: (budgets.data ?? []) as unknown as Budget[],
    recurring: (recurring.data ?? []) as unknown as Recurring[],
    savingsGoals: (savingsGoals.data ?? []) as unknown as SavingsGoal[],
    savingsGoalContributions: (savingsGoalContributions.data ?? []) as unknown as SavingsGoalContribution[],
  };
}

const EMPTY: AppData = { accounts: [], categories: [], transactions: [], budgets: [], recurring: [], savingsGoals: [], savingsGoalContributions: [] };

export function useAppData() {
  const query = useQuery({ queryKey: DATA_KEY, queryFn: fetchAppData, staleTime: 60_000, refetchOnWindowFocus: false });
  return { ...query, data: query.data ?? EMPTY, ready: !query.isLoading };
}

export function useInvalidateData() {
  const qc = useQueryClient();
  return useCallback(() => qc.invalidateQueries({ queryKey: DATA_KEY }), [qc]);
}

type Table = "accounts" | "categories" | "transactions" | "budgets" | "recurring_transactions" | "savings_goals" | "savings_goal_contributions";
type AppDataKey = Exclude<keyof AppData, never>;
function dataKey(table: Table): AppDataKey {
  if (table === "recurring_transactions") return "recurring";
  if (table === "savings_goals") return "savingsGoals";
  if (table === "savings_goal_contributions") return "savingsGoalContributions";
  return table;
}

export function useUpsert(table: Table) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (row: Record<string, unknown>) => {
      const { data: userRes } = await supabase.auth.getUser();
      const payload = { ...row, user_id: userRes.user?.id };
      const rowId = row["id"] as string | undefined;
      const result = rowId ? await supabase.from(table).update(row as never).eq("id", rowId).select("*").single() : await supabase.from(table).insert(payload as never).select("*").single();
      if (result.error) throw result.error;
      return result.data as never;
    },
    onSuccess: (saved) => {
      queryClient.setQueryData<AppData>(DATA_KEY, (current) => {
        if (!current) return current;
        const item = saved as Record<string, unknown>;
        const id = String(item.id ?? "");
        const key = dataKey(table);
        const rows = current[key] as unknown as Record<string, unknown>[];
        const index = rows.findIndex((r) => String(r.id) === id);
        const nextRows = index >= 0 ? rows.map((r, i) => (i === index ? saved : r)) : [saved, ...rows];
        return { ...current, [key]: nextRows } as AppData;
      });
    },
  });
}

export function useRemove(table: Table) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from(table).delete().eq("id", id);
      if (error) throw error;
      return id;
    },
    onSuccess: async (id) => {
      queryClient.setQueryData<AppData>(DATA_KEY, (current) => {
        if (!current) return current;
        const key = dataKey(table);
        const rows = current[key] as unknown as { id: string }[];
        const next = { ...current, [key]: rows.filter((row) => row.id !== id) } as AppData;
        if (table === "savings_goals") next.savingsGoalContributions = current.savingsGoalContributions.filter((c) => c.goal_id !== id);
        return next;
      });
      if (table === "savings_goals" || table === "savings_goal_contributions") await queryClient.invalidateQueries({ queryKey: DATA_KEY });
    },
  });
}

export interface ContributionInput { goalId: string; amount: number; date: string; note: string; }

export function useSavingsGoalContribution(existingId?: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: ContributionInput) => {
      const functionName = existingId ? "update_savings_goal_contribution" : "add_savings_goal_contribution";
      const args = existingId ? { p_contribution_id: existingId, p_amount: input.amount, p_date: input.date, p_note: input.note } : { p_goal_id: input.goalId, p_amount: input.amount, p_date: input.date, p_note: input.note };
      const { data, error } = await supabase.rpc(functionName as never, args as never);
      if (error) throw error;
      return data as unknown as SavingsGoalContribution;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: DATA_KEY }),
  });
}
