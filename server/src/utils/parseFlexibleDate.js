import { parseTransactionDate } from "./parseTransactionDate.js";

export function parseFlexibleDate(raw) {
  if (raw == null || raw === "") return parseTransactionDate(undefined);
  const s = String(raw).trim();
  if (/^\d{4}-\d{2}-\d{2}/.test(s)) return parseTransactionDate(s.slice(0, 10));
  const m = s.match(/^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})/);
  if (m) {
    const d = Number(m[1]);
    const mo = Number(m[2]);
    const y = Number(m[3]);
    return parseTransactionDate(`${y}-${String(mo).padStart(2, "0")}-${String(d).padStart(2, "0")}`);
  }
  const t = new Date(s);
  if (!Number.isNaN(t.getTime())) return t;
  return parseTransactionDate(undefined);
}
