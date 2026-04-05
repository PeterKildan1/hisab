"use client";
import { useEffect, useState } from "react";
import { Plus, CreditCard, AlertCircle, CheckCircle } from "lucide-react";

type LoanPayment = { id: string; dueDate: string; amount: number; principal: number; interest: number; status: string; paidDate: string | null };
type Loan = { id: string; lenderName: string; amount: number; interestRate: number; startDate: string; termMonths: number; liquidity: string; notes: string | null; payments: LoanPayment[] };

export default function LoansPage() {
  const [loans, setLoans] = useState<Loan[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [form, setForm] = useState({
    lenderName: "", amount: 0, interestRate: 0, termMonths: 12,
    startDate: new Date().toISOString().split("T")[0],
    liquidity: "LongTerm", notes: "",
  });

  const load = () => fetch("/api/loans").then(r => r.json()).then(d => { setLoans(d); setLoading(false); });
  useEffect(() => { load(); }, []);

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    await fetch("/api/loans", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(form) });
    setShowForm(false);
    load();
  };

  const pay = async (loanId: string, paymentId: string) => {
    await fetch(`/api/loans/${loanId}/pay`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ paymentId }) });
    load();
  };

  const getRemainingBalance = (loan: Loan) => {
    const paidPrincipal = loan.payments.filter(p => p.status === "paid").reduce((s, p) => s + p.principal, 0);
    return loan.amount - paidPrincipal;
  };

  const totalDebt = loans.reduce((s, l) => s + getRemainingBalance(l), 0);
  const upcomingPayments = loans.flatMap(l =>
    l.payments.filter(p => p.status === "pending" && new Date(p.dueDate) <= new Date(Date.now() + 30 * 86400000))
  );

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2"><CreditCard className="w-6 h-6 text-blue-600" /> Loans & Financing</h1>
          <p className="text-sm text-gray-500 mt-1">Track all business loans, payment schedules, and remaining balances.</p>
        </div>
        <button onClick={() => setShowForm(true)} className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700">
          <Plus className="w-4 h-4" /> Add Loan
        </button>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div className="bg-white border border-gray-200 rounded-xl p-4">
          <div className="text-xs text-gray-500 mb-1">Total Debt Remaining</div>
          <div className="text-xl font-bold text-red-700">{totalDebt.toFixed(2)} JOD</div>
        </div>
        <div className="bg-white border border-gray-200 rounded-xl p-4">
          <div className="text-xs text-gray-500 mb-1">Active Loans</div>
          <div className="text-xl font-bold text-gray-800">{loans.length}</div>
        </div>
        <div className={`border rounded-xl p-4 ${upcomingPayments.length > 0 ? "bg-amber-50 border-amber-200" : "bg-white border-gray-200"}`}>
          <div className="text-xs text-gray-500 mb-1">Due in 30 Days</div>
          <div className={`text-xl font-bold ${upcomingPayments.length > 0 ? "text-amber-700" : "text-gray-800"}`}>
            {upcomingPayments.reduce((s, p) => s + p.amount, 0).toFixed(2)} JOD
          </div>
        </div>
      </div>

      {showForm && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-2xl">
            <h2 className="font-semibold text-lg mb-4">Add Loan</h2>
            <form onSubmit={save} className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Lender Name</label>
                <input value={form.lenderName} onChange={e => setForm({...form, lenderName: e.target.value})}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" required />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Loan Amount (JOD)</label>
                  <input type="number" step="0.01" min="0" value={form.amount} onChange={e => setForm({...form, amount: parseFloat(e.target.value) || 0})}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" required />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Annual Interest Rate (%)</label>
                  <input type="number" step="0.01" min="0" value={form.interestRate} onChange={e => setForm({...form, interestRate: parseFloat(e.target.value) || 0})}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" required />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Term (months)</label>
                  <input type="number" min="1" value={form.termMonths} onChange={e => setForm({...form, termMonths: parseInt(e.target.value) || 12})}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" required />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Start Date</label>
                  <input type="date" value={form.startDate} onChange={e => setForm({...form, startDate: e.target.value})}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" required />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Classification</label>
                <select value={form.liquidity} onChange={e => setForm({...form, liquidity: e.target.value})}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                  <option value="ShortTerm">Short Term (under 12 months)</option>
                  <option value="MidTerm">Mid Term (1–3 years)</option>
                  <option value="LongTerm">Long Term (3+ years)</option>
                </select>
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowForm(false)} className="flex-1 border border-gray-300 rounded-lg py-2 text-sm">Cancel</button>
                <button type="submit" className="flex-1 bg-blue-600 text-white rounded-lg py-2 text-sm font-medium hover:bg-blue-700">Add Loan</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {loading ? (
        <div className="flex justify-center py-12"><div className="animate-spin w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full" /></div>
      ) : loans.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-200 text-center py-12 text-gray-400">
          <CreditCard className="w-12 h-12 mx-auto mb-3 opacity-30" /><p>No loans recorded</p>
        </div>
      ) : (
        <div className="space-y-4">
          {loans.map(loan => {
            const remaining = getRemainingBalance(loan);
            const paidPayments = loan.payments.filter(p => p.status === "paid").length;
            const progress = (paidPayments / loan.payments.length) * 100;
            const nextPayment = loan.payments.find(p => p.status === "pending");
            const isExpanded = expanded === loan.id;

            return (
              <div key={loan.id} className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                <div className="p-5 cursor-pointer" onClick={() => setExpanded(isExpanded ? null : loan.id)}>
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="font-semibold text-gray-800">{loan.lenderName}</div>
                      <div className="text-sm text-gray-500">{loan.amount.toFixed(2)} JOD original · {loan.interestRate}% p.a. · {loan.termMonths} months</div>
                      <div className="text-xs text-gray-400 mt-1">
                        <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${loan.liquidity === "ShortTerm" ? "bg-blue-100 text-blue-700" : loan.liquidity === "MidTerm" ? "bg-purple-100 text-purple-700" : "bg-gray-100 text-gray-700"}`}>
                          {loan.liquidity.replace("Term", " Term")}
                        </span>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-lg font-bold text-red-700">{remaining.toFixed(2)} JOD</div>
                      <div className="text-xs text-gray-400">remaining</div>
                    </div>
                  </div>

                  <div className="mt-3">
                    <div className="flex justify-between text-xs text-gray-500 mb-1">
                      <span>{paidPayments} of {loan.payments.length} payments</span>
                      <span>{progress.toFixed(0)}%</span>
                    </div>
                    <div className="w-full bg-gray-100 rounded-full h-1.5">
                      <div className="bg-green-500 h-1.5 rounded-full" style={{ width: `${progress}%` }} />
                    </div>
                  </div>

                  {nextPayment && (
                    <div className={`mt-3 flex items-center justify-between text-sm p-2 rounded-lg ${new Date(nextPayment.dueDate) < new Date() ? "bg-red-50 text-red-700" : "bg-amber-50 text-amber-700"}`}>
                      <div className="flex items-center gap-1.5">
                        <AlertCircle className="w-3.5 h-3.5" />
                        Next payment due {new Date(nextPayment.dueDate).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" })}
                      </div>
                      <div className="font-semibold">{nextPayment.amount.toFixed(2)} JOD</div>
                    </div>
                  )}
                </div>

                {isExpanded && (
                  <div className="border-t border-gray-100 overflow-x-auto">
                    <table className="w-full text-xs">
                      <thead><tr className="bg-gray-50 text-gray-500">
                        <th className="px-4 py-2 text-left">#</th><th className="px-4 py-2 text-left">Due Date</th>
                        <th className="px-4 py-2 text-right">Payment</th><th className="px-4 py-2 text-right">Principal</th>
                        <th className="px-4 py-2 text-right">Interest</th><th className="px-4 py-2">Status</th><th className="px-4 py-2"></th>
                      </tr></thead>
                      <tbody className="divide-y divide-gray-50">
                        {loan.payments.slice(0, 24).map((p, i) => (
                          <tr key={p.id} className="hover:bg-gray-50">
                            <td className="px-4 py-2 text-gray-400">{i + 1}</td>
                            <td className="px-4 py-2">{new Date(p.dueDate).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" })}</td>
                            <td className="px-4 py-2 text-right font-medium">{p.amount.toFixed(2)}</td>
                            <td className="px-4 py-2 text-right text-gray-500">{p.principal.toFixed(2)}</td>
                            <td className="px-4 py-2 text-right text-gray-500">{p.interest.toFixed(2)}</td>
                            <td className="px-4 py-2 text-center">
                              {p.status === "paid"
                                ? <CheckCircle className="w-4 h-4 text-green-500 inline" />
                                : <span className="text-amber-600">Pending</span>}
                            </td>
                            <td className="px-4 py-2">
                              {p.status === "pending" && (
                                <button onClick={() => pay(loan.id, p.id)} className="text-blue-600 hover:underline">Pay</button>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
