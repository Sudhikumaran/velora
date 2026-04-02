const RULES = [
  { keys: ["uber", "lyft", "taxi", "metro", "fuel", "gas", "parking"], cat: "transport" },
  { keys: ["restaurant", "cafe", "coffee", "food", "swiggy", "zomato", "grocery"], cat: "food" },
  { keys: ["netflix", "spotify", "prime", "subscription", "streaming"], cat: "entertainment" },
  { keys: ["salary", "payroll", "freelance", "invoice"], cat: "income" },
  { keys: ["rent", "mortgage", "lease"], cat: "housing" },
  { keys: ["electric", "water", "internet", "wifi", "utility"], cat: "utilities" },
  { keys: ["gym", "health", "pharmacy", "doctor"], cat: "health" },
  { keys: ["amazon", "shopping", "clothes"], cat: "shopping" },
];

export function suggestCategoryFromNote(note = "") {
  const lower = note.toLowerCase();
  for (const r of RULES) {
    if (r.keys.some((k) => lower.includes(k))) return r.cat;
  }
  return null;
}
