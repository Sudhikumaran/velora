export function parseTransactionDate(value) {
  if (value == null || value === "") return new Date();
  if (typeof value === "string" && /^\d{4}-\d{2}-\d{2}$/.test(value.trim())) {
    const [y, m, d] = value.trim().split("-").map(Number);
    return new Date(Date.UTC(y, m - 1, d, 12, 0, 0, 0));
  }
  const dt = new Date(value);
  if (Number.isNaN(dt.getTime())) return new Date();
  return dt;
}
