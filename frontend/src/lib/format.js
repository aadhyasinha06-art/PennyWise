import { CURRENCIES } from "./constants";

export function makeFormatter(symbol = "₹") {
  const code = CURRENCIES.find((c) => c.symbol === symbol)?.code || "INR";
  const nf = new Intl.NumberFormat("en-IN", { style: "currency", currency: code, maximumFractionDigits: 0 });
  return (value) => nf.format(Number(value) || 0);
}

export function uid() {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

export const clampPercent = (v) => Math.min(100, Math.max(0, Number(v) || 0));
