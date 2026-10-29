// Local-date helpers. (The old code used toISOString(), which is UTC and can
// show yesterday's date in India early in the morning.)
const pad = (n) => String(n).padStart(2, "0");

export function today() {
  const d = new Date();
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

export const currentMonth = () => today().slice(0, 7);

export function monthKey(date) {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}`;
}

// Returns the last `count` month keys ending at `endMonth` (YYYY-MM), oldest first.
export function lastMonths(count, endMonth = currentMonth()) {
  const [y, m] = endMonth.split("-").map(Number);
  return Array.from({ length: count }, (_, i) => {
    const d = new Date(y, m - 1 - (count - 1 - i), 1);
    return monthKey(d);
  });
}

export function monthRange(fromMonth, toMonth) {
  if (!fromMonth || !toMonth || fromMonth > toMonth) return [];
  const out = [];
  let [y, m] = fromMonth.split("-").map(Number);
  const [ty, tm] = toMonth.split("-").map(Number);
  while ((y < ty || (y === ty && m <= tm)) && out.length < 60) {
    out.push(`${y}-${pad(m)}`);
    m += 1;
    if (m > 12) { m = 1; y += 1; }
  }
  return out;
}

export function monthLabel(key, opts = { month: "short" }) {
  const [y, m] = key.split("-").map(Number);
  return new Date(y, m - 1, 1).toLocaleDateString("en-IN", opts);
}

export function formatDate(iso) {
  if (!iso) return "";
  const [y, m, d] = iso.split("-").map(Number);
  return new Date(y, m - 1, d).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
}
