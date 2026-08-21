import { useCallback } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { Account, AppData, Budget, Category, Recurring, SavingGoal, SavingGoalContribution, Transaction } from "./types";

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
  // Core application data must never be blocked by the optional Saving Goals
  // tables. This keeps existing accounts, transactions, budgets and recurring
  // data visible even if the Saving Goals migration has not reached the backend yet.
  const [accounts, categories, transactions, budgets, recurring] = await Promise.all([
    supabase.from("accounts").select("*").order("created_at"),
    supabase.from("categories").select("*").order("name"),
    fetchAllTransactions(),
    supabase.from("budgets").select("*").order("created_at"),
    supabase.from("recurring_transactions").select("*").order("next_occurrence"),
  ]);

  const coreError = accounts.error || categories.error || budgets.error || recurring.error;
  if (coreError) throw coreError;

  // Saving Goals are an additive feature. If either new table is unavailable
  // (for example before Supabase migrations have been applied), fall back to
  // empty goal data rather than failing the entire wallet-data query.
  const [savingGoals, savingGoalContributions] = await Promise.all([
    supabase.from("saving_goals").select("*").order("created_at"),
    supabase.from("saving_goal_contributions").select("*").order("date", { ascending: false }).order("created_at", { ascending: false }),
  ]);

  return {
    accounts: (accounts.data ?? []) as unknown as Account[],
    categories: (categories.data ?? []) as unknown as Category[],
    transactions,
    budgets: (budgets.data ?? []) as unknown as Budget[],
    recurring: (recurring.data ?? []) as unknown as Recurring[],
    savingGoals: savingGoals.error ? [] : ((savingGoals.data ?? []) as unknown as SavingGoal[]),
    savingGoalContributions: savingGoalContributions.error ? [] : ((savingGoalContributions.data ?? []) as unknown as SavingGoalContribution[]),
  };
}

const EMPTY: AppData = { accounts: [], categories: [], transactions: [], budgets: [], recurring: [], savingGoals: [], savingGoalContributions: [] };

export function useAppData() {
  const query = useQuery({ queryKey: DATA_KEY, queryFn: fetchAppData, staleTime: 60_000, refetchOnWindowFocus: false });
  return { ...query, data: query.data ?? EMPTY, ready: !query.isLoading };
}

export function useInvalidateData() {
  const qc = useQueryClient();
  return useCallback(() => qc.invalidateQueries({ queryKey: DATA_KEY }), [qc]);
}

type Table = "accounts" | "categories" | "transactions" | "budgets" | "recurring_transactions" | "saving_goals" | "saving_goal_contributions";

function dataKey(table: Table): keyof AppData {
  if (table === "recurring_transactions") return "recurring";
  if (table === "saving_goals") return "savingGoals";
  if (table === "saving_goal_contributions") return "savingGoalContributions";
  return table;
}

export function useUpsert(table: Table) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (row: Record<string, unknown>) => {
      const { data: userRes } = await supabase.auth.getUser();
      const payload = { ...row, user_id: userRes.user?.id };
      const rowId = row["id"] as string | undefined;
      const result = rowId
        ? await supabase.from(table).update(row as never).eq("id", rowId).select("*").single()
        : await supabase.from(table).insert(payload as never).select("*").single();
      if (result.error) throw result.error;
      return result.data as never;
    },
    onSuccess: (saved) => {
      queryClient.setQueryData<AppData>(DATA_KEY, (current) => {
        if (!current) return current;
        const key = dataKey(table);
        const rows = current[key] as unknown as Record<string, unknown>[];
        const id = String((saved as Record<string, unknown>).id ?? "");
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
    onSuccess: (id) => {
      queryClient.setQueryData<AppData>(DATA_KEY, (current) => {
        if (!current) return current;
        const key = dataKey(table);
        const rows = current[key] as unknown as { id: string }[];
        return { ...current, [key]: rows.filter((row) => row.id !== id) } as AppData;
      });
    },
  });
}
