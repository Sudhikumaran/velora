export const DEFAULT_INCOME_CATEGORIES = [
  "salary",
  "bonus",
  "freelance",
  "commission",
  "gifts",
  "refunds",
  "interest",
  "rental_income",
  "dividends",
  "side_hustle",
  "reimbursement",
  "other_income",
];

export const DEFAULT_EXPENSE_CATEGORIES = [
  "food",
  "transport",
  "housing",
  "utilities",
  "entertainment",
  "health",
  "shopping",
  "education",
  "travel",
  "insurance",
  "taxes",
  "childcare",
  "pets",
  "other",
  "uncategorized",
];

export function mergeCategories(defaults, apiRows, kind) {
  const customNames = apiRows.filter((r) => r.kind === kind).map((r) => r.name);
  const seen = new Set();
  const out = [];
  for (const x of defaults) {
    const k = x.toLowerCase();
    if (!seen.has(k)) {
      seen.add(k);
      out.push(x);
    }
  }
  for (const x of customNames) {
    const k = x.toLowerCase();
    if (!seen.has(k)) {
      seen.add(k);
      out.push(x);
    }
  }
  return out.sort((a, b) => a.toLowerCase().localeCompare(b.toLowerCase()));
}

export function displayCategoryLabel(name) {
  if (!name) return "";
  return String(name).replace(/_/g, " ");
}
