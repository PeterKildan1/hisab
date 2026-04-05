"use client";
import { useEffect, useRef, useState } from "react";
import {
  BarChart3, Download, Printer, FileSpreadsheet,
  TrendingUp, TrendingDown, Scale, ArrowLeftRight,
  Calculator, Users, FileText, Clock, ChevronDown
} from "lucide-react";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Legend
} from "recharts";
import OnboardingCard, { HelpButton } from "@/components/OnboardingCard";
import { useUser } from "@/lib/useUser";

const today = new Date().toISOString().split("T")[0];
const yearStart = `${new Date().getFullYear()}-01-01`;

const REPORTS = [
  { id: "pnl", label: "Profit & Loss", icon: TrendingUp, desc: "Income vs expenses for any date range", color: "green" },
  { id: "balance", label: "Balance Sheet", icon: Scale, desc: "Everything you own vs everything you owe", color: "blue" },
  { id: "cashflow", label: "Cash Flow", icon: ArrowLeftRight, desc: "Money coming in and going out over time", color: "purple" },
  { id: "vat", label: "VAT Report", icon: Calculator, desc: "Output tax, input tax, and net VAT due", color: "amber" },
  { id: "payroll", label: "Payroll Summary", icon: Users, desc: "Employee salaries and payment history", color: "rose" },
  { id: "invoiceAging", label: "Invoice Aging", icon: Clock, desc: "Who owes you money and for how long", color: "orange" },
  { id: "assets", label: "Asset Register", icon: FileText, desc: "Fixed assets with depreciation schedules", color: "indigo" },
];

const colorBadge: Record<string, string> = {
  green: "bg-green-100 text-green-700",
  blue: "bg-blue-100 text-blue-700",
  purple: "bg-purple-100 text-purple-700",
  amber: "bg-amber-100 text-amber-700",
  rose: "bg-rose-100 text-rose-700",
  orange: "bg-orange-100 text-orange-700",
  indigo: "bg-indigo-100 text-indigo-700",
};

export default function ReportsPage() {
  const { user } = useUser();
  const printRef = useRef<HTMLDivElement>(null);
  const [active, setActive] = useState("pnl");
  const [start, setStart] = useState(yearStart);
  const [end, setEnd] = useState(today);
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<any>(null);

  const load = async () => {
    setLoading(true);
    setData(null);
    try {
      let url = "";
      if (active === "pnl") url = `/api/reports/pnl?start=${start}&end=${end}`;
      else if (active === "balance") url = "/api/reports/balance-sheet";
      else if (active === "vat") {
        const now = new Date();
        const q = Math.floor(now.getMonth() / 3) + 1;
        url = `/api/vat?quarter=${now.getFullYear()}-Q${q}`;
      }
      else if (active === "payroll") url = "/api/reports/payroll";
      else if (active === "invoiceAging") url = `/api/reports/invoice-aging`;
      else if (active === "assets") url = "/api/assets";
      else if (active === "cashflow") url = `/api/reports/cashflow?start=${start}&end=${end}`;

      if (url) {
        const res = await fetch(url);
        setData(await res.json());
      }
    } catch (e) {
      console.error(e);
    }
    setLoading(false);
  };

  useEffect(() => { load(); }, [active, start, end]);

  const handlePrint = () => window.print();

  const exportCSV = () => {
    if (!data) return;
    let csv = "";
    if (active === "pnl" && data.income) {
      csv = "Category,Type,Amount (JOD)\n";
      Object.entries(data.income as Record<string, number>).forEach(([k, v]) => { csv += `"${k}",Income,${v.toFixed(2)}\n`; });
      Object.entries(data.expenses as Record<string, number>).forEach(([k, v]) => { csv += `"${k}",Expense,${v.toFixed(2)}\n`; });
      csv += `\nTotal Income,,${data.totalIncome.toFixed(2)}\nTotal Expenses,,${data.totalExpenses.toFixed(2)}\nNet Profit,,${data.netProfit.toFixed(2)}`;
    } else if (active === "invoiceAging" && data.buckets) {
      csv = "Customer,Invoice #,Date,Due Date,Amount,Days Overdue,Bucket\n";
      data.items?.forEach((i: any) => {
        csv += `"${i.customerName}","${i.number}","${i.date}","${i.dueDate}",${i.outstanding.toFixed(2)},${i.daysOverdue},"${i.bucket}"\n`;
      });
    } else {
      csv = JSON.stringify(data, null, 2);
    }
    const blob = new Blob([csv], { type: "text/csv" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `hisab-${active}-${today}.csv`;
    a.click();
  };

  const fmt = (n: number) => n.toLocaleString("en", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-6 print:p-0 print:space-y-4">
      {/* Print header — only shows when printing */}
      <div className="hidden print:block mb-6 border-b pb-4">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-2xl font-bold text-gray-900">{user?.businessName}</div>
            <div className="text-sm text-gray-500">{user?.ownerName}</div>
          </div>
          <div className="text-right text-sm text-gray-500">
            <div className="font-semibold text-gray-700">Hisab Financial Report</div>
            <div>Generated: {new Date().toLocaleDateString("en-GB", { day: "2-digit", month: "long", year: "numeric" })}</div>
          </div>
        </div>
      </div>

      <div className="print:hidden">
        <OnboardingCard page="reports" />
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
              <BarChart3 className="w-6 h-6 text-blue-600" /> Financial Reports
            </h1>
            <div className="flex items-center gap-2 mt-1">
              <p className="text-sm text-gray-500">Professional statements for your business, bank, or accountant.</p>
              <HelpButton page="reports" />
            </div>
          </div>
          <div className="flex gap-2">
            <button onClick={exportCSV} className="flex items-center gap-2 border border-gray-300 text-gray-700 px-3 py-2 rounded-lg text-sm hover:bg-gray-50">
              <FileSpreadsheet className="w-4 h-4" /> CSV
            </button>
            <button onClick={handlePrint} className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700">
              <Printer className="w-4 h-4" /> Print / PDF
            </button>
          </div>
        </div>
      </div>

      {/* Report selector */}
      <div className="print:hidden grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-2">
        {REPORTS.map(r => {
          const Icon = r.icon;
          return (
            <button key={r.id} onClick={() => setActive(r.id)}
              className={`p-3 rounded-xl border-2 text-left transition-all ${active === r.id ? "border-blue-500 bg-blue-50" : "border-gray-200 bg-white hover:border-gray-300"}`}>
              <Icon className={`w-4 h-4 mb-1 ${active === r.id ? "text-blue-600" : "text-gray-400"}`} />
              <div className={`text-xs font-semibold leading-tight ${active === r.id ? "text-blue-700" : "text-gray-700"}`}>{r.label}</div>
            </button>
          );
        })}
      </div>

      {/* Date range (for date-sensitive reports) */}
      {["pnl", "cashflow"].includes(active) && (
        <div className="print:hidden flex items-center gap-3 flex-wrap">
          <span className="text-sm text-gray-500 font-medium">Period:</span>
          <input type="date" value={start} onChange={e => setStart(e.target.value)}
            className="border border-gray-300 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
          <span className="text-gray-400">—</span>
          <input type="date" value={end} onChange={e => setEnd(e.target.value)}
            className="border border-gray-300 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
          <div className="flex gap-1">
            {[
              { label: "This Month", fn: () => { const n = new Date(); setStart(`${n.getFullYear()}-${String(n.getMonth()+1).padStart(2,"0")}-01`); setEnd(today); }},
              { label: "This Year", fn: () => { setStart(yearStart); setEnd(today); }},
              { label: "Last Year", fn: () => { const y = new Date().getFullYear()-1; setStart(`${y}-01-01`); setEnd(`${y}-12-31`); }},
            ].map(btn => (
              <button key={btn.label} onClick={btn.fn}
                className="text-xs px-2 py-1 bg-gray-100 hover:bg-blue-100 hover:text-blue-700 rounded-md transition-colors">
                {btn.label}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Report content */}
      <div ref={printRef}>
        {loading ? (
          <div className="flex justify-center py-16"><div className="animate-spin w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full" /></div>
        ) : (
          <>
            {active === "pnl" && data && <PNLReport data={data} start={start} end={end} businessName={user?.businessName} fmt={fmt} />}
            {active === "balance" && data && <BalanceReport data={data} businessName={user?.businessName} fmt={fmt} />}
            {active === "cashflow" && data && <CashFlowReport data={data} start={start} end={end} businessName={user?.businessName} fmt={fmt} />}
            {active === "vat" && data && <VATReport data={data} businessName={user?.businessName} fmt={fmt} />}
            {active === "payroll" && data && <PayrollReport data={data} businessName={user?.businessName} fmt={fmt} />}
            {active === "invoiceAging" && data && <InvoiceAgingReport data={data} businessName={user?.businessName} fmt={fmt} />}
            {active === "assets" && data && <AssetsReport data={Array.isArray(data) ? data : []} businessName={user?.businessName} fmt={fmt} />}
          </>
        )}
      </div>
    </div>
  );
}

/* ── P&L Report ─────────────────────────────────────────────────── */
function PNLReport({ data, start, end, businessName, fmt }: any) {
  const chartData = [
    ...Object.entries(data.income as Record<string, number>).map(([name, value]) => ({ name: name.length > 22 ? name.slice(0, 22) + "…" : name, value, fill: "#10b981" })),
    ...Object.entries(data.expenses as Record<string, number>).map(([name, value]) => ({ name: name.length > 22 ? name.slice(0, 22) + "…" : name, value, fill: "#ef4444" })),
  ];

  return (
    <div className="space-y-6">
      <ReportHeader title="Profit & Loss Statement" subtitle={`${fmtDate(start)} — ${fmtDate(end)}`} businessName={businessName} />
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        {/* Summary row */}
        <div className="grid grid-cols-3 gap-4 mb-6">
          <SummaryBox label="Total Income" value={`${fmt(data.totalIncome)} JOD`} color="green" />
          <SummaryBox label="Total Expenses" value={`${fmt(data.totalExpenses)} JOD`} color="red" />
          <SummaryBox label={data.netProfit >= 0 ? "Net Profit" : "Net Loss"} value={`${fmt(Math.abs(data.netProfit))} JOD`} color={data.netProfit >= 0 ? "green" : "red"} large />
        </div>

        {/* Income section */}
        <div className="mb-6">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-2.5 h-2.5 rounded-full bg-green-500" />
            <h3 className="font-semibold text-gray-800 uppercase text-xs tracking-wider">Income</h3>
          </div>
          {Object.entries(data.income as Record<string, number>).length === 0
            ? <div className="text-sm text-gray-400 pl-5 italic">No income recorded in this period</div>
            : Object.entries(data.income as Record<string, number>).map(([name, value]) => (
              <div key={name} className="flex justify-between items-center py-2 border-b border-gray-50 last:border-0 hover:bg-gray-50 px-2 rounded">
                <span className="text-sm text-gray-700 pl-4">{name}</span>
                <span className="text-sm font-medium text-green-700">{fmt(value as number)} JOD</span>
              </div>
            ))}
          <div className="flex justify-between py-2 px-2 bg-green-50 rounded-lg mt-2 font-semibold text-sm">
            <span className="text-green-800">Total Income</span>
            <span className="text-green-800">{fmt(data.totalIncome)} JOD</span>
          </div>
        </div>

        {/* Expenses section */}
        <div className="mb-6">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-2.5 h-2.5 rounded-full bg-red-500" />
            <h3 className="font-semibold text-gray-800 uppercase text-xs tracking-wider">Expenses</h3>
          </div>
          {Object.entries(data.expenses as Record<string, number>).length === 0
            ? <div className="text-sm text-gray-400 pl-5 italic">No expenses recorded in this period</div>
            : Object.entries(data.expenses as Record<string, number>).map(([name, value]) => (
              <div key={name} className="flex justify-between items-center py-2 border-b border-gray-50 last:border-0 hover:bg-gray-50 px-2 rounded">
                <span className="text-sm text-gray-700 pl-4">{name}</span>
                <span className="text-sm font-medium text-red-600">{fmt(value as number)} JOD</span>
              </div>
            ))}
          <div className="flex justify-between py-2 px-2 bg-red-50 rounded-lg mt-2 font-semibold text-sm">
            <span className="text-red-800">Total Expenses</span>
            <span className="text-red-800">{fmt(data.totalExpenses)} JOD</span>
          </div>
        </div>

        {/* Net */}
        <div className={`flex justify-between py-3 px-4 rounded-xl font-bold text-lg ${data.netProfit >= 0 ? "bg-green-50 border border-green-200 text-green-800" : "bg-red-50 border border-red-200 text-red-800"}`}>
          <span>Net {data.netProfit >= 0 ? "Profit" : "Loss"}</span>
          <span>{fmt(Math.abs(data.netProfit))} JOD</span>
        </div>
      </div>

      {/* Chart */}
      {chartData.length > 0 && (
        <div className="bg-white rounded-xl border border-gray-200 p-5 print:hidden">
          <h3 className="font-semibold text-gray-700 mb-4 text-sm">Income vs Expenses Breakdown</h3>
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={chartData} layout="vertical" margin={{ left: 20, right: 40 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis type="number" tick={{ fontSize: 11 }} tickFormatter={v => `${v}`} />
              <YAxis type="category" dataKey="name" tick={{ fontSize: 11 }} width={160} />
              <Tooltip formatter={(v: any) => `${Number(v).toFixed(2)} JOD`} />
              <Bar dataKey="value" radius={[0, 4, 4, 0]}>
                {chartData.map((entry, i) => (
                  <rect key={i} fill={entry.fill} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}

/* ── Balance Sheet ───────────────────────────────────────────────── */
function BalanceReport({ data, businessName, fmt }: any) {
  const totalAssets = data.assets?.total || 0;
  const totalLiabilities = data.liabilities?.total || 0;
  const totalEquity = data.equity?.total || 0;

  return (
    <div className="space-y-4">
      <ReportHeader title="Balance Sheet" subtitle={`As of ${fmtDate(new Date().toISOString().split("T")[0])}`} businessName={businessName} />

      <div className="grid grid-cols-3 gap-4">
        <SummaryBox label="Total Assets" value={`${fmt(totalAssets)} JOD`} color="green" />
        <SummaryBox label="Total Liabilities" value={`${fmt(totalLiabilities)} JOD`} color="red" />
        <SummaryBox label="Net Worth (Equity)" value={`${fmt(totalEquity)} JOD`} color="purple" />
      </div>

      <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 text-sm text-blue-800">
        <strong>The accounting equation:</strong> Assets ({fmt(totalAssets)} JOD) = Liabilities ({fmt(totalLiabilities)} JOD) + Equity ({fmt(totalEquity)} JOD)
        <br />
        <span className="text-xs opacity-80">This must always balance — it&apos;s the foundation of double-entry bookkeeping.</span>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <div className="grid md:grid-cols-2 gap-8">
          {/* Assets */}
          <div>
            <h3 className="font-bold text-green-700 uppercase text-xs tracking-wider mb-3 flex items-center gap-2">
              <div className="w-2.5 h-2.5 rounded-full bg-green-500" /> Assets — What You Own
            </h3>
            {data.assets?.accounts?.map((a: any) => (
              <div key={a.id} className="flex justify-between py-1.5 text-sm border-b border-gray-50">
                <span className="text-gray-600 pl-3">{a.name}</span>
                <span>{fmt(a.balance)}</span>
              </div>
            ))}
            {(data.assets?.outstandingReceivables || 0) > 0 && (
              <div className="flex justify-between py-1.5 text-sm border-b border-gray-50">
                <span className="text-gray-600 pl-3">Accounts Receivable (outstanding)</span>
                <span>{fmt(data.assets.outstandingReceivables)}</span>
              </div>
            )}
            {(data.assets?.fixedAssets?.total || 0) > 0 && (
              <div className="flex justify-between py-1.5 text-sm border-b border-gray-50">
                <span className="text-gray-600 pl-3">Fixed Assets (net book value)</span>
                <span>{fmt(data.assets.fixedAssets.total)}</span>
              </div>
            )}
            <div className="flex justify-between py-2 px-2 bg-green-50 rounded-lg mt-2 font-semibold text-sm">
              <span className="text-green-800">Total Assets</span>
              <span className="text-green-800">{fmt(totalAssets)} JOD</span>
            </div>
          </div>

          {/* Liabilities + Equity */}
          <div>
            <h3 className="font-bold text-red-700 uppercase text-xs tracking-wider mb-3 flex items-center gap-2">
              <div className="w-2.5 h-2.5 rounded-full bg-red-500" /> Liabilities — What You Owe
            </h3>
            {data.liabilities?.accounts?.map((a: any) => (
              <div key={a.id} className="flex justify-between py-1.5 text-sm border-b border-gray-50">
                <span className="text-gray-600 pl-3">{a.name}</span>
                <span>{fmt(a.balance)}</span>
              </div>
            ))}
            {data.liabilities?.loans?.map((l: any, i: number) => (
              <div key={i} className="flex justify-between py-1.5 text-sm border-b border-gray-50">
                <span className="text-gray-600 pl-3">Loan — {l.name}</span>
                <span>{fmt(l.balance)}</span>
              </div>
            ))}
            {(data.liabilities?.outstandingPayables || 0) > 0 && (
              <div className="flex justify-between py-1.5 text-sm border-b border-gray-50">
                <span className="text-gray-600 pl-3">Accounts Payable (outstanding)</span>
                <span>{fmt(data.liabilities.outstandingPayables)}</span>
              </div>
            )}
            <div className="flex justify-between py-2 px-2 bg-red-50 rounded-lg mt-2 font-semibold text-sm">
              <span className="text-red-800">Total Liabilities</span>
              <span className="text-red-800">{fmt(totalLiabilities)} JOD</span>
            </div>

            <h3 className="font-bold text-purple-700 uppercase text-xs tracking-wider mb-3 mt-6 flex items-center gap-2">
              <div className="w-2.5 h-2.5 rounded-full bg-purple-500" /> Equity — Net Worth
            </h3>
            {data.equity?.accounts?.map((a: any) => (
              <div key={a.id} className="flex justify-between py-1.5 text-sm border-b border-gray-50">
                <span className="text-gray-600 pl-3">{a.name}</span>
                <span>{fmt(a.balance)}</span>
              </div>
            ))}
            <div className="flex justify-between py-2 px-2 bg-purple-50 rounded-lg mt-2 font-semibold text-sm">
              <span className="text-purple-800">Total Equity</span>
              <span className="text-purple-800">{fmt(totalEquity)} JOD</span>
            </div>
          </div>
        </div>

        {/* Ratios */}
        <div className="mt-6 p-4 bg-gray-50 rounded-xl grid md:grid-cols-2 gap-4 text-sm">
          <div>
            <div className="font-semibold text-gray-700">Current Ratio: {data.currentRatio}</div>
            <div className="text-xs text-gray-500 mt-1">
              {parseFloat(data.currentRatio) >= 2 ? "Excellent — you can easily cover short-term debts."
                : parseFloat(data.currentRatio) >= 1 ? "Healthy — current assets cover current liabilities."
                : "Watch out — short-term debts exceed current assets."}
            </div>
          </div>
          <div>
            <div className="font-semibold text-gray-700">Debt to Equity: {totalEquity > 0 ? (totalLiabilities / totalEquity).toFixed(2) : "N/A"}</div>
            <div className="text-xs text-gray-500 mt-1">How much of the business is funded by debt vs owner's money. Lower is safer.</div>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ── Cash Flow ───────────────────────────────────────────────────── */
function CashFlowReport({ data, start, end, businessName, fmt }: any) {
  return (
    <div className="space-y-4">
      <ReportHeader title="Cash Flow Statement" subtitle={`${fmtDate(start)} — ${fmtDate(end)}`} businessName={businessName} />
      <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-4">
        <div className="grid grid-cols-3 gap-4">
          <SummaryBox label="Cash Inflows" value={`${fmt(data.totalInflows || 0)} JOD`} color="green" />
          <SummaryBox label="Cash Outflows" value={`${fmt(data.totalOutflows || 0)} JOD`} color="red" />
          <SummaryBox label="Net Cash Change" value={`${fmt((data.totalInflows || 0) - (data.totalOutflows || 0))} JOD`} color={(data.totalInflows || 0) >= (data.totalOutflows || 0) ? "green" : "red"} large />
        </div>

        {data.byMonth && data.byMonth.length > 0 && (
          <div className="print:hidden">
            <h3 className="font-semibold text-gray-700 text-sm mb-3">Monthly Cash Flow</h3>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={data.byMonth} barSize={20}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} tickFormatter={v => `${v}`} />
                <Tooltip formatter={(v: any) => `${Number(v).toFixed(2)} JOD`} />
                <Legend />
                <Bar dataKey="inflows" name="Inflows" fill="#10b981" radius={[3, 3, 0, 0]} />
                <Bar dataKey="outflows" name="Outflows" fill="#ef4444" radius={[3, 3, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}

        {data.transactions && (
          <div>
            <h3 className="font-semibold text-gray-700 text-sm mb-2">Transactions</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead><tr className="bg-gray-50 text-gray-500">
                  <th className="px-3 py-2 text-left">Date</th>
                  <th className="px-3 py-2 text-left">Description</th>
                  <th className="px-3 py-2 text-right">Inflow</th>
                  <th className="px-3 py-2 text-right">Outflow</th>
                </tr></thead>
                <tbody className="divide-y divide-gray-50">
                  {data.transactions.map((t: any, i: number) => (
                    <tr key={i} className="hover:bg-gray-50">
                      <td className="px-3 py-2">{fmtDate(t.date)}</td>
                      <td className="px-3 py-2">{t.description}</td>
                      <td className="px-3 py-2 text-right text-green-700">{t.inflow > 0 ? fmt(t.inflow) : "—"}</td>
                      <td className="px-3 py-2 text-right text-red-600">{t.outflow > 0 ? fmt(t.outflow) : "—"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

/* ── VAT Report ──────────────────────────────────────────────────── */
function VATReport({ data, businessName, fmt }: any) {
  return (
    <div className="space-y-4">
      <ReportHeader title="VAT Report" subtitle="Current Quarter · Jordan VAT 16%" businessName={businessName} />
      <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-6">
        <div className="grid grid-cols-3 gap-4">
          <SummaryBox label="Output VAT (Collected)" value={`${fmt(data.vatOnSales || 0)} JOD`} color="green" />
          <SummaryBox label="Input VAT (Paid)" value={`${fmt(data.vatOnPurchases || 0)} JOD`} color="blue" />
          <SummaryBox label="Net VAT Due" value={`${fmt(data.netVAT || 0)} JOD`} color={(data.netVAT || 0) > 0 ? "red" : "green"} large />
        </div>
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 text-sm text-amber-800">
          <strong>How to read this:</strong> You collected {fmt(data.vatOnSales || 0)} JOD in VAT from customers. You paid {fmt(data.vatOnPurchases || 0)} JOD in VAT to suppliers. You owe the government the difference: <strong>{fmt(data.netVAT || 0)} JOD</strong>.
        </div>

        {data.invoices?.length > 0 && (
          <div>
            <h3 className="font-semibold text-gray-700 text-sm mb-2">Sales Invoices with VAT</h3>
            <table className="w-full text-xs">
              <thead><tr className="bg-gray-50 text-gray-500">
                <th className="px-3 py-2 text-left">Invoice</th><th className="px-3 py-2 text-left">Customer</th>
                <th className="px-3 py-2 text-right">Net</th><th className="px-3 py-2 text-right">VAT</th><th className="px-3 py-2 text-right">Total</th>
              </tr></thead>
              <tbody className="divide-y divide-gray-50">
                {data.invoices.map((inv: any) => (
                  <tr key={inv.number}>
                    <td className="px-3 py-2 font-medium text-blue-600">{inv.number}</td>
                    <td className="px-3 py-2">{inv.customerName}</td>
                    <td className="px-3 py-2 text-right">{fmt(inv.subtotal)}</td>
                    <td className="px-3 py-2 text-right text-green-700">{fmt(inv.vatAmount)}</td>
                    <td className="px-3 py-2 text-right font-medium">{fmt(inv.total)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

/* ── Payroll Report ──────────────────────────────────────────────── */
function PayrollReport({ data, businessName, fmt }: any) {
  return (
    <div className="space-y-4">
      <ReportHeader title="Payroll Summary" subtitle="All Employees" businessName={businessName} />
      <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-4">
        <div className="grid grid-cols-3 gap-4">
          <SummaryBox label="Total Employees" value={String(data.employees?.length || 0)} color="blue" />
          <SummaryBox label="Monthly Payroll" value={`${fmt(data.totalMonthly || 0)} JOD`} color="green" />
          <SummaryBox label="Annual Cost (est.)" value={`${fmt((data.totalMonthly || 0) * 12)} JOD`} color="purple" />
        </div>
        {data.employees?.length > 0 && (
          <table className="w-full text-sm">
            <thead><tr className="bg-gray-50 text-gray-500 text-xs">
              <th className="px-4 py-2 text-left">Employee</th>
              <th className="px-4 py-2 text-left">Title</th>
              <th className="px-4 py-2 text-right">Gross Salary</th>
              <th className="px-4 py-2 text-right">SS (6.5%)</th>
              <th className="px-4 py-2 text-right">Net (est.)</th>
              <th className="px-4 py-2 text-left">Start Date</th>
            </tr></thead>
            <tbody className="divide-y divide-gray-100">
              {data.employees.map((e: any) => {
                const ss = e.monthlySalary * 0.065;
                const net = e.monthlySalary - ss;
                return (
                  <tr key={e.id} className="hover:bg-gray-50">
                    <td className="px-4 py-2.5 font-medium">{e.name}</td>
                    <td className="px-4 py-2.5 text-gray-500">{e.jobTitle || "—"}</td>
                    <td className="px-4 py-2.5 text-right">{fmt(e.monthlySalary)} JOD</td>
                    <td className="px-4 py-2.5 text-right text-red-600">{fmt(ss)} JOD</td>
                    <td className="px-4 py-2.5 text-right font-medium text-green-700">{fmt(net)} JOD</td>
                    <td className="px-4 py-2.5 text-gray-500">{fmtDate(e.startDate)}</td>
                  </tr>
                );
              })}
            </tbody>
            <tfoot>
              <tr className="bg-gray-50 font-semibold text-sm">
                <td colSpan={2} className="px-4 py-2">Total</td>
                <td className="px-4 py-2 text-right">{fmt(data.totalMonthly || 0)} JOD</td>
                <td className="px-4 py-2 text-right text-red-600">{fmt((data.totalMonthly || 0) * 0.065)} JOD</td>
                <td className="px-4 py-2 text-right text-green-700">{fmt((data.totalMonthly || 0) * 0.935)} JOD</td>
                <td></td>
              </tr>
            </tfoot>
          </table>
        )}
      </div>
    </div>
  );
}

/* ── Invoice Aging ───────────────────────────────────────────────── */
function InvoiceAgingReport({ data, businessName, fmt }: any) {
  const bucketColors: Record<string, string> = {
    "Current": "text-green-700 bg-green-50",
    "1-30 days": "text-amber-700 bg-amber-50",
    "31-60 days": "text-orange-700 bg-orange-50",
    "61-90 days": "text-red-600 bg-red-50",
    "90+ days": "text-red-800 bg-red-100",
  };

  return (
    <div className="space-y-4">
      <ReportHeader title="Invoice Aging Report" subtitle="Outstanding Receivables" businessName={businessName} />
      <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-4">
        {/* Bucket summary */}
        <div className="grid grid-cols-5 gap-2">
          {data.buckets && Object.entries(data.buckets as Record<string, number>).map(([bucket, total]) => (
            <div key={bucket} className={`rounded-lg p-3 text-center ${bucketColors[bucket] || "bg-gray-50 text-gray-700"}`}>
              <div className="text-xs font-semibold">{bucket}</div>
              <div className="text-sm font-bold mt-1">{fmt(total)} JOD</div>
            </div>
          ))}
        </div>

        <div className="text-sm font-semibold text-gray-700">
          Total Outstanding: <span className="text-red-700">{fmt(data.total || 0)} JOD</span>
        </div>

        {data.items?.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead><tr className="bg-gray-50 text-gray-500 text-xs">
                <th className="px-3 py-2 text-left">Customer</th>
                <th className="px-3 py-2 text-left">Invoice #</th>
                <th className="px-3 py-2 text-left">Date</th>
                <th className="px-3 py-2 text-left">Due Date</th>
                <th className="px-3 py-2 text-right">Outstanding</th>
                <th className="px-3 py-2 text-center">Age</th>
              </tr></thead>
              <tbody className="divide-y divide-gray-100">
                {data.items.map((inv: any) => (
                  <tr key={inv.id} className="hover:bg-gray-50">
                    <td className="px-3 py-2.5 font-medium">{inv.customerName}</td>
                    <td className="px-3 py-2.5 text-blue-600">{inv.number}</td>
                    <td className="px-3 py-2.5 text-gray-500">{fmtDate(inv.date)}</td>
                    <td className="px-3 py-2.5 text-gray-500">{fmtDate(inv.dueDate)}</td>
                    <td className="px-3 py-2.5 text-right font-semibold text-red-700">{fmt(inv.outstanding)} JOD</td>
                    <td className="px-3 py-2.5 text-center">
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${bucketColors[inv.bucket] || "bg-gray-100 text-gray-600"}`}>
                        {inv.bucket}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="text-center py-8 text-gray-400 text-sm">No outstanding invoices — great job!</div>
        )}
      </div>
    </div>
  );
}

/* ── Asset Register ──────────────────────────────────────────────── */
function AssetsReport({ data, businessName, fmt }: any) {
  const totalCost = data.reduce((s: number, a: any) => s + a.purchasePrice, 0);
  const totalBook = data.reduce((s: number, a: any) => {
    const years = (Date.now() - new Date(a.purchaseDate).getTime()) / (1000 * 60 * 60 * 24 * 365);
    const dep = Math.min(years * (a.purchasePrice - a.residualValue) / a.usefulLifeYears, a.purchasePrice - a.residualValue);
    return s + (a.purchasePrice - dep);
  }, 0);

  return (
    <div className="space-y-4">
      <ReportHeader title="Fixed Asset Register" subtitle={`As of ${fmtDate(new Date().toISOString().split("T")[0])}`} businessName={businessName} />
      <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-4">
        <div className="grid grid-cols-3 gap-4">
          <SummaryBox label="Total at Cost" value={`${fmt(totalCost)} JOD`} color="blue" />
          <SummaryBox label="Total Depreciation" value={`${fmt(totalCost - totalBook)} JOD`} color="amber" />
          <SummaryBox label="Net Book Value" value={`${fmt(totalBook)} JOD`} color="green" large />
        </div>
        {data.length > 0 ? (
          <table className="w-full text-sm">
            <thead><tr className="bg-gray-50 text-gray-500 text-xs">
              <th className="px-3 py-2 text-left">Asset</th>
              <th className="px-3 py-2 text-left">Category</th>
              <th className="px-3 py-2 text-left">Purchased</th>
              <th className="px-3 py-2 text-right">Cost</th>
              <th className="px-3 py-2 text-right">Depreciated</th>
              <th className="px-3 py-2 text-right">Book Value</th>
              <th className="px-3 py-2 text-right">Ann. Dep.</th>
            </tr></thead>
            <tbody className="divide-y divide-gray-100">
              {data.map((a: any) => {
                const years = (Date.now() - new Date(a.purchaseDate).getTime()) / (1000 * 60 * 60 * 24 * 365);
                const annDep = (a.purchasePrice - a.residualValue) / a.usefulLifeYears;
                const dep = Math.min(years * annDep, a.purchasePrice - a.residualValue);
                const book = a.purchasePrice - dep;
                return (
                  <tr key={a.id} className="hover:bg-gray-50">
                    <td className="px-3 py-2.5 font-medium">{a.name}</td>
                    <td className="px-3 py-2.5 text-gray-500">{a.category}</td>
                    <td className="px-3 py-2.5 text-gray-500">{fmtDate(a.purchaseDate)}</td>
                    <td className="px-3 py-2.5 text-right">{fmt(a.purchasePrice)}</td>
                    <td className="px-3 py-2.5 text-right text-orange-600">{fmt(dep)}</td>
                    <td className="px-3 py-2.5 text-right font-semibold text-green-700">{fmt(book)}</td>
                    <td className="px-3 py-2.5 text-right text-gray-500">{fmt(annDep)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        ) : (
          <div className="text-center py-8 text-gray-400 text-sm">No fixed assets recorded yet.</div>
        )}
      </div>
    </div>
  );
}

/* ── Shared UI ───────────────────────────────────────────────────── */
function ReportHeader({ title, subtitle, businessName }: { title: string; subtitle: string; businessName?: string }) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5 flex items-center justify-between">
      <div>
        <h2 className="text-xl font-bold text-gray-900">{title}</h2>
        <p className="text-sm text-gray-500 mt-0.5">{subtitle}</p>
      </div>
      {businessName && (
        <div className="text-right">
          <div className="font-semibold text-gray-700">{businessName}</div>
          <div className="text-xs text-gray-400">Hisab Financial Report</div>
        </div>
      )}
    </div>
  );
}

function SummaryBox({ label, value, color, large }: { label: string; value: string; color: string; large?: boolean }) {
  const styles: Record<string, string> = {
    green: "bg-green-50 border-green-200 text-green-800",
    red: "bg-red-50 border-red-200 text-red-800",
    blue: "bg-blue-50 border-blue-200 text-blue-800",
    purple: "bg-purple-50 border-purple-200 text-purple-800",
    amber: "bg-amber-50 border-amber-200 text-amber-800",
  };
  return (
    <div className={`rounded-xl border p-4 ${styles[color] || styles.blue}`}>
      <div className="text-xs font-medium opacity-70 mb-1">{label}</div>
      <div className={`font-bold ${large ? "text-xl" : "text-lg"}`}>{value}</div>
    </div>
  );
}

function fmtDate(d: string) {
  try {
    return new Date(d).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
  } catch {
    return d;
  }
}
