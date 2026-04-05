"use client";
import { useEffect, useState } from "react";
import { Plus, Trash2, Edit2, BookOpen } from "lucide-react";

type Account = {
  id: string; name: string; type: string; subType: string | null;
  liquidity: string | null; balance: number; isSystem: boolean;
};

const TYPES = ["Asset", "Liability", "Equity", "Income", "Expense"];
const ASSET_SUBTYPES = ["Cash", "Receivable", "Inventory", "FixedAsset", "Prepaid", "Other"];
const LIABILITY_SUBTYPES = ["Payable", "Loan", "TaxOwed", "SalaryOwed", "Credit", "Other"];
const LIQUIDITY = ["ShortTerm", "MidTerm", "LongTerm"];

const typeColor: Record<string, string> = {
  Asset: "bg-green-100 text-green-700",
  Liability: "bg-red-100 text-red-700",
  Equity: "bg-purple-100 text-purple-700",
  Income: "bg-blue-100 text-blue-700",
  Expense: "bg-orange-100 text-orange-700",
};

export default function AccountsPage() {
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ name: "", type: "Asset", subType: "", liquidity: "ShortTerm", balance: 0 });
  const [saving, setSaving] = useState(false);

  const load = () => fetch("/api/accounts").then(r => r.json()).then(d => { setAccounts(d); setLoading(false); });
  useEffect(() => { load(); }, []);

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    await fetch("/api/accounts", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(form) });
    setSaving(false);
    setShowForm(false);
    setForm({ name: "", type: "Asset", subType: "", liquidity: "ShortTerm", balance: 0 });
    load();
  };

  const del = async (id: string) => {
    if (!confirm("Delete this account?")) return;
    await fetch(`/api/accounts/${id}`, { method: "DELETE" });
    load();
  };

  const grouped = TYPES.map(type => ({
    type,
    accounts: accounts.filter(a => a.type === type),
    total: accounts.filter(a => a.type === type).reduce((s, a) => s + a.balance, 0),
  }));

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2"><BookOpen className="w-6 h-6 text-blue-600" /> Chart of Accounts</h1>
          <p className="text-sm text-gray-500 mt-1">All the financial buckets your business uses. Think of each account as a labeled jar for tracking money.</p>
        </div>
        <button onClick={() => setShowForm(true)} className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700">
          <Plus className="w-4 h-4" /> New Account
        </button>
      </div>

      {showForm && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-2xl">
            <h2 className="font-semibold text-lg mb-4">New Account</h2>
            <form onSubmit={save} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Account Name</label>
                <input value={form.name} onChange={e => setForm({...form, name: e.target.value})}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="e.g. Main Bank Account" required />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Account Type</label>
                <select value={form.type} onChange={e => setForm({...form, type: e.target.value, subType: ""})}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500">
                  {TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>
              {(form.type === "Asset" || form.type === "Liability") && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Sub-type</label>
                  <select value={form.subType} onChange={e => setForm({...form, subType: e.target.value})}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500">
                    <option value="">— Select —</option>
                    {(form.type === "Asset" ? ASSET_SUBTYPES : LIABILITY_SUBTYPES).map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
              )}
              {(form.type === "Asset" || form.type === "Liability") && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Liquidity</label>
                  <select value={form.liquidity} onChange={e => setForm({...form, liquidity: e.target.value})}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500">
                    <option value="ShortTerm">Short Term (under 12 months)</option>
                    <option value="MidTerm">Mid Term (1–3 years)</option>
                    <option value="LongTerm">Long Term (3+ years)</option>
                  </select>
                </div>
              )}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Opening Balance (JOD)</label>
                <input type="number" step="0.01" value={form.balance} onChange={e => setForm({...form, balance: parseFloat(e.target.value) || 0})}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowForm(false)} className="flex-1 border border-gray-300 rounded-lg py-2 text-sm text-gray-600 hover:bg-gray-50">Cancel</button>
                <button type="submit" disabled={saving} className="flex-1 bg-blue-600 text-white rounded-lg py-2 text-sm font-medium hover:bg-blue-700 disabled:opacity-50">
                  {saving ? "Saving..." : "Create Account"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {loading ? (
        <div className="flex justify-center py-12"><div className="animate-spin w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full" /></div>
      ) : (
        <div className="space-y-4">
          {grouped.map(({ type, accounts: accs, total }) => (
            accs.length > 0 && (
              <div key={type} className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                <div className="flex items-center justify-between px-5 py-3 border-b border-gray-100 bg-gray-50">
                  <div className="flex items-center gap-2">
                    <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${typeColor[type]}`}>{type}</span>
                    <span className="text-sm text-gray-500">{accs.length} accounts</span>
                  </div>
                  <span className={`text-sm font-semibold ${["Asset", "Income"].includes(type) ? "text-green-700" : "text-red-700"}`}>
                    {total.toLocaleString("en", { minimumFractionDigits: 2 })} JOD
                  </span>
                </div>
                <div className="divide-y divide-gray-50">
                  {accs.map(acc => (
                    <div key={acc.id} className="flex items-center justify-between px-5 py-3 hover:bg-gray-50">
                      <div>
                        <div className="text-sm font-medium text-gray-800">{acc.name}</div>
                        <div className="text-xs text-gray-400 flex gap-2">
                          {acc.subType && <span>{acc.subType}</span>}
                          {acc.liquidity && <span>· {acc.liquidity.replace("Term", " Term")}</span>}
                          {acc.isSystem && <span className="text-blue-400">· System</span>}
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <span className={`text-sm font-semibold ${acc.balance >= 0 ? "text-gray-800" : "text-red-600"}`}>
                          {acc.balance.toLocaleString("en", { minimumFractionDigits: 2 })} JOD
                        </span>
                        {!acc.isSystem && (
                          <button onClick={() => del(acc.id)} className="text-gray-300 hover:text-red-500 p-1">
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )
          ))}
        </div>
      )}
    </div>
  );
}
