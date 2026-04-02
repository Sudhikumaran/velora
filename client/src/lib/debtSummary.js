/** Mirrors server GET /api/debts/summary for offline / legacy API fallback. */
export function buildDebtSummary(debts) {
  if (!Array.isArray(debts)) return null;
  let pendingYouOwe = 0;
  let pendingToReceive = 0;
  let paidCount = 0;
  let pendingCount = 0;
  let totalPartialPaymentsRecorded = 0;

  for (const d of debts) {
    if (d.status === "paid") paidCount += 1;
    else pendingCount += 1;
    if (d.status === "pending" && d.amount > 0) {
      if (d.type === "you_owe") pendingYouOwe += d.amount;
      if (d.type === "you_gave") pendingToReceive += d.amount;
    }
    for (const p of d.paymentHistory || []) {
      totalPartialPaymentsRecorded += p.amount;
    }
  }

  const byPerson = {};
  for (const d of debts) {
    if (d.status !== "pending" || d.amount <= 0) continue;
    const key = (d.personName || "").trim() || "—";
    if (!byPerson[key]) {
      byPerson[key] = { personName: key, youOwe: 0, toReceive: 0 };
    }
    if (d.type === "you_owe") byPerson[key].youOwe += d.amount;
    if (d.type === "you_gave") byPerson[key].toReceive += d.amount;
  }
  const topParties = Object.values(byPerson)
    .map((p) => ({
      ...p,
      total: p.youOwe + p.toReceive,
    }))
    .sort((a, b) => b.total - a.total)
    .slice(0, 12);

  return {
    pendingYouOwe,
    pendingToReceive,
    netPosition: pendingToReceive - pendingYouOwe,
    pendingCount,
    paidCount,
    totalRecords: debts.length,
    totalPartialPaymentsRecorded,
    piePending: [
      { name: "You owe", value: pendingYouOwe },
      { name: "Owed to you", value: pendingToReceive },
    ],
    topParties,
  };
}
