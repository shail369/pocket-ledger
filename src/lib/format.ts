const SYMBOLS: Record<string, string> = {
  INR: "₹",
  USD: "$",
  EUR: "€",
  GBP: "£",
  AED: "د.إ",
  JPY: "¥",
};

export function currencySymbol(code: string) {
  return SYMBOLS[code] ?? code + " ";
}

export function formatMoney(value: number, currency = "INR", compact = false) {
  const abs = Math.abs(value);
  const sign = value < 0 ? "-" : "";
  const symbol = currencySymbol(currency);
  if (compact && abs >= 100000) return `${sign}${symbol}${(abs / 100000).toFixed(1)}L`;
  if (compact && abs >= 1000) return `${sign}${symbol}${(abs / 1000).toFixed(1)}k`;
  return `${sign}${symbol}${abs.toLocaleString("en-IN", { maximumFractionDigits: 0 })}`;
}

export function formatSigned(value: number, currency = "INR") {
  return `${value >= 0 ? "+" : "-"}${formatMoney(Math.abs(value), currency)}`;
}

export function percent(value: number) {
  return `${value.toFixed(value >= 10 ? 0 : 1)}%`;
}