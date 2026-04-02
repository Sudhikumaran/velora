import { useCallback, useEffect, useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import toast from "react-hot-toast";
import { api } from "../lib/api.js";
import { formatMoney, formatDateDMY, downloadCsv } from "../lib/format.js";
import { useAuthStore } from "../store/authStore.js";
import { useThemeStore } from "../store/themeStore.js";
import {
  DEFAULT_INCOME_CATEGORIES,
  DEFAULT_EXPENSE_CATEGORIES,
  mergeCategories,
  displayCategoryLabel,
} from "../lib/categoryLists.js";

export default function Transactions() {
  const currency = useAuthStore((s) => s.user?.currency) || "INR";
  const dark = useThemeStore((s) => s.mode === "dark");
  const panel =
    "rounded-2xl border backdrop-blur-xl " +
    (dark
      ? "border-slate-600/90 bg-slate-900/95 text-slate-100 shadow-[0_4px_24px_rgba(0,0,0,0.35)] [color-scheme:dark]"
      : "border-slate-200/90 bg-white/95 text-slate-900 shadow-[0_4px_24px_rgba(15,23,42,0.06)] [color-scheme:light]");
  const field =
    "rounded-xl border px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-sky-500/35 " +
    (dark
      ? "border-slate-500 bg-slate-950 text-slate-100 placeholder:text-slate-400"
      : "border-slate-300 bg-white text-slate-900 placeholder:text-slate-500");
  const thead = dark ? "bg-slate-800 text-slate-50" : "bg-slate-200 text-slate-900";
  const rowBd = dark ? "border-slate-700" : "border-slate-200";
  const muted = dark ? "text-slate-300" : "text-slate-600";
  const strong = dark ? "text-white" : "text-slate-950";
  const sub = dark ? "text-slate-300" : "text-slate-700";
  const importBox =
    "rounded-xl border p-4 space-y-4 " +
    (dark ? "border-slate-600 bg-slate-950/50" : "border-slate-200 bg-slate-100/90");
  const pageSize = 25;
  const [list, setList] = useState([]);
  const [accounts, setAccounts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [pageMeta, setPageMeta] = useState({ total: 0, totalPages: 1 });
  const [selected, setSelected] = useState(() => new Set());
  const [importText, setImportText] = useState("");
  const [importAccount, setImportAccount] = useState("");
  const [importDelim, setImportDelim] = useState(",");
  const [importSkip, setImportSkip] = useState("1");
  const [filters, setFilters] = useState({
    type: "",
    q: "",
    sort: "date_desc",
    includeArchived: false,
  });
  const [modal, setModal] = useState(null);
  const [form, setForm] = useState({
    type: "expense",
    amount: "",
    category: "uncategorized",
    accountId: "",
    toAccountId: "",
    date: new Date().toISOString().slice(0, 10),
    note: "",
    autoSuggestCategory: true,
    tags: "",
    taxYear: "",
  });
  const [categoryRows, setCategoryRows] = useState([]);
  const [newCatName, setNewCatName] = useState("");

  const refreshCategories = useCallback(async () => {
    try {
      const rows = await api.categories.list();
      setCategoryRows(rows);
    } catch {
      setCategoryRows([]);
    }
  }, []);

  useEffect(() => {
    refreshCategories();
  }, [refreshCategories]);

  const activeCategoryOptions = useMemo(() => {
    if (form.type === "transfer") return [];
    const base =
      form.type === "income"
        ? mergeCategories(DEFAULT_INCOME_CATEGORIES, categoryRows, "income")
        : mergeCategories(DEFAULT_EXPENSE_CATEGORIES, categoryRows, "expense");
    if (
      form.category &&
      !base.some((c) => c.toLowerCase() === form.category.toLowerCase())
    ) {
      return [...base, form.category].sort((a, b) =>
        a.toLowerCase().localeCompare(b.toLowerCase())
      );
    }
    return base;
  }, [form.type, form.category, categoryRows]);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params = {
        sort: filters.sort,
        page: String(page),
        pageSize: String(pageSize),
      };
      if (filters.type) params.type = filters.type;
      if (filters.q) params.q = filters.q;
      if (filters.includeArchived) params.includeArchived = "true";
      const [res, acc] = await Promise.all([
        api.transactions.list(params),
        api.accounts.list(),
      ]);
      setList(res.items || []);
      setPageMeta({
        total: res.total ?? 0,
        totalPages: res.totalPages ?? 1,
      });
      setAccounts(acc);
      setSelected(new Set());
    } catch (e) {
      toast.error(e.message);
    } finally {
      setLoading(false);
    }
  }, [filters.sort, filters.type, filters.q, filters.includeArchived, page]);

  useEffect(() => {
    const t = setTimeout(() => {
      load();
    }, 300);
    return () => clearTimeout(t);
  }, [load]);

  async function submit(e) {
    e.preventDefault();
    try {
      const tags = form.tags
        .split(/[,;]+/)
        .map((s) => s.trim())
        .filter(Boolean)
        .slice(0, 30);
      const ty = form.taxYear.trim();
      const body = {
        type: form.type,
        amount: Number(form.amount),
        category: form.category,
        accountId: form.accountId,
        date: form.date,
        note: form.note,
        autoSuggestCategory: form.autoSuggestCategory,
        tags,
      };
      if (ty) {
        const n = Number(ty);
        if (!Number.isNaN(n)) body.taxYear = n;
      }
      if (form.type === "transfer") body.toAccountId = form.toAccountId;
      if (modal?.mode === "edit" && modal.tx) {
        await api.transactions.update(modal.tx._id, body);
        toast.success("Updated");
      } else {
        await api.transactions.create(body);
        toast.success("Added");
      }
      setModal(null);
      load();
    } catch (err) {
      toast.error(err.message);
    }
  }

  async function removeTx(id) {
    if (!confirm("Archive this transaction? Balances will adjust; you can restore from archived view."))
      return;
    try {
      await api.transactions.remove(id);
      toast.success("Archived");
      load();
    } catch (e) {
      toast.error(e.message);
    }
  }

  async function restoreTx(id) {
    try {
      await api.transactions.restore(id);
      toast.success("Restored");
      load();
    } catch (e) {
      toast.error(e.message);
    }
  }

  async function bulkArchive() {
    const ids = [...selected];
    if (ids.length === 0) return;
    if (!confirm(`Archive ${ids.length} transactions?`)) return;
    try {
      const res = await api.transactions.bulkArchive(ids);
      toast.success(`Archived ${res.archived}`);
      load();
    } catch (e) {
      toast.error(e.message);
    }
  }

  function toggleSelect(id) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function toggleSelectPage() {
    const ids = list.map((t) => t._id);
    const allOn = ids.length && ids.every((id) => selected.has(id));
    setSelected((prev) => {
      const next = new Set(prev);
      if (allOn) ids.forEach((id) => next.delete(id));
      else ids.forEach((id) => next.add(id));
      return next;
    });
  }

  function exportCsv() {
    const rows = list.map((t) => ({
      date: formatDateDMY(t.date),
      type: t.type,
      amount: t.amount,
      category: t.category,
      note: t.note,
      tags: (t.tags || []).join(";"),
      taxYear: t.taxYear ?? "",
    }));
    downloadCsv("velaro-transactions.csv", rows);
    toast.success("Exported");
  }

  const overspendHint = useMemo(() => {
    const exp = list.filter((t) => t.type === "expense");
    const weekMs = 7 * 24 * 60 * 60 * 1000;
    const now = Date.now();
    const thisWeek = exp.filter(
      (t) => now - new Date(t.date).getTime() <= weekMs
    );
    const prevWeek = exp.filter((t) => {
      const d = new Date(t.date).getTime();
      return d < now - weekMs && d >= now - 2 * weekMs;
    });
    const s1 = thisWeek.reduce((a, t) => a + t.amount, 0);
    const s0 = prevWeek.reduce((a, t) => a + t.amount, 0);
    if (s0 > 0 && s1 > s0 * 1.2) {
      return `Weekly spending is ${Math.round(((s1 - s0) / s0) * 100)}% higher than last week.`;
    }
    return null;
  }, [list]);

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className={`font-display text-3xl font-semibold ${strong}`}>Transactions</h1>
          <p className={`${sub} text-sm mt-1`}>Track flow, transfers, and recurring patterns.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          {selected.size > 0 && (
            <button
              type="button"
              onClick={bulkArchive}
            className={
              dark
                ? "px-4 py-2 rounded-xl border border-amber-600/80 bg-amber-950/40 text-amber-100 shadow-sm text-sm"
                : "px-4 py-2 rounded-xl border border-amber-200 bg-amber-50 text-amber-950 shadow-sm text-sm"
            }
          >
            Archive selected ({selected.size})
          </button>
          )}
          <button
            type="button"
            onClick={exportCsv}
            className={
              dark
                ? "px-4 py-2 rounded-xl border border-slate-500 bg-slate-800 text-slate-100 shadow-sm text-sm hover:bg-slate-700"
                : "px-4 py-2 rounded-xl border border-slate-200 bg-white text-slate-800 shadow-sm text-sm hover:bg-slate-50"
            }
          >
            Export CSV
          </button>
          <button
            type="button"
            onClick={() => {
              setNewCatName("");
              setForm({
                type: "expense",
                amount: "",
                category: "uncategorized",
                accountId: accounts[0]?._id || "",
                toAccountId: accounts[1]?._id || "",
                date: new Date().toISOString().slice(0, 10),
                note: "",
                autoSuggestCategory: true,
                tags: "",
                taxYear: "",
              });
              setModal({ mode: "create" });
            }}
            className="px-4 py-2 rounded-xl bg-gradient-to-r from-accent-sky/90 to-accent-violet/90 text-white text-sm font-medium"
          >
            Add transaction
          </button>
        </div>
      </div>

      {overspendHint && (
        <div
          className={
            dark
              ? "rounded-2xl border border-amber-700/60 bg-amber-950/30 px-4 py-3 text-sm text-amber-100 shadow-sm"
              : "rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-950 shadow-sm"
          }
        >
          {overspendHint}
        </div>
      )}

      <div className={`${panel} p-4 flex flex-wrap gap-3 items-center`}>
        <input
          placeholder="Search note or category…"
          value={filters.q}
          onChange={(e) => {
            setPage(1);
            setFilters((f) => ({ ...f, q: e.target.value }));
          }}
          className={`flex-1 min-w-[200px] px-4 py-2 ${field}`}
        />
        <select
          value={filters.type}
          onChange={(e) => {
            setPage(1);
            setFilters((f) => ({ ...f, type: e.target.value }));
          }}
          className={`px-4 py-2 ${field}`}
        >
          <option value="">All types</option>
          <option value="expense">Expense</option>
          <option value="income">Income</option>
          <option value="transfer">Transfer</option>
        </select>
        <select
          value={filters.sort}
          onChange={(e) => {
            setPage(1);
            setFilters((f) => ({ ...f, sort: e.target.value }));
          }}
          className={`px-4 py-2 ${field}`}
        >
          <option value="date_desc">Newest</option>
          <option value="date_asc">Oldest</option>
          <option value="amount_desc">Amount high</option>
          <option value="amount_asc">Amount low</option>
        </select>
        <label className={`flex items-center gap-2 text-xs font-medium shrink-0 ${sub}`}>
          <input
            type="checkbox"
            checked={filters.includeArchived}
            onChange={(e) => {
              setPage(1);
              setFilters((f) => ({ ...f, includeArchived: e.target.checked }));
            }}
          />
          Show archived
        </label>
      </div>

      <div className={`${panel} overflow-hidden`}>
        {loading ? (
          <p className={`p-8 text-center ${muted}`}>Loading…</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className={`text-left font-semibold ${thead}`}>
                  <th className="p-3 w-10">
                    <input
                      type="checkbox"
                      aria-label="Select page"
                      checked={
                        list.length > 0 && list.every((t) => selected.has(t._id))
                      }
                      onChange={toggleSelectPage}
                    />
                  </th>
                  <th className="p-3">Date</th>
                  <th className="p-3">Type</th>
                  <th className="p-3">Category</th>
                  <th className="p-3">Tags</th>
                  <th className="p-3">Account</th>
                  <th className="p-3 text-right">Amount</th>
                  <th className="p-3"> </th>
                </tr>
              </thead>
              <tbody>
                {list.map((t) => (
                  <tr
                    key={t._id}
                    className={`border-t ${rowBd} ${t.deletedAt ? "opacity-60" : ""}`}
                  >
                    <td className="p-3">
                      <input
                        type="checkbox"
                        checked={selected.has(t._id)}
                        onChange={() => toggleSelect(t._id)}
                        disabled={!!t.deletedAt}
                      />
                    </td>
                    <td className={`p-3 ${muted}`}>{formatDateDMY(t.date)}</td>
                    <td className={`p-3 capitalize ${strong}`}>{t.type}</td>
                    <td className={`p-3 ${strong}`}>{t.category}</td>
                    <td className={`p-3 text-xs max-w-[140px] truncate ${muted}`}>
                      {(t.tags || []).join(", ") || "—"}
                    </td>
                    <td className={`p-3 ${muted}`}>
                      {t.accountId?.name || "—"}
                      {t.type === "transfer" && t.toAccountId
                        ? ` → ${t.toAccountId.name}`
                        : ""}
                    </td>
                    <td className={`p-3 text-right font-semibold ${strong}`}>
                      {formatMoney(t.amount, currency)}
                    </td>
                    <td className="p-3 text-right space-x-2">
                      {t.deletedAt ? (
                        <button
                          type="button"
                          className="text-accent-mint text-xs"
                          onClick={() => restoreTx(t._id)}
                        >
                          Restore
                        </button>
                      ) : (
                        <>
                          <button
                            type="button"
                            className="text-accent-sky text-xs"
                            onClick={() => {
                              setNewCatName("");
                              setForm({
                                type: t.type,
                                amount: String(t.amount),
                                category: t.category,
                                accountId: t.accountId?._id || t.accountId,
                                toAccountId: t.toAccountId?._id || t.toAccountId || "",
                                date: new Date(t.date).toISOString().slice(0, 10),
                                note: t.note || "",
                                autoSuggestCategory: false,
                                tags: (t.tags || []).join(", "),
                                taxYear: t.taxYear != null ? String(t.taxYear) : "",
                              });
                              setModal({ mode: "edit", tx: t });
                            }}
                          >
                            Edit
                          </button>
                          <button
                            type="button"
                            className="text-accent-rose text-xs"
                            onClick={() => removeTx(t._id)}
                          >
                            Archive
                          </button>
                        </>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        {!loading && (
          <div
            className={`flex flex-wrap items-center justify-between gap-3 p-3 border-t text-sm font-medium ${rowBd} ${dark ? "text-slate-200" : "text-slate-800"}`}
          >
            <span>
              Page {page} of {pageMeta.totalPages} · {pageMeta.total} transactions
            </span>
            <div className="flex gap-2">
              <button
                type="button"
                disabled={page <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                className={
                  dark
                    ? "px-3 py-1.5 rounded-lg border border-slate-500 bg-slate-800 text-slate-100 disabled:opacity-40 hover:bg-slate-700"
                    : "px-3 py-1.5 rounded-lg border border-slate-300 bg-white text-slate-900 disabled:opacity-40 hover:bg-slate-50"
                }
              >
                Previous
              </button>
              <button
                type="button"
                disabled={page >= pageMeta.totalPages}
                onClick={() => setPage((p) => p + 1)}
                className={
                  dark
                    ? "px-3 py-1.5 rounded-lg border border-slate-500 bg-slate-800 text-slate-100 disabled:opacity-40 hover:bg-slate-700"
                    : "px-3 py-1.5 rounded-lg border border-slate-300 bg-white text-slate-900 disabled:opacity-40 hover:bg-slate-50"
                }
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>

      <div className={`${panel} p-6 space-y-4`}>
        <h2 className={`font-display font-semibold text-lg ${strong}`}>Import CSV</h2>
        <p className={`text-xs ${sub}`}>
          Paste CSV rows (amount, date, category, note columns by default). Dates: YYYY-MM-DD or
          DD/MM/YYYY. Header row: set &quot;Skip rows&quot; to 1.
        </p>
        <div className={importBox}>
          <div className="grid sm:grid-cols-3 gap-3">
            <div>
              <label className={`text-xs font-semibold block mb-1.5 ${sub}`}>Account</label>
              <select
                className={`w-full py-2.5 ${field}`}
                value={importAccount || accounts[0]?._id || ""}
                onChange={(e) => setImportAccount(e.target.value)}
              >
                {accounts.map((a) => (
                  <option key={a._id} value={a._id}>
                    {a.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className={`text-xs font-semibold block mb-1.5 ${sub}`}>Delimiter</label>
              <input
                className={`w-full py-2.5 ${field}`}
                value={importDelim}
                onChange={(e) => setImportDelim(e.target.value || ",")}
              />
            </div>
            <div>
              <label className={`text-xs font-semibold block mb-1.5 ${sub}`}>Skip rows</label>
              <input
                type="number"
                min="0"
                className={`w-full py-2.5 ${field}`}
                value={importSkip}
                onChange={(e) => setImportSkip(e.target.value)}
              />
            </div>
          </div>
          <div>
            <label className={`text-xs font-semibold block mb-1.5 ${sub}`}>CSV data</label>
            <textarea
              className={`w-full min-h-[140px] font-mono py-2.5 ${field}`}
              placeholder={`1200,2024-01-15,groceries,weekly shop\n800,15/01/2024,dining,out`}
              value={importText}
              onChange={(e) => setImportText(e.target.value)}
            />
          </div>
          <button
            type="button"
            className="w-full sm:w-auto px-6 py-2.5 rounded-xl text-sm font-medium text-white shadow-md bg-gradient-to-r from-accent-sky/90 to-accent-violet/90 hover:from-accent-sky hover:to-accent-violet focus:outline-none focus:ring-2 focus:ring-sky-400/50"
            onClick={async () => {
            const acc = importAccount || accounts[0]?._id;
            if (!acc) {
              toast.error("Create an account first");
              return;
            }
            if (!importText.trim()) {
              toast.error("Paste CSV text");
              return;
            }
            try {
              const res = await api.import.transactions({
                accountId: acc,
                csvText: importText,
                delimiter: importDelim || ",",
                skipRows: Number(importSkip) || 0,
                defaultType: "expense",
              });
              toast.success(`Imported ${res.created}${res.errors?.length ? ` (${res.errors.length} row errors)` : ""}`);
              setImportText("");
              load();
            } catch (e) {
              toast.error(e.message);
            }
          }}
        >
          Run import
        </button>
        </div>
      </div>

      <RecurringPanel
        onChanged={load}
        accounts={accounts}
        currency={currency}
        categoryRows={categoryRows}
        refreshCategories={refreshCategories}
      />

      <AnimatePresence>
        {modal && (
          <motion.div
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <button
              type="button"
              className="absolute inset-0 bg-slate-900/40"
              aria-label="Close"
              onClick={() => {
                setNewCatName("");
                setModal(null);
              }}
            />
            <motion.form
              initial={{ scale: 0.96, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.96, opacity: 0 }}
              onSubmit={submit}
              className={`relative w-full max-w-lg p-6 space-y-4 ${panel}`}
            >
              <h3 className={`font-display text-lg font-semibold ${strong}`}>
                {modal.mode === "edit" ? "Edit transaction" : "New transaction"}
              </h3>
              <div className="grid grid-cols-2 gap-3">
                <label className={`text-xs font-medium col-span-2 ${sub}`}>Type</label>
                <select
                  className={`col-span-2 ${field}`}
                  value={form.type}
                  onChange={(e) => {
                    const t = e.target.value;
                    setForm((f) => {
                      if (t === "transfer") return { ...f, type: t };
                      const incomeOpts = mergeCategories(
                        DEFAULT_INCOME_CATEGORIES,
                        categoryRows,
                        "income"
                      );
                      const expenseOpts = mergeCategories(
                        DEFAULT_EXPENSE_CATEGORIES,
                        categoryRows,
                        "expense"
                      );
                      const opts = t === "income" ? incomeOpts : expenseOpts;
                      let cat = f.category;
                      if (
                        !opts.some(
                          (c) => c.toLowerCase() === (cat || "").toLowerCase()
                        )
                      ) {
                        cat =
                          opts[0] ||
                          (t === "income" ? "salary" : "uncategorized");
                      }
                      return { ...f, type: t, category: cat };
                    });
                  }}
                >
                  <option value="expense">Expense</option>
                  <option value="income">Income</option>
                  <option value="transfer">Transfer</option>
                </select>
                <label className={`text-xs font-medium ${sub}`}>Amount</label>
                <label className={`text-xs font-medium ${sub}`}>Date</label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  required
                  className={field}
                  value={form.amount}
                  onChange={(e) => setForm((f) => ({ ...f, amount: e.target.value }))}
                />
                <input
                  type="date"
                  required
                  className={field}
                  value={form.date}
                  onChange={(e) => setForm((f) => ({ ...f, date: e.target.value }))}
                />
              </div>
              {form.type !== "transfer" && (
                <>
                  <label className={`text-xs font-medium ${sub}`}>
                    Category ({form.type === "income" ? "income" : "expense"} types)
                  </label>
                  <select
                    className={`w-full ${field}`}
                    value={form.category}
                    onChange={(e) => setForm((f) => ({ ...f, category: e.target.value }))}
                  >
                    {activeCategoryOptions.map((c) => (
                      <option key={c} value={c}>
                        {displayCategoryLabel(c)}
                      </option>
                    ))}
                  </select>
                  <div className="flex flex-wrap gap-2 items-center">
                    <input
                      type="text"
                      placeholder="New category name…"
                      className={`flex-1 min-w-[140px] ${field}`}
                      value={newCatName}
                      onChange={(e) => setNewCatName(e.target.value)}
                    />
                    <button
                      type="button"
                      className={
                        dark
                          ? "px-3 py-2 rounded-xl bg-slate-800 border border-slate-500 text-sm shrink-0 text-slate-100"
                          : "px-3 py-2 rounded-xl bg-slate-100 border border-slate-300 text-sm shrink-0 text-slate-900"
                      }
                      onClick={async () => {
                        const trimmed = newCatName.trim();
                        if (!trimmed) {
                          toast.error("Enter a category name");
                          return;
                        }
                        const kind = form.type === "income" ? "income" : "expense";
                        try {
                          await api.categories.create({ name: trimmed, kind });
                          await refreshCategories();
                          setForm((f) => ({ ...f, category: trimmed }));
                          setNewCatName("");
                          toast.success("Category added");
                        } catch (err) {
                          toast.error(err.message);
                        }
                      }}
                    >
                      Add category
                    </button>
                  </div>
                </>
              )}
              <label className={`text-xs font-medium ${sub}`}>
                {form.type === "transfer" ? "From account" : "Account"}
              </label>
              <select
                className={`w-full ${field}`}
                value={form.accountId}
                onChange={(e) => setForm((f) => ({ ...f, accountId: e.target.value }))}
                required
              >
                {accounts.map((a) => (
                  <option key={a._id} value={a._id}>
                    {a.name} ({a.type})
                  </option>
                ))}
              </select>
              {form.type === "transfer" && (
                <>
                  <label className={`text-xs font-medium ${sub}`}>To account</label>
                  <select
                    className={`w-full ${field}`}
                    value={form.toAccountId}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, toAccountId: e.target.value }))
                    }
                    required
                  >
                    {accounts.map((a) => (
                      <option key={a._id} value={a._id}>
                        {a.name}
                      </option>
                    ))}
                  </select>
                </>
              )}
              <label className={`text-xs font-medium ${sub}`}>Note</label>
              <textarea
                className={`w-full min-h-[72px] ${field}`}
                value={form.note}
                onChange={(e) => setForm((f) => ({ ...f, note: e.target.value }))}
              />
              <label className={`text-xs font-medium ${sub}`}>Tags (comma-separated)</label>
              <input
                className={`w-full ${field}`}
                value={form.tags}
                onChange={(e) => setForm((f) => ({ ...f, tags: e.target.value }))}
                placeholder="tax, business, travel…"
              />
              <label className={`text-xs font-medium ${sub}`}>Tax year (optional)</label>
              <input
                type="number"
                min="2000"
                max="2100"
                className={`w-full ${field}`}
                value={form.taxYear}
                onChange={(e) => setForm((f) => ({ ...f, taxYear: e.target.value }))}
                placeholder="e.g. 2024"
              />
              {form.type !== "transfer" && (
                <label className={`flex items-center gap-2 text-xs font-medium ${sub}`}>
                  <input
                    type="checkbox"
                    checked={form.autoSuggestCategory}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, autoSuggestCategory: e.target.checked }))
                    }
                  />
                  Auto-suggest category from note
                </label>
              )}
              <div className="flex gap-2 pt-2">
                <button
                  type="submit"
                  className="flex-1 py-2.5 rounded-xl bg-accent-sky/90 text-surface-950 font-medium text-sm"
                >
                  Save
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setNewCatName("");
                    setModal(null);
                  }}
                  className={
                    dark
                      ? "px-4 py-2.5 rounded-xl border border-slate-500 bg-slate-800 text-slate-100 text-sm shadow-sm"
                      : "px-4 py-2.5 rounded-xl border border-slate-300 bg-white text-slate-800 text-sm shadow-sm"
                  }
                >
                  Cancel
                </button>
              </div>
            </motion.form>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function RecurringPanel({ onChanged, accounts, currency, categoryRows, refreshCategories }) {
  const dark = useThemeStore((s) => s.mode === "dark");
  const panel =
    "rounded-2xl border backdrop-blur-xl " +
    (dark
      ? "border-slate-600/90 bg-slate-900/95 text-slate-100 shadow-[0_4px_24px_rgba(0,0,0,0.35)] [color-scheme:dark]"
      : "border-slate-200/90 bg-white/95 text-slate-900 shadow-[0_4px_24px_rgba(15,23,42,0.06)] [color-scheme:light]");
  const field =
    "rounded-xl border px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-sky-500/35 " +
    (dark
      ? "border-slate-500 bg-slate-950 text-slate-100 placeholder:text-slate-400"
      : "border-slate-300 bg-white text-slate-900 placeholder:text-slate-500");
  const strong = dark ? "text-white" : "text-slate-950";
  const sub = dark ? "text-slate-300" : "text-slate-700";
  const muted = dark ? "text-slate-400" : "text-slate-600";
  const divide = dark ? "divide-slate-700" : "divide-slate-200";

  const [items, setItems] = useState([]);
  const [open, setOpen] = useState(false);
  const [newRcCat, setNewRcCat] = useState("");
  const [f, setF] = useState({
    transactionType: "expense",
    amount: "",
    category: "uncategorized",
    accountId: "",
    frequency: "monthly",
    note: "",
  });

  const recurringCategoryOptions = useMemo(() => {
    const kind = f.transactionType === "income" ? "income" : "expense";
    const base =
      kind === "income"
        ? mergeCategories(DEFAULT_INCOME_CATEGORIES, categoryRows, "income")
        : mergeCategories(DEFAULT_EXPENSE_CATEGORIES, categoryRows, "expense");
    if (
      f.category &&
      !base.some((c) => c.toLowerCase() === f.category.toLowerCase())
    ) {
      return [...base, f.category].sort((a, b) =>
        a.toLowerCase().localeCompare(b.toLowerCase())
      );
    }
    return base;
  }, [f.transactionType, f.category, categoryRows]);

  async function loadR() {
    try {
      const r = await api.recurring.list();
      setItems(r);
    } catch {
      setItems([]);
    }
  }

  useEffect(() => {
    loadR();
  }, []);

  async function addRecurring(e) {
    e.preventDefault();
    try {
      await api.recurring.create({
        transactionType: f.transactionType,
        amount: Number(f.amount),
        category: f.category,
        accountId: f.accountId || accounts[0]?._id,
        frequency: f.frequency,
        note: f.note,
      });
      toast.success("Recurring saved");
      setOpen(false);
      loadR();
      onChanged?.();
    } catch (err) {
      toast.error(err.message);
    }
  }

  async function applyDue() {
    try {
      const res = await api.recurring.applyDue();
      toast.success(`Applied ${res.applied} recurring`);
      onChanged?.();
    } catch (e) {
      toast.error(e.message);
    }
  }

  async function del(id) {
    try {
      await api.recurring.remove(id);
      loadR();
    } catch (e) {
      toast.error(e.message);
    }
  }

  return (
    <div className={`${panel} p-6 space-y-4`}>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className={`font-display font-semibold ${strong}`}>Recurring</h2>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={applyDue}
            className={
              dark
                ? "text-xs px-3 py-2 rounded-lg border border-slate-500 bg-slate-800 text-slate-100 shadow-sm"
                : "text-xs px-3 py-2 rounded-lg border border-slate-300 bg-white text-slate-800 shadow-sm"
            }
          >
            Apply due
          </button>
          <button
            type="button"
            onClick={() => {
              setNewRcCat("");
              setF({
                transactionType: "expense",
                amount: "",
                category: "utilities",
                accountId: accounts[0]?._id || "",
                frequency: "monthly",
                note: "",
              });
              setOpen(true);
            }}
            className={
              dark
                ? "text-xs px-3 py-2 rounded-lg bg-slate-800 border border-slate-500 text-slate-100"
                : "text-xs px-3 py-2 rounded-lg bg-slate-100 border border-slate-300 text-slate-900"
            }
          >
            Add recurring
          </button>
        </div>
      </div>
      <ul className={`divide-y text-sm ${divide}`}>
        {items.length === 0 ? (
          <li className={`py-4 ${muted}`}>No recurring items</li>
        ) : (
          items.map((r) => (
            <li key={r._id} className="py-3 flex justify-between gap-2">
              <span className={strong}>
                <span className="capitalize">{r.transactionType}</span> · {r.category} ·{" "}
                {formatMoney(r.amount, currency)}{" "}
                <span className={muted}>({r.frequency})</span>
              </span>
              <button type="button" className="text-accent-rose text-xs" onClick={() => del(r._id)}>
                Remove
              </button>
            </li>
          ))
        )}
      </ul>
      <AnimatePresence>
        {open && (
          <motion.form
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            onSubmit={addRecurring}
            className="grid sm:grid-cols-2 gap-3 overflow-hidden"
          >
            <select
              className={field}
              value={f.transactionType}
              onChange={(e) => {
                const tt = e.target.value;
                setF((x) => {
                  const kind = tt === "income" ? "income" : "expense";
                  const opts = mergeCategories(
                    kind === "income"
                      ? DEFAULT_INCOME_CATEGORIES
                      : DEFAULT_EXPENSE_CATEGORIES,
                    categoryRows,
                    kind
                  );
                  let cat = x.category;
                  if (!opts.some((c) => c.toLowerCase() === (cat || "").toLowerCase())) {
                    cat =
                      opts[0] ||
                      (kind === "income" ? "salary" : "uncategorized");
                  }
                  return { ...x, transactionType: tt, category: cat };
                });
              }}
            >
              <option value="expense">Expense</option>
              <option value="income">Income</option>
            </select>
            <input
              type="number"
              placeholder="Amount"
              required
              className={field}
              value={f.amount}
              onChange={(e) => setF((x) => ({ ...x, amount: e.target.value }))}
            />
            <select
              className={field}
              value={f.category}
              onChange={(e) => setF((x) => ({ ...x, category: e.target.value }))}
            >
              {recurringCategoryOptions.map((c) => (
                <option key={c} value={c}>
                  {displayCategoryLabel(c)}
                </option>
              ))}
            </select>
            <div className="sm:col-span-2 flex flex-wrap gap-2 items-center">
              <input
                type="text"
                placeholder="Add new category…"
                className={`flex-1 min-w-[120px] ${field}`}
                value={newRcCat}
                onChange={(e) => setNewRcCat(e.target.value)}
              />
              <button
                type="button"
                className={
                  dark
                    ? "px-3 py-2 rounded-xl border border-slate-500 bg-slate-800 text-slate-100 text-xs shrink-0 shadow-sm"
                    : "px-3 py-2 rounded-xl border border-slate-300 bg-white text-slate-800 text-xs shrink-0 shadow-sm"
                }
                onClick={async () => {
                  const trimmed = newRcCat.trim();
                  if (!trimmed) {
                    toast.error("Enter a name");
                    return;
                  }
                  const kind = f.transactionType === "income" ? "income" : "expense";
                  try {
                    await api.categories.create({ name: trimmed, kind });
                    await refreshCategories();
                    setF((x) => ({ ...x, category: trimmed }));
                    setNewRcCat("");
                    toast.success("Category added");
                  } catch (err) {
                    toast.error(err.message);
                  }
                }}
              >
                Add
              </button>
            </div>
            <select
              className={field}
              value={f.accountId}
              onChange={(e) => setF((x) => ({ ...x, accountId: e.target.value }))}
            >
              {accounts.map((a) => (
                <option key={a._id} value={a._id}>
                  {a.name}
                </option>
              ))}
            </select>
            <select
              className={field}
              value={f.frequency}
              onChange={(e) => setF((x) => ({ ...x, frequency: e.target.value }))}
            >
              <option value="weekly">Weekly</option>
              <option value="monthly">Monthly</option>
              <option value="yearly">Yearly</option>
            </select>
            <input
              className={field}
              placeholder="Note"
              value={f.note}
              onChange={(e) => setF((x) => ({ ...x, note: e.target.value }))}
            />
            <div className="sm:col-span-2 flex gap-2">
              <button
                type="submit"
                className="px-4 py-2 rounded-xl bg-accent-mint/80 text-surface-950 text-sm font-medium"
              >
                Save recurring
              </button>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className={
                  dark
                    ? "px-4 py-2 rounded-xl border border-slate-500 bg-slate-800 text-slate-100 text-sm shadow-sm"
                    : "px-4 py-2 rounded-xl border border-slate-300 bg-white text-slate-800 text-sm shadow-sm"
                }
              >
                Cancel
              </button>
            </div>
          </motion.form>
        )}
      </AnimatePresence>
    </div>
  );
}
