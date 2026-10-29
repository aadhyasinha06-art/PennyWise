import { today } from "./dates";

// The original sample data from your App.jsx. Ids start with "demo-" / "goal-"
// so the app can tell sample records apart from records you added yourself.
export function makeSampleTransactions() {
  const date = today();
  return [
    { id: "demo-1", type: "income", amount: 45000, category: "Salary", description: "Monthly salary", date, paymentMethod: "Net banking" },
    { id: "demo-2", type: "expense", amount: 850, category: "Food", description: "Dinner and coffee", date, paymentMethod: "UPI" },
    { id: "demo-3", type: "expense", amount: 2200, category: "Shopping", description: "Everyday essentials", date, paymentMethod: "Card" },
  ];
}

export const makeSampleGoals = () => [
  { id: "goal-1", name: "New Laptop", icon: "💻", target: 80000, saved: 15000, deadline: "", history: [] },
  { id: "goal-2", name: "Dream Vacation", icon: "✈️", target: 50000, saved: 8000, deadline: "", history: [] },
];

export const makeSampleBudgets = () => ({ Food: 6000, Shopping: 5000, Transport: 2500, Entertainment: 2000 });

export const isSample = (item) => typeof item?.id === "string" && (item.id.startsWith("demo-") || item.id.startsWith("goal-"));
