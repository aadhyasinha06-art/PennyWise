import { Area, AreaChart, Bar, BarChart, CartesianGrid, Cell, Legend, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { CHART_COLORS } from "../lib/constants";

const axisProps = { stroke: "#64748b", tick: { fill: "#94a3b8", fontSize: 11 }, tickLine: false, axisLine: false };
const tooltipStyle = {
  contentStyle: { background: "#0b1224", border: "1px solid rgba(148,163,184,.25)", borderRadius: 10, fontSize: 12 },
  labelStyle: { color: "#e2e8f0" },
  itemStyle: { color: "#cbd5e1" },
};
const compact = new Intl.NumberFormat("en-IN", { notation: "compact", maximumFractionDigits: 1 });

export function IncomeExpenseBars({ data, fmt, height = 280 }) {
  return (
    <div className="chart-box" style={{ height }}>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 8, right: 8, left: -8, bottom: 0 }}>
          <CartesianGrid stroke="rgba(148,163,184,.1)" vertical={false} />
          <XAxis dataKey="label" {...axisProps} />
          <YAxis {...axisProps} tickFormatter={(v) => compact.format(v)} width={48} />
          <Tooltip {...tooltipStyle} formatter={(v) => fmt(v)} cursor={{ fill: "rgba(148,163,184,.06)" }} />
          <Legend wrapperStyle={{ fontSize: 12, color: "#94a3b8" }} />
          <Bar dataKey="income" name="Income" fill="#22d3ee" radius={[5, 5, 0, 0]} maxBarSize={28} />
          <Bar dataKey="expenses" name="Expenses" fill="#8b5cf6" radius={[5, 5, 0, 0]} maxBarSize={28} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

export function NetTrendArea({ data, fmt, height = 240 }) {
  return (
    <div className="chart-box" style={{ height }}>
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 8, right: 8, left: -8, bottom: 0 }}>
          <defs>
            <linearGradient id="netFill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#3b82f6" stopOpacity={0.5} />
              <stop offset="100%" stopColor="#3b82f6" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid stroke="rgba(148,163,184,.1)" vertical={false} />
          <XAxis dataKey="label" {...axisProps} />
          <YAxis {...axisProps} tickFormatter={(v) => compact.format(v)} width={48} />
          <Tooltip {...tooltipStyle} formatter={(v) => fmt(v)} />
          <Area type="monotone" dataKey="net" name="Net savings" stroke="#60a5fa" strokeWidth={2} fill="url(#netFill)" />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}

export function CategoryDonut({ data, fmt, height = 240 }) {
  return (
    <div className="chart-box" style={{ height }}>
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie data={data} dataKey="value" nameKey="name" innerRadius="58%" outerRadius="85%" paddingAngle={2} stroke="none">
            {data.map((_, i) => <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />)}
          </Pie>
          <Tooltip {...tooltipStyle} formatter={(v) => fmt(v)} />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}

export function CategoryLegend({ data, fmt, total }) {
  return (
    <ul className="legend-list">
      {data.map((d, i) => (
        <li key={d.name}>
          <i style={{ background: CHART_COLORS[i % CHART_COLORS.length] }} />
          <span>{d.name}</span>
          <em>{total ? Math.round((d.value / total) * 100) : 0}%</em>
          <strong>{fmt(d.value)}</strong>
        </li>
      ))}
    </ul>
  );
}
