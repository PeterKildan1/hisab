"use client";
import { useEffect, useState } from "react";
import { BarChart3, Download } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

type PNL = {
  period: { start: string; end: string };
  income: Record<string, number>;
  expenses: Record<string, number>;
  totalIncome: number;
  totalExpenses: number;
  netProfit: number;
};

type BalanceSheet = {
  assets: { accounts: Array<{ id: string; name: string; balance: number; subType: string | null; liquidity: string | null }>; fixedAssets: { total: number }; outstandingReceivables: number; total: number };
  liabilities: { accounts: Array<{ id: string; name: string; balance: number }>; loans: Array<{ name: string; balance: number; liquidity: string }>; outstandingPayables: number; total: number };
  equity: { accounts: Array<{ id: string; name: string; balance: number }>; retainedEarnings: number; total: number };
  currentRatio: string;
};

const today = new Date().toISOString().split("T")[0];
const yearStart = `${new Date().getFullYear()}-01-01`;

export default function ReportsPage() {
  const [report, setReport] = useState<"pnl" | "balance">("pnl");
  const [pnl, setPnl] = useState<PNL | null>(null);
  const [balance, setBalance] = useState<BalanceSheet | null>(null);
  const [start, setStart] = useState(yearStart);
  const [end, setEnd] = useState(today);
  const [loading, setLoading] = useState(false);

  const loadPNL = async () => {
    setLoading(true);
    const res = await fetch(`/api/reports/pnl?start=${start}&end=${end}`);
    setPnl(await res.json());
    setLoading(false);
  };

  const loadBalance = async () => {
    setLoading(true);
    const res = await fetch("/api/reports/balance-sheet");
    setBalance(await res.json());
    setLoading(false);
  };

  useEffect(() => {
    if (report === "pnl") loadPNL();
    else loadBalance();
  }, [report, start, end]);

  const printReport = () => window.print();

  const chartData = pnl ? [
    ...Object.entries(pnl.income).map(([name, value]) => ({ name: name.length > 20 ? name.slice(0, 20) + "…" : name, value, type: "Income" })),
    ...Object.entries(pnl.expenses).map(([name, value]) => ({ name: name.length > 20 ? name.slice(0, 20) + "…" : name, value, type: "Expense" })),
  ] : [];

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6 print:p-0">
      <div className="flex items-start justify-between print:hidden">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2"><BarChart3 className="w-6 h-6 text-blue-600" /> Financial Reports</h1>
          <p className="text-sm text-gray-500 mt-1">Professional financial statements for your business.</p>
        </div>
        <button onClick={printReport} className="flex items-center gap-2 border border-gray-300 text-gray-700 px-4 py-2 rounded-lg text-sm hover:bg-gray-50">
          <Download className="w-4 h-4" /> Print / PDF
        </button>
      </div>

      {/* Report selector */}
      <div className="flex gap-2 print:hidden">
        {[
          { id: "pnl", label: "Profit & Loss" },
          { id: "balance", label: "Balance Sheet" },
        ].map(r => (
          <button key={r.id} onClick={() => setReport(r.id as "pnl" | "balance")}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${report === r.id ? "bg-blue-600 text-white" : "bg-white border border-gray-300 text-gray-700 hover:bg-gray-50"}`}>
            {r.label}
          </button>
        ))}
      </div>

      {/* Date range for P&L */}
      {report === "pnl" && (
        <div className="flex items-center gap-3 print:hidden">
          <input type="date" value={start} onChange={e => setStart(e.target.value)}
            className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
          <span className="text-gray-400">to</span>
          <input type="date" value={end} onChange={e => setEnd(e.target.value)}
            className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
        </div>
      )}

      {loading ? (
        <div className="flex justify-center py-12"><div className="animate-spin w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full" /></div>
      ) : report === "pnl" && pnl ? (
        <div className="space-y-6">
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <div className="text-center mb-6">
              <h2 className="text-xl font-bold text-gray-900">Profit & Loss Statement</h2>
              <p className="text-sm text-gray-500">{new Date(pnl.period.start).toLocaleDateString("en-GB", { day: "2-digit", month: "long", year: "numeric" })} — {new Date(pnl.period.end).toLocaleDateString("en-GB", { day: "2-digit", month: "long", year: "numeric" })}</p>
            </div>

            {/* Income */}
            <div className="mb-6">
              <h3 className="font-semibold text-green-700 mb-2 border-b border-green-100 pb-1">INCOME</h3>
              {Object.entries(pnl.income).map(([name, value]) => (
                <div key={name} className="flex justify-between py-1.5 text-sm">
                  <span className="text-gray-700 pl-4">{name}</span>
                  <span className="text-green-700 font-medium">{value.toLocaleString("en", { minimumFractionDigits: 2 })} JOD</span>
                </div>
              ))}
              <div className="flex justify-between py-2 border-t border-gray-200 font-semibold mt-1">
                <span>Total Income</span>
                <span className="text-green-700">{pnl.totalIncome.toLocaleString("en", { minimumFractionDigits: 2 })} JOD</span>
              </div>
            </div>

            {/* Expenses */}
            <div className="mb-6">
              <h3 className="font-semibold text-red-700 mb-2 border-b border-red-100 pb-1">EXPENSES</h3>
              {Object.entries(pnl.expenses).map(([name, value]) => (
                <div key={name} className="flex justify-between py-1.5 text-sm">
                  <span className="text-gray-700 pl-4">{name}</span>
                  <span className="text-red-600 font-medium">{value.toLocaleString("en", { minimumFractionDigits: 2 })} JOD</span>
                </div>
              ))}
              <div className="flex justify-between py-2 border-t border-gray-200 font-semibold mt-1">
                <span>Total Expenses</span>
                <span className="text-red-700">{pnl.totalExpenses.toLocaleString("en", { minimumFractionDigits: 2 })} JOD</span>
              </div>
            </div>

            {/* Net Profit */}
            <div className={`flex justify-between py-3 px-4 rounded-xl font-bold text-lg ${pnl.netProfit >= 0 ? "bg-green-50 text-green-800" : "bg-red-50 text-red-800"}`}>
              <span>Net {pnl.netProfit >= 0 ? "Profit" : "Loss"}</span>
              <span>{Math.abs(pnl.netProfit).toLocaleString("en", { minimumFractionDigits: 2 })} JOD</span>
            </div>
          </div>

          {/* Chart */}
          {chartData.length > 0 && (
            <div className="bg-white rounded-xl border border-gray-200 p-5 print:hidden">
              <h3 className="font-semibold text-gray-800 mb-4">Income vs Expenses Breakdown</h3>
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={chartData} layout="vertical" margin={{ left: 100 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis type="number" tick={{ fontSize: 11 }} tickFormatter={v => `${v.toFixed(0)}`} />
                  <YAxis type="category" dataKey="name" tick={{ fontSize: 11 }} width={100} />
                  <Tooltip formatter={(v: number) => `${v.toFixed(2)} JOD`} />
                  <Bar dataKey="value" fill="#3b82f6" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>
      ) : report === "balance" && balance ? (
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <div className="text-center mb-6">
            <h2 className="text-xl font-bold text-gray-900">Balance Sheet</h2>
            <p className="text-sm text-gray-500">As of {new Date().toLocaleDateString("en-GB", { day: "2-digit", month: "long", year: "numeric" })}</p>
          </div>

          <div className="grid md:grid-cols-2 gap-8">
            {/* Assets */}
            <div>
              <h3 className="font-semibold text-green-700 mb-3 border-b border-green-100 pb-1">ASSETS</h3>
              <div className="space-y-1 text-sm">
                {balance.assets.accounts.map(a => (
                  <div key={a.id} className="flex justify-between py-1">
                    <span className="text-gray-600 pl-4">{a.name}{a.liquidity ? ` (${a.liquidity.replace("Term", " Term")})` : ""}</span>
                    <span>{a.balance.toLocaleString("en", { minimumFractionDigits: 2 })}</span>
                  </div>
                ))}
                {balance.assets.outstandingReceivables > 0 && (
                  <div className="flex justify-between py-1">
                    <span className="text-gray-600 pl-4">Accounts Receivable</span>
                    <span>{balance.assets.outstandingReceivables.toLocaleString("en", { minimumFractionDigits: 2 })}</span>
                  </div>
                )}
                <div className="flex justify-between py-1">
                  <span className="text-gray-600 pl-4">Fixed Assets (Net)</span>
                  <span>{balance.assets.fixedAssets.total.toLocaleString("en", { minimumFractionDigits: 2 })}</span>
                </div>
                <div className="flex justify-between py-2 border-t font-bold">
                  <span>Total Assets</span>
                  <span className="text-green-700">{balance.assets.total.toLocaleString("en", { minimumFractionDigits: 2 })} JOD</span>
                </div>
              </div>
            </div>

            {/* Liabilities + Equity */}
            <div>
              <h3 className="font-semibold text-red-700 mb-3 border-b border-red-100 pb-1">LIABILITIES</h3>
              <div className="space-y-1 text-sm mb-4">
                {balance.liabilities.accounts.map(a => (
                  <div key={a.id} className="flex justify-between py-1">
                    <span className="text-gray-600 pl-4">{a.name}</span>
                    <span>{a.balance.toLocaleString("en", { minimumFractionDigits: 2 })}</span>
                  </div>
                ))}
                {balance.liabilities.loans.map((l, i) => (
                  <div key={i} className="flex justify-between py-1">
                    <span className="text-gray-600 pl-4">Loan — {l.name} ({l.liquidity.replace("Term", " Term")})</span>
                    <span>{l.balance.toLocaleString("en", { minimumFractionDigits: 2 })}</span>
                  </div>
                ))}
                {balance.liabilities.outstandingPayables > 0 && (
                  <div className="flex justify-between py-1">
                    <span className="text-gray-600 pl-4">Accounts Payable</span>
                    <span>{balance.liabilities.outstandingPayables.toLocaleString("en", { minimumFractionDigits: 2 })}</span>
                  </div>
                )}
                <div className="flex justify-between py-2 border-t font-bold">
                  <span>Total Liabilities</span>
                  <span className="text-red-700">{balance.liabilities.total.toLocaleString("en", { minimumFractionDigits: 2 })} JOD</span>
                </div>
              </div>

              <h3 className="font-semibold text-purple-700 mb-2 border-b border-purple-100 pb-1">EQUITY</h3>
              <div className="space-y-1 text-sm">
                {balance.equity.accounts.map(a => (
                  <div key={a.id} className="flex justify-between py-1">
                    <span className="text-gray-600 pl-4">{a.name}</span>
                    <span>{a.balance.toLocaleString("en", { minimumFractionDigits: 2 })}</span>
                  </div>
                ))}
                <div className="flex justify-between py-2 border-t font-bold">
                  <span>Total Equity</span>
                  <span className="text-purple-700">{balance.equity.total.toLocaleString("en", { minimumFractionDigits: 2 })} JOD</span>
                </div>
              </div>
            </div>
          </div>

          {/* Ratios */}
          <div className="mt-6 p-4 bg-gray-50 rounded-xl">
            <h3 className="font-semibold text-gray-800 mb-3">Liquidity Ratios</h3>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <div className="font-medium text-gray-700">Current Ratio: {balance.currentRatio}</div>
                <div className="text-xs text-gray-500 mt-1">
                  {parseFloat(balance.currentRatio) >= 1
                    ? "Your current assets cover your short-term debts — healthy position."
                    : "Your short-term debts exceed current assets — watch cash flow carefully."}
                </div>
              </div>
              <div>
                <div className="font-medium text-gray-700">Equation Check</div>
                <div className="text-xs text-gray-500 mt-1">
                  Assets ({balance.assets.total.toFixed(0)} JOD) ≈ Liabilities ({balance.liabilities.total.toFixed(0)} JOD) + Equity ({balance.equity.total.toFixed(0)} JOD)
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
