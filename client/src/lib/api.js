import { useAuthStore } from "../store/authStore.js";

const base = "";

async function request(path, options = {}) {
  const token = useAuthStore.getState().token;
  const headers = {
    "Content-Type": "application/json",
    ...options.headers,
  };
  if (token) headers.Authorization = `Bearer ${token}`;
  const res = await fetch(`${base}${path}`, { ...options, headers });
  const text = await res.text();
  let data = null;
  try {
    data = text ? JSON.parse(text) : null;
  } catch {
    data = { message: text || "Error" };
  }
  if (!res.ok) {
    const err = new Error(data?.message || res.statusText);
    err.status = res.status;
    err.data = data;
    throw err;
  }
  return data;
}

export const api = {
  auth: {
    register: (body) =>
      request("/api/auth/register", { method: "POST", body: JSON.stringify(body) }),
    login: (body) =>
      request("/api/auth/login", { method: "POST", body: JSON.stringify(body) }),
    forgotPassword: (body) =>
      request("/api/auth/forgot-password", { method: "POST", body: JSON.stringify(body) }),
    resetPassword: (body) =>
      request("/api/auth/reset-password", { method: "POST", body: JSON.stringify(body) }),
  },
  accounts: {
    list: () => request("/api/accounts"),
    create: (body) =>
      request("/api/accounts", { method: "POST", body: JSON.stringify(body) }),
    update: (id, body) =>
      request(`/api/accounts/${id}`, { method: "PUT", body: JSON.stringify(body) }),
    remove: (id) => request(`/api/accounts/${id}`, { method: "DELETE" }),
  },
  transactions: {
    list: (params) => {
      const q = new URLSearchParams(params || {}).toString();
      return request(`/api/transactions${q ? `?${q}` : ""}`);
    },
    summary: () => request("/api/transactions/summary"),
    get: (id) => request(`/api/transactions/${id}`),
    create: (body) =>
      request("/api/transactions", { method: "POST", body: JSON.stringify(body) }),
    update: (id, body) =>
      request(`/api/transactions/${id}`, { method: "PUT", body: JSON.stringify(body) }),
    remove: (id) => request(`/api/transactions/${id}`, { method: "DELETE" }),
    restore: (id) =>
      request(`/api/transactions/restore/${id}`, {
        method: "POST",
        body: JSON.stringify({}),
      }),
    bulkArchive: (ids) =>
      request("/api/transactions/bulk-archive", {
        method: "POST",
        body: JSON.stringify({ ids }),
      }),
  },
  debts: {
    list: (params) => {
      const q = new URLSearchParams(params || {}).toString();
      return request(`/api/debts${q ? `?${q}` : ""}`);
    },
    create: (body) =>
      request("/api/debts", { method: "POST", body: JSON.stringify(body) }),
    update: (id, body) =>
      request(`/api/debts/${id}`, { method: "PUT", body: JSON.stringify(body) }),
    pay: (id, body) =>
      request(`/api/debts/${id}/pay`, { method: "POST", body: JSON.stringify(body) }),
    remove: (id) => request(`/api/debts/${id}`, { method: "DELETE" }),
  },
  budgets: {
    list: (params) => {
      const q = new URLSearchParams(params || {}).toString();
      return request(`/api/budgets${q ? `?${q}` : ""}`);
    },
    create: (body) =>
      request("/api/budgets", { method: "POST", body: JSON.stringify(body) }),
    update: (id, body) =>
      request(`/api/budgets/${id}`, { method: "PUT", body: JSON.stringify(body) }),
    remove: (id) => request(`/api/budgets/${id}`, { method: "DELETE" }),
  },
  investments: {
    list: (params) => {
      const q = new URLSearchParams(params || {}).toString();
      return request(`/api/investments${q ? `?${q}` : ""}`);
    },
    create: (body) =>
      request("/api/investments", { method: "POST", body: JSON.stringify(body) }),
    update: (id, body) =>
      request(`/api/investments/${id}`, { method: "PUT", body: JSON.stringify(body) }),
    remove: (id) => request(`/api/investments/${id}`, { method: "DELETE" }),
  },
  subscriptions: {
    list: (params) => {
      const q = new URLSearchParams(params || {}).toString();
      return request(`/api/subscriptions${q ? `?${q}` : ""}`);
    },
    create: (body) =>
      request("/api/subscriptions", { method: "POST", body: JSON.stringify(body) }),
    update: (id, body) =>
      request(`/api/subscriptions/${id}`, { method: "PUT", body: JSON.stringify(body) }),
    remove: (id) => request(`/api/subscriptions/${id}`, { method: "DELETE" }),
  },
  recurring: {
    list: () => request("/api/recurring"),
    create: (body) =>
      request("/api/recurring", { method: "POST", body: JSON.stringify(body) }),
    update: (id, body) =>
      request(`/api/recurring/${id}`, { method: "PUT", body: JSON.stringify(body) }),
    remove: (id) => request(`/api/recurring/${id}`, { method: "DELETE" }),
    applyDue: () => request("/api/recurring/apply-due", { method: "POST" }),
  },
  analytics: {
    overview: (range) =>
      request(`/api/analytics/overview${range ? `?range=${range}` : ""}`),
    budgetStatus: (params) => {
      const q = new URLSearchParams(params || {}).toString();
      return request(`/api/analytics/budget-status${q ? `?${q}` : ""}`);
    },
  },
  user: {
    patchMe: (body) =>
      request("/api/user/me", { method: "PATCH", body: JSON.stringify(body) }),
    exportData: () => request("/api/user/export"),
  },
  goals: {
    list: () => request("/api/goals"),
    create: (body) => request("/api/goals", { method: "POST", body: JSON.stringify(body) }),
    update: (id, body) =>
      request(`/api/goals/${id}`, { method: "PUT", body: JSON.stringify(body) }),
    remove: (id) => request(`/api/goals/${id}`, { method: "DELETE" }),
  },
  import: {
    transactions: (body) =>
      request("/api/import/transactions", { method: "POST", body: JSON.stringify(body) }),
  },
  categories: {
    list: (params) => {
      const q = new URLSearchParams(params || {}).toString();
      return request(`/api/categories${q ? `?${q}` : ""}`);
    },
    create: (body) =>
      request("/api/categories", { method: "POST", body: JSON.stringify(body) }),
    remove: (id) => request(`/api/categories/${id}`, { method: "DELETE" }),
  },
};
