// Talks to the PennyWise Express backend. No database credentials live here;
// the browser only ever holds a login token (JWT) issued by the backend.
const BASE = import.meta.env.VITE_API_URL || "http://localhost:5000/api";
const TOKEN_KEY = "pw_token";
const USER_KEY = "pw_user";

export class ApiError extends Error {
  constructor(message, status = 0) { super(message); this.status = status; }
}

let onUnauthorized = null;
export const setUnauthorizedHandler = (fn) => { onUnauthorized = fn; };

export const getToken = () => { try { return localStorage.getItem(TOKEN_KEY); } catch { return null; } };
export function saveSession(token, user) {
  localStorage.setItem(TOKEN_KEY, token);
  localStorage.setItem(USER_KEY, JSON.stringify(user));
}
export function clearSession() {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
}
export function getSavedUser() {
  try { return getToken() ? JSON.parse(localStorage.getItem(USER_KEY)) : null; } catch { return null; }
}

async function request(path, { method = "GET", body, auth = true } = {}) {
  const headers = {};
  if (body !== undefined) headers["Content-Type"] = "application/json";
  if (auth && getToken()) headers.Authorization = `Bearer ${getToken()}`;

  let res;
  try {
    res = await fetch(BASE + path, { method, headers, body: body !== undefined ? JSON.stringify(body) : undefined });
  } catch {
    throw new ApiError("Cannot reach the PennyWise server. Is the backend running (npm start in the backend folder)?");
  }
  let data = null;
  try { data = await res.json(); } catch { /* empty body */ }

  if (!res.ok) {
    if (res.status === 401 && auth && onUnauthorized) onUnauthorized();
    const detail = Array.isArray(data?.errors) ? data.errors.map((e) => `${e.field}: ${e.message}`).join("; ") : "";
    throw new ApiError(detail || data?.message || `Request failed (${res.status}).`, res.status);
  }
  return data;
}

/* ---------- auth ---------- */
export const health = () => request("/health", { auth: false });
export const register = (body) => request("/auth/register", { method: "POST", body, auth: false });
export const login = (body) => request("/auth/login", { method: "POST", body, auth: false });

/* ---------- transactions ---------- */
export async function listTransactions() {
  const all = [];
  for (let offset = 0; offset < 5000; offset += 100) {
    const { transactions } = await request(`/transactions?limit=100&offset=${offset}`);
    all.push(...transactions);
    if (transactions.length < 100) break;
  }
  return all;
}
export const createTransaction = (body) => request("/transactions", { method: "POST", body });
export const updateTransaction = (id, body) => request(`/transactions/${id}`, { method: "PATCH", body });
export const deleteTransaction = (id) => request(`/transactions/${id}`, { method: "DELETE" });

/* ---------- goals ---------- */
export const listGoals = () => request("/goals");
export const createGoal = (body) => request("/goals", { method: "POST", body });
export const updateGoal = (id, body) => request(`/goals/${id}`, { method: "PATCH", body });
export const deleteGoal = (id) => request(`/goals/${id}`, { method: "DELETE" });

/* ---------- budgets (stored per month on the server) ---------- */
export const listBudgets = (month) => request(`/budgets?month=${month}`);
export const createBudget = (body) => request("/budgets", { method: "POST", body });
export const updateBudget = (id, body) => request(`/budgets/${id}`, { method: "PATCH", body });
export const deleteBudget = (id) => request(`/budgets/${id}`, { method: "DELETE" });
