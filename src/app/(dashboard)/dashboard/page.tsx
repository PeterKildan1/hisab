"use client";
import { useEffect, useState } from "react";
import {
  BarChart, Bar, LineChart, Line, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend
} from "recharts";
import { TrendingUp, TrendingDown, Wallet, Clock, AlertTriangle, Info, DollarSign, ArrowUpRight, ArrowDownRight } from "lucide-react";

const COLORS = ["#3b82f6", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6", "#ec4899", "#06b6d4", "#84cc16"];

function StatCard({ title, value, subtitle, trend, color = "blue", icon: Icon }: {
  title: string; value: string; subtitle?: string; trend?: "up" | "down";
  color?: "blue" | "green" | "red" | "amber"; icon?: React.ElementType;
}) {
  const colors = {
    blue: "bg-blue-50 text-blue-700 border-blue-100",
    green: "bg-green-50 text-green-700 border-green-100",
    red: "bg-red-50 text-red-700 border-red-100",
    amber: "bg-amber-50 text-amber-700 border-amber-100",
  };
  const iconColors = {
    blue: "bg-blue-100 text-blue-600",
    green: "bg-green-100 text-green-600",
    red: "bg-red-100 text-red-600",
    amber: "bg-amber-100 text-amber-600",
  };
  return (
    <div className={`rounded-xl border p-5 ${colors[color]} flex flex-col gap-2`}>
      <div className="flex items-start justify-between">
        <div className="text-sm font-medium opacity-80">{title}</div>
        {Icon && <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${iconColors[color]}`}><Icon className="w-4 h-4" /></div>}
      </div>
      <div className="text-2xl font-bold">{value}</div>
      {subtitle && <div className="text-xs opacity-70 flex items-center gap-1">
        {trend === "up" && <ArrowUpRight className="w-3 h-3" />}
        {trend === "down" && <ArrowDownRight className="w-3 h-3" />}
        {subtitle}
      </div>}
    </div>
  );
}

export default function DashboardPage() {
  const [data, setData] = useState<{
    monthlyIncome: number;
    monthlyExpenses: number;
    netProfit: number;
    cashPosition: number;
    outstandingReceivables: number;
    outstandingPayables: number;
    vatOwed: number;
    upcomingPayments: Array<{ type: string; name: string; amount: number; dueDate: string }>;
    alerts: Array<{ type: string; message: string }>;
    chartData: Array<{ month: string; income: number; expenses: number }>;
    expenseBreakdown: Array<{ name: string; value: number }>;
  } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/reports/dashboard")
      .then(r => r.json())
      .then(d => { setData(d); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  const fmt = (n: number) => `${n.toLocaleString("en-JO", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} JOD`;

  if (loading) return (
    <div className="flex items-center justify-center h-full">
      <div className="animate-spin w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full" />
    </div>
  );

  if (!data) return <div className="p-8 text-gray-500">Failed to load dashboard</div>;

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-sm text-gray-500 mt-0.5">
          Your business at a glance — {new Date().toLocaleString("en", { month: "long", year: "numeric" })}
        </p>
      </div>

      {/* Alerts */}
      {data.alerts.length > 0 && (
        <div className="space-y-2">
          {data.alerts.map((alert, i) => (
            <div key={i} className={`flex items-start gap-3 p-3 rounded-lg text-sm ${
              alert.type === "warning" ? "bg-amber-50 border border-amber-200 text-amber-800" : "bg-blue-50 border border-blue-200 text-blue-800"
            }`}>
              {alert.type === "warning" ? <AlertTriangle className="w-4 h-4 flex-shrink-0 mt-0.5" /> : <Info className="w-4 h-4 flex-shrink-0 mt-0.5" />}
              {alert.message}
            </div>
          ))}
        </div>
      )}

      {/* Key metrics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard title="Monthly Income" value={fmt(data.monthlyIncome)} subtitle="This month" trend="up" color="green" icon={TrendingUp} />
        <StatCard title="Monthly Expenses" value={fmt(data.monthlyExpenses)} subtitle="This month" trend="down" color="red" icon={TrendingDown} />
        <StatCard title="Net Profit" value={fmt(data.netProfit)} subtitle="Income - Expenses" color={data.netProfit >= 0 ? "green" : "red"} icon={DollarSign} />
        <StatCard title="Cash Position" value={fmt(data.cashPosition)} subtitle="Available cash" color="blue" icon={Wallet} />
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard title="Receivables" value={fmt(data.outstandingReceivables)} subtitle="Owed to you" color="blue" icon={ArrowUpRight} />
        <StatCard title="Payables" value={fmt(data.outstandingPayables)} subtitle="You owe" color="amber" icon={ArrowDownRight} />
        <StatCard title="VAT Owed" value={fmt(data.vatOwed)} subtitle="To tax authority" color={data.vatOwed > 0 ? "amber" : "green"} icon={Calculator} />
        <StatCard title="Due in 30 Days" value={fmt(data.upcomingPayments.reduce((s, p) => s + p.amount, 0))} subtitle={`${data.upcomingPayments.length} payments`} color="amber" icon={Clock} />
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Income vs Expenses 6-month */}
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <h3 className="font-semibold text-gray-800 mb-1">Income vs Expenses</h3>
          <p className="text-xs text-gray-400 mb-4">Last 6 months — green is good, red is spending</p>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={data.chartData} barSize={20}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="month" tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 11 }} tickFormatter={v => `${(v / 1000).toFixed(0)}k`} />
              <Tooltip formatter={(v: number) => `${v.toFixed(2)} JOD`} />
              <Legend />
              <Bar dataKey="income" name="Income" fill="#10b981" radius={[4, 4, 0, 0]} />
              <Bar dataKey="expenses" name="Expenses" fill="#ef4444" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Expense breakdown */}
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <h3 className="font-semibold text-gray-800 mb-1">Expense Breakdown</h3>
          <p className="text-xs text-gray-400 mb-4">Where your money is going</p>
          {data.expenseBreakdown.length > 0 ? (
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie data={data.expenseBreakdown} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`} labelLine={false}>
                  {data.expenseBreakdown.map((_, i) => (
                    <Cell key={i} fill={COLORS[i % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(v: number) => `${v.toFixed(2)} JOD`} />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center h-[220px] text-gray-400 text-sm">
              No expense data yet
            </div>
          )}
        </div>
      </div>

      {/* Upcoming payments */}
      {data.upcomingPayments.length > 0 && (
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <h3 className="font-semibold text-gray-800 mb-1">Upcoming Payments</h3>
          <p className="text-xs text-gray-400 mb-4">What you need to pay in the next 30 days</p>
          <div className="space-y-2">
            {data.upcomingPayments.map((p, i) => (
              <div key={i} className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0">
                <div>
                  <div className="text-sm font-medium text-gray-800">{p.name}</div>
                  <div className="text-xs text-gray-400">
                    {p.type === "loan" ? "Loan payment" : "Supplier bill"} · Due {new Date(p.dueDate).toLocaleDateString("en-GB", { day: "2-digit", month: "short" })}
                  </div>
                </div>
                <div className="text-sm font-semibold text-red-600">{fmt(p.amount)}</div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function Calculator(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg {...props} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
      <rect x="4" y="2" width="16" height="20" rx="2" />
      <line x1="8" y1="6" x2="16" y2="6" /><line x1="8" y1="10" x2="16" y2="10" />
      <line x1="8" y1="14" x2="10" y2="14" /><line x1="14" y1="14" x2="16" y2="14" />
      <line x1="8" y1="18" x2="10" y2="18" /><line x1="14" y1="18" x2="16" y2="18" />
    </svg>
  );
}
