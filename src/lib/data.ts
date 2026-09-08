import { useCallback } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { Account, AppData, Asset, Budget, Category, Liability, Recurring, SavingGoal, SavingGoalContribution, Transaction } from "./types";

export const DATA_KEY = ["wallet-data"];
type ExtendedTable = "accounts" | "categories" | "transactions" | "budgets" | "recurring_transactions" | "saving_goals" | "saving_goal_contributions" | "assets" | "liabilities";
const tableClient = (table: ExtendedTable) => (supabase.from as any)(table);

async function fetchAllTransactions(): Promise<Transaction[]> {
  const pageSize = 1000; const rows: Transaction[] = []; let from = 0;
  while (true) { const { data, error } = await supabase.from("transactions").select("*").order("date", { ascending: false }).order("created_at", { ascending: false }).range(from, from + pageSize - 1); if (error) throw error; const page = (data ?? []) as unknown as Transaction[]; rows.push(...page); if (page.length < pageSize) break; from += pageSize; }
  return rows;
}

async function fetchAppData(): Promise<AppData> {
  const [accounts, categories, transactions, budgets, recurring] = await Promise.all([
    supabase.from("accounts").select("*").order("created_at"), supabase.from("categories").select("*").order("name"), fetchAllTransactions(), supabase.from("budgets").select("*").order("created_at"), supabase.from("recurring_transactions").select("*").order("next_occurrence"),
  ]);
  const coreError = accounts.error || categories.error || budgets.error || recurring.error; if (coreError) throw coreError;
  const [savingGoals, savingGoalContributions, assetsResult, liabilitiesResult] = await Promise.all([
    supabase.from("saving_goals").select("*").order("created_at"), supabase.from("saving_goal_contributions").select("*").order("date", { ascending: false }).order("created_at", { ascending: false }),
    tableClient("assets").select("*").order("created_at"), tableClient("liabilities").select("*").order("created_at"),
  ]);
  return { accounts: (accounts.data ?? []) as unknown as Account[], categories: (categories.data ?? []) as unknown as Category[], transactions, budgets: (budgets.data ?? []) as unknown as Budget[], recurring: (recurring.data ?? []) as unknown as Recurring[], savingGoals: savingGoals.error ? [] : ((savingGoals.data ?? []) as unknown as SavingGoal[]), savingGoalContributions: savingGoalContributions.error ? [] : ((savingGoalContributions.data ?? []) as unknown as SavingGoalContribution[]), assets: assetsResult.error ? [] : ((assetsResult.data ?? []) as unknown as Asset[]), liabilities: liabilitiesResult.error ? [] : ((liabilitiesResult.data ?? []) as unknown as Liability[]) };
}

const EMPTY: AppData = { accounts: [], categories: [], transactions: [], budgets: [], recurring: [], savingGoals: [], savingGoalContributions: [], assets: [], liabilities: [] };
export function useAppData() { const query = useQuery({ queryKey: DATA_KEY, queryFn: fetchAppData, staleTime: 60_000, refetchOnWindowFocus: false }); return { ...query, data: query.data ?? EMPTY, ready: !query.isLoading }; }
export function useInvalidateData() { const qc = useQueryClient(); return useCallback(() => qc.invalidateQueries({ queryKey: DATA_KEY }), [qc]); }

type Table = ExtendedTable;
function dataKey(table: Table): keyof AppData { if (table === "recurring_transactions") return "recurring"; if (table === "saving_goals") return "savingGoals"; if (table === "saving_goal_contributions") return "savingGoalContributions"; return table; }
export function useUpsert(table: Table) {
  const queryClient = useQueryClient();
  return useMutation({ mutationFn: async (row: Record<string, unknown>) => { const { data: userRes } = await supabase.auth.getUser(); const payload = { ...row, user_id: userRes.user?.id }; const rowId = row.id as string | undefined; const clientTable = tableClient(table); const result = rowId ? await clientTable.update(row).eq("id", rowId).select("*").single() : await clientTable.insert(payload).select("*").single(); if (result.error) throw result.error; return result.data as Record<string, unknown>; }, onSuccess: (saved) => { queryClient.setQueryData<AppData>(DATA_KEY, (current) => { if (!current) return current; const key = dataKey(table); const rows = current[key] as unknown as Record<string, unknown>[]; const id = String(saved.id ?? ""); const index = rows.findIndex((r) => String(r.id) === id); const nextRows = index >= 0 ? rows.map((r, i) => (i === index ? saved : r)) : [saved, ...rows]; return { ...current, [key]: nextRows } as AppData; }); } });
}
export function useRemove(table: Table) {
  const queryClient = useQueryClient();
  return useMutation({ mutationFn: async (id: string) => { if (table === "saving_goals") { const { error: contributionError } = await supabase.from("saving_goal_contributions").delete().eq("goal_id", id); if (contributionError) throw contributionError; } const { error } = await tableClient(table).delete().eq("id", id); if (error) throw error; return id; }, onSuccess: (id) => { queryClient.setQueryData<AppData>(DATA_KEY, (current) => { if (!current) return current; const next = { ...current }; const key = dataKey(table); const rows = next[key] as unknown as { id: string }[]; next[key] = rows.filter((row) => row.id !== id) as never; if (table === "saving_goals") next.savingGoalContributions = next.savingGoalContributions.filter((c) => c.goal_id !== id); return next; }); } });
}

export function useRemoveBudgetSeries() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (budget: Budget) => {
      const { data: userRes } = await supabase.auth.getUser();
      let query = supabase.from("budgets").delete().eq("user_id", userRes.user?.id).eq("account_id", budget.account_id).eq("period", budget.period);
      query = budget.category_id === null ? query.is("category_id", null) : query.eq("category_id", budget.category_id);
      const { error } = await query;
      if (error) throw error;
      return budget;
    },
    onSuccess: (budget) => {
      queryClient.setQueryData<AppData>(DATA_KEY, (current) => {
        if (!current) return current;
        return { ...current, budgets: current.budgets.filter((b) => !(b.account_id === budget.account_id && b.period === budget.period && b.category_id === budget.category_id)) };
      });
    },
  });
}
