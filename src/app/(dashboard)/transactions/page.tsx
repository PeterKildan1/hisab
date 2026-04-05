"use client";
import { useEffect, useState, useRef } from "react";
import { Plus, Search, Camera, Check, ArrowLeftRight } from "lucide-react";

type Account = { id: string; name: string; type: string };
type Transaction = {
  id: string; date: string; description: string; reference: string | null; reconciled: boolean;
  journalLines: Array<{ id: string; amount: number; description: string | null; debitAccount: Account | null; creditAccount: Account | null }>;
};

export default function TransactionsPage() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [search, setSearch] = useState("");
  const [scanning, setScanning] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const [form, setForm] = useState({
    date: new Date().toISOString().split("T")[0],
    description: "", reference: "",
    debitAccountId: "", creditAccountId: "", amount: "",
  });

  const load = async () => {
    const [txRes, accRes] = await Promise.all([
      fetch(`/api/transactions?search=${search}`),
      fetch("/api/accounts"),
    ]);
    setTransactions(await txRes.json());
    setAccounts(await accRes.json());
    setLoading(false);
  };

  useEffect(() => { load(); }, [search]);

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    await fetch("/api/transactions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        date: form.date,
        description: form.description,
        reference: form.reference,
        lines: [{ debitAccountId: form.debitAccountId, creditAccountId: form.creditAccountId, amount: parseFloat(form.amount) }],
      }),
    });
    setShowForm(false);
    setForm({ date: new Date().toISOString().split("T")[0], description: "", reference: "", debitAccountId: "", creditAccountId: "", amount: "" });
    load();
  };

  const scanReceipt = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setScanning(true);
    const fd = new FormData();
    fd.append("file", file);
    const res = await fetch("/api/ai/scan-receipt", { method: "POST", body: fd });
    const data = await res.json();
    if (data.description) {
      setForm(prev => ({
        ...prev,
        description: data.description || data.supplier || "",
        amount: data.total?.toString() || "",
        date: data.date || prev.date,
      }));
      setShowForm(true);
    }
    setScanning(false);
  };

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6">
      <div className="flex items-start justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2"><ArrowLeftRight className="w-6 h-6 text-blue-600" /> Transactions</h1>
          <p className="text-sm text-gray-500 mt-1">Every financial movement in your business. Record manually or scan a receipt.</p>
        </div>
        <div className="flex gap-2">
          <button onClick={() => fileRef.current?.click()} disabled={scanning}
            className="flex items-center gap-2 border border-gray-300 text-gray-700 px-3 py-2 rounded-lg text-sm hover:bg-gray-50">
            <Camera className="w-4 h-4" /> {scanning ? "Scanning..." : "Scan Receipt"}
          </button>
          <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={scanReceipt} />
          <button onClick={() => setShowForm(true)} className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700">
            <Plus className="w-4 h-4" /> New Transaction
          </button>
        </div>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" />
        <input value={search} onChange={e => setSearch(e.target.value)}
          className="w-full pl-9 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="Search transactions..." />
      </div>

      {showForm && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-2xl">
            <h2 className="font-semibold text-lg mb-4">Record Transaction</h2>
            <p className="text-xs text-gray-500 mb-4 bg-blue-50 p-2 rounded-lg">
              In accounting, every transaction has two sides: <strong>Debit</strong> (what you receive or spend) and <strong>Credit</strong> (where it comes from).
            </p>
            <form onSubmit={save} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Date</label>
                  <input type="date" value={form.date} onChange={e => setForm({...form, date: e.target.value})}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" required />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Amount (JOD)</label>
                  <input type="number" step="0.01" value={form.amount} onChange={e => setForm({...form, amount: e.target.value})}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" required />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                <input value={form.description} onChange={e => setForm({...form, description: e.target.value})}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="e.g. Paid office rent" required />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Reference / Invoice #</label>
                <input value={form.reference} onChange={e => setForm({...form, reference: e.target.value})}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Optional" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Debit Account (receives)</label>
                <select value={form.debitAccountId} onChange={e => setForm({...form, debitAccountId: e.target.value})}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" required>
                  <option value="">— Select —</option>
                  {accounts.map(a => <option key={a.id} value={a.id}>{a.name} ({a.type})</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Credit Account (source)</label>
                <select value={form.creditAccountId} onChange={e => setForm({...form, creditAccountId: e.target.value})}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" required>
                  <option value="">— Select —</option>
                  {accounts.map(a => <option key={a.id} value={a.id}>{a.name} ({a.type})</option>)}
                </select>
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowForm(false)} className="flex-1 border border-gray-300 rounded-lg py-2 text-sm text-gray-600 hover:bg-gray-50">Cancel</button>
                <button type="submit" className="flex-1 bg-blue-600 text-white rounded-lg py-2 text-sm font-medium hover:bg-blue-700">Save</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {loading ? (
        <div className="flex justify-center py-12"><div className="animate-spin w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full" /></div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          {transactions.length === 0 ? (
            <div className="text-center py-12 text-gray-400">
              <ArrowLeftRight className="w-12 h-12 mx-auto mb-3 opacity-30" />
              <p>No transactions yet. Record your first one!</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-100">
              {transactions.map(tx => (
                <div key={tx.id} className="px-5 py-3 hover:bg-gray-50">
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium text-gray-800">{tx.description}</span>
                        {tx.reconciled && <Check className="w-3.5 h-3.5 text-green-500" />}
                      </div>
                      <div className="text-xs text-gray-400 mt-0.5">
                        {new Date(tx.date).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" })}
                        {tx.reference && ` · Ref: ${tx.reference}`}
                      </div>
                      {tx.journalLines.map(line => (
                        <div key={line.id} className="text-xs text-gray-500 mt-1">
                          {line.debitAccount?.name} → {line.creditAccount?.name}
                        </div>
                      ))}
                    </div>
                    <div className="text-sm font-semibold text-gray-800 ml-4">
                      {tx.journalLines.reduce((s, l) => s + l.amount, 0).toLocaleString("en", { minimumFractionDigits: 2 })} JOD
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
