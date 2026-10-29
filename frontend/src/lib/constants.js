export const EXPENSE_CATEGORIES = [
  "Food", "Shopping", "Transport", "Bills", "Entertainment",
  "Health", "Education", "Savings", "Other",
];
export const INCOME_CATEGORIES = ["Salary", "Freelance", "Other"];
export const ALL_CATEGORIES = [...new Set([...EXPENSE_CATEGORIES, ...INCOME_CATEGORIES])];

export const PAYMENT_METHODS = ["UPI", "Card", "Cash", "Net banking", "Other"];

export const GOAL_ICONS = [
  { value: "🎯", label: "General" },
  { value: "💻", label: "Laptop" },
  { value: "✈️", label: "Travel" },
  { value: "🏠", label: "Home" },
  { value: "🚗", label: "Car" },
  { value: "🎓", label: "Education" },
  { value: "🛟", label: "Emergency fund" },
];

export const CURRENCIES = [
  { symbol: "₹", code: "INR", label: "₹ Indian Rupee" },
  { symbol: "$", code: "USD", label: "$ US Dollar" },
  { symbol: "€", code: "EUR", label: "€ Euro" },
];

// Same localStorage keys the original app used, so existing data is kept.
export const STORAGE_KEYS = {
  transactions: "pw_transactions",
  goals: "pw_goals",
  budgets: "pw_budgets",
  profile: "pw_profile",
};

export const CHART_COLORS = ["#22d3ee", "#8b5cf6", "#3b82f6", "#34d399", "#f472b6", "#fbbf24", "#94a3b8"];
