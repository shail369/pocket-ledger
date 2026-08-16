import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { resolveRange, type PeriodKey, type Range } from "./finance";

interface AppState {
  accountId: string;
  setAccountId: (id: string) => void;
  period: PeriodKey;
  setPeriod: (p: PeriodKey) => void;
  customFrom: string;
  customTo: string;
  setCustom: (from: string, to: string) => void;
  range: Range;
  currency: string;
  setCurrency: (c: string) => void;
}

const Ctx = createContext<AppState | null>(null);

export function AppStateProvider({ children }: { children: ReactNode }) {
  const [accountId, setAccountId] = useState("all");
  const [period, setPeriod] = useState<PeriodKey>("this_month");
  const [customFrom, setCustomFrom] = useState("");
  const [customTo, setCustomTo] = useState("");
  const [currency, setCurrencyState] = useState("INR");

  useEffect(() => {
    const stored = localStorage.getItem("wallet-currency");
    if (stored) setCurrencyState(stored);
  }, []);

  const setCurrency = useCallback((c: string) => {
    setCurrencyState(c);
    localStorage.setItem("wallet-currency", c);
  }, []);

  const setCustom = useCallback((from: string, to: string) => {
    setCustomFrom(from);
    setCustomTo(to);
    setPeriod("custom");
  }, []);

  const range = useMemo(
    () => resolveRange(period, { from: customFrom, to: customTo }),
    [period, customFrom, customTo],
  );

  const value = useMemo(
    () => ({
      accountId,
      setAccountId,
      period,
      setPeriod,
      customFrom,
      customTo,
      setCustom,
      range,
      currency,
      setCurrency,
    }),
    [accountId, period, customFrom, customTo, setCustom, range, currency, setCurrency],
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useAppState() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useAppState must be used inside AppStateProvider");
  return ctx;
}