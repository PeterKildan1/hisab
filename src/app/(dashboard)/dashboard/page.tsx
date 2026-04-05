"use client";
import { useEffect, useState } from "react";
import {
  BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend
} from "recharts";
import {
  TrendingUp, TrendingDown, Wallet, Clock, AlertTriangle, Info,
  DollarSign, ArrowUpRight, ArrowDownRight, Target, PiggyBank, Heart
} from "lucide-react";
import { useUser } from "@/lib/useUser";
import OnboardingCard from "@/components/OnboardingCard";

const COLORS = ["#3b82f6", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6", "#ec4899", "#06b6d4", "#84cc16"];

function StatCard({ title, value, subtitle, color = "blue", icon: Icon }: {
  title: string; value: string; subtitle?: string; color?: string; icon?: React.ElementType;
}) {
  const styles: Record<string, string> = {
    blue: "bg-blue-50 text-blue-700 border-blue-100",
    green: "bg-green-50 text-green-700 border-green-100",
    red: "bg-red-50 text-red-700 border-red-100",
    amber: "bg-amber-50 text-amber-700 border-amber-100",
    purple: "bg-purple-50 text-purple-700 border-purple-100",
    rose: "bg-rose-50 text-rose-700 border-rose-100",
  };
  const iconStyles: Record<string, string> = {
    blue: "bg-blue-100 text-blue-600",
    green: "bg-green-100 text-green-600",
    red: "bg-red-100 text-red-600",
    amber: "bg-amber-100 text-amber-600",
    purple: "bg-purple-100 text-purple-600",
    rose: "bg-rose-100 text-rose-600",
  };
  return (
    <div className={`rounded-xl border p-5 flex flex-col gap-2 ${styles[color] || styles.blue}`}>
      <div className="flex items-start justify-between">
        <div className="text-sm font-medium opacity-80">{title}</div>
        {Icon && <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${iconStyles[color] || iconStyles.blue}`}><Icon className="w-4 h-4" /></div>}
      </div>
      <div className="text-2xl font-bold">{value}</div>
      {subtitle && <div className="text-xs opacity-70">{subtitle}</div>}
    </div>
  );
}

export default function DashboardPage() {
  const { user } = useUser();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const fmt = (n: number) => `${n.toLocaleString("en-JO", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} JOD`;

  useEffect(() => {
    fetch("/api/reports/dashboard")
      .then(r => r.json())
      .then(d => { setData(d); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  if (loading) return (
    <div className="flex items-center justify-center h-full">
      <div className="animate-spin w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full" />
    </div>
  );

  const accountType = user?.accountType || "SmallBusiness";

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <OnboardingCard page="dashboard" />

      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            {user ? `Welcome, ${user.ownerName.split(" ")[0]}` : "Dashboard"}
          </h1>
          <p className="text-sm text-gray-500 mt-0.5">
            {new Date().toLocaleString("en", { weekday: "long", month: "long", day: "numeric", year: "numeric" })}
          </p>
        </div>
        {user && (
          <div className="text-right">
            <div className="text-sm font-semibold text-gray-700">{user.businessName}</div>
            <div className="text-xs text-gray-400">{user.accountType} account</div>
          </div>
        )}
      </div>

      {!data ? (
        <div className="text-center py-12 text-gray-400">No data yet — start by recording a transaction.</div>
      ) : (
        <>
          {/* Alerts */}
          {data.alerts?.length > 0 && (
            <div className="space-y-2">
              {data.alerts.map((alert: any, i: number) => (
                <div key={i} className={`flex items-start gap-3 p-3 rounded-lg text-sm ${alert.type === "warning" ? "bg-amber-50 border border-amber-200 text-amber-800" : "bg-blue-50 border border-blue-200 text-blue-800"}`}>
                  {alert.type === "warning" ? <AlertTriangle className="w-4 h-4 flex-shrink-0 mt-0.5" /> : <Info className="w-4 h-4 flex-shrink-0 mt-0.5" />}
                  {alert.message}
                </div>
              ))}
            </div>
          )}

          {/* Key metrics — vary by account type */}
          {accountType === "Personal" && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <StatCard title="Monthly Income" value={fmt(data.monthlyIncome)} color="green" icon={TrendingUp} />
              <StatCard title="Monthly Expenses" value={fmt(data.monthlyExpenses)} color="red" icon={TrendingDown} />
              <StatCard title="Net Savings" value={fmt(data.netProfit)} color={data.netProfit >= 0 ? "green" : "red"} icon={PiggyBank} />
              <StatCard title="Cash Available" value={fmt(data.cashPosition)} color="blue" icon={Wallet} />
            </div>
          )}

          {accountType === "Freelancer" && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <StatCard title="Revenue This Month" value={fmt(data.monthlyIncome)} color="purple" icon={TrendingUp} />
              <StatCard title="Business Expenses" value={fmt(data.monthlyExpenses)} color="red" icon={TrendingDown} />
              <StatCard title="Net Profit" value={fmt(data.netProfit)} color={data.netProfit >= 0 ? "green" : "red"} icon={DollarSign} />
              <StatCard title="Invoices Outstanding" value={fmt(data.outstandingReceivables)} color="amber" icon={Clock} />
            </div>
          )}

          {accountType === "Nonprofit" && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <StatCard title="Donations Received" value={fmt(data.monthlyIncome)} color="rose" icon={Heart} />
              <StatCard title="Program Expenses" value={fmt(data.monthlyExpenses)} color="red" icon={TrendingDown} />
              <StatCard title="Net Surplus" value={fmt(data.netProfit)} color={data.netProfit >= 0 ? "green" : "red"} icon={DollarSign} />
              <StatCard title="Cash Position" value={fmt(data.cashPosition)} color="blue" icon={Wallet} />
            </div>
          )}

          {accountType === "SmallBusiness" && (
            <>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <StatCard title="Monthly Income" value={fmt(data.monthlyIncome)} color="green" icon={TrendingUp} />
                <StatCard title="Monthly Expenses" value={fmt(data.monthlyExpenses)} color="red" icon={TrendingDown} />
                <StatCard title="Net Profit" value={fmt(data.netProfit)} color={data.netProfit >= 0 ? "green" : "red"} icon={DollarSign} />
                <StatCard title="Cash Position" value={fmt(data.cashPosition)} color="blue" icon={Wallet} />
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <StatCard title="Receivables" value={fmt(data.outstandingReceivables)} subtitle="Owed to you" color="blue" icon={ArrowUpRight} />
                <StatCard title="Payables" value={fmt(data.outstandingPayables)} subtitle="You owe" color="amber" icon={ArrowDownRight} />
                <StatCard title="VAT Owed" value={fmt(data.vatOwed)} subtitle="To tax authority" color={data.vatOwed > 0 ? "amber" : "green"} />
                <StatCard title="Due in 30 Days" value={fmt(data.upcomingPayments?.reduce((s: number, p: any) => s + p.amount, 0) || 0)} subtitle={`${data.upcomingPayments?.length || 0} payments`} color="amber" icon={Clock} />
              </div>
            </>
          )}

          {/* Charts */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-white rounded-xl border border-gray-200 p-5">
              <h3 className="font-semibold text-gray-800 mb-1">Income vs Expenses</h3>
              <p className="text-xs text-gray-400 mb-4">Last 6 months</p>
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={data.chartData} barSize={18}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} tickFormatter={v => `${(v / 1000).toFixed(0)}k`} />
                  <Tooltip formatter={(v: any) => `${Number(v).toFixed(2)} JOD`} />
                  <Legend />
                  <Bar dataKey="income" name="Income" fill="#10b981" radius={[3, 3, 0, 0]} />
                  <Bar dataKey="expenses" name="Expenses" fill="#ef4444" radius={[3, 3, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>

            <div className="bg-white rounded-xl border border-gray-200 p-5">
              <h3 className="font-semibold text-gray-800 mb-1">Expense Breakdown</h3>
              <p className="text-xs text-gray-400 mb-4">Where money is going</p>
              {data.expenseBreakdown?.length > 0 ? (
                <ResponsiveContainer width="100%" height={200}>
                  <PieChart>
                    <Pie data={data.expenseBreakdown} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={75}
                      label={({ name, percent }: any) => `${name} ${((percent || 0) * 100).toFixed(0)}%`} labelLine={false}>
                      {data.expenseBreakdown.map((_: any, i: number) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                    </Pie>
                    <Tooltip formatter={(v: any) => `${Number(v).toFixed(2)} JOD`} />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex items-center justify-center h-[200px] text-gray-400 text-sm">No expense data yet</div>
              )}
            </div>
          </div>

          {/* Upcoming payments (Business only) */}
          {accountType === "SmallBusiness" && data.upcomingPayments?.length > 0 && (
            <div className="bg-white rounded-xl border border-gray-200 p-5">
              <h3 className="font-semibold text-gray-800 mb-4">Upcoming Payments (Next 30 Days)</h3>
              <div className="space-y-2">
                {data.upcomingPayments.map((p: any, i: number) => (
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
        </>
      )}
    </div>
  );
}
