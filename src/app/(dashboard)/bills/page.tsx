"use client";
import { useEffect, useState } from "react";
import { Plus, Receipt, CheckCircle, Clock, AlertCircle } from "lucide-react";

type Bill = {
  id: string; supplierName: string; number: string | null; date: string;
  dueDate: string; status: string; total: number; paidAmount: number; vatAmount: number;
  items: Array<{ description: string; quantity: number; unitPrice: number; total: number }>;
};

const statusColor: Record<string, string> = {
  paid: "text-green-600 bg-green-50",
  unpaid: "text-amber-600 bg-amber-50",
  overdue: "text-red-600 bg-red-50",
};

export default function BillsPage() {
  const [bills, setBills] = useState<Bill[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
    supplierName: "", number: "",
    date: new Date().toISOString().split("T")[0],
    dueDate: new Date(Date.now() + 30 * 86400000).toISOString().split("T")[0],
    includeVat: false, notes: "",
    items: [{ description: "", quantity: 1, unitPrice: 0 }],
  });

  const load = () => fetch("/api/bills").then(r => r.json()).then(d => { setBills(d); setLoading(false); });
  useEffect(() => { load(); }, []);

  const addItem = () => setForm(f => ({ ...f, items: [...f.items, { description: "", quantity: 1, unitPrice: 0 }] }));
  const removeItem = (i: number) => setForm(f => ({ ...f, items: f.items.filter((_, idx) => idx !== i) }));
  const updateItem = (i: number, field: string, value: string | number) =>
    setForm(f => ({ ...f, items: f.items.map((item, idx) => idx === i ? { ...item, [field]: value } : item) }));

  const subtotal = form.items.reduce((s, i) => s + i.quantity * i.unitPrice, 0);
  const vat = form.includeVat ? subtotal * 0.16 : 0;

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    await fetch("/api/bills", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(form) });
    setShowForm(false);
    load();
  };

  const markPaid = async (id: string, total: number) => {
    await fetch(`/api/bills/${id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ status: "paid", paidAmount: total }) });
    load();
  };

  const outstanding = bills.filter(b => b.status !== "paid").reduce((s, b) => s + (b.total - b.paidAmount), 0);
  const overdue = bills.filter(b => b.status !== "paid" && new Date(b.dueDate) < new Date()).length;

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2"><Receipt className="w-6 h-6 text-blue-600" /> Bills & Payables</h1>
          <p className="text-sm text-gray-500 mt-1">Bills from your suppliers. Track what you owe and when it&apos;s due.</p>
        </div>
        <button onClick={() => setShowForm(true)} className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700">
          <Plus className="w-4 h-4" /> Record Bill
        </button>
      </div>

      <div className="grid grid-cols-3 gap-4">
        {[
          { label: "Outstanding", value: `${outstanding.toFixed(2)} JOD`, color: "text-red-700" },
          { label: "Overdue Bills", value: `${overdue}`, color: "text-red-700" },
          { label: "Total Bills", value: bills.length.toString(), color: "text-gray-800" },
        ].map(s => (
          <div key={s.label} className="bg-white border border-gray-200 rounded-xl p-4">
            <div className="text-xs text-gray-500 mb-1">{s.label}</div>
            <div className={`text-xl font-bold ${s.color}`}>{s.value}</div>
          </div>
        ))}
      </div>

      {showForm && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-start justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl p-6 w-full max-w-2xl shadow-2xl my-4">
            <h2 className="font-semibold text-lg mb-4">Record Bill</h2>
            <form onSubmit={save} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Supplier Name</label>
                  <input value={form.supplierName} onChange={e => setForm({...form, supplierName: e.target.value})}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" required />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Bill / Invoice #</label>
                  <input value={form.number} onChange={e => setForm({...form, number: e.target.value})}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Bill Date</label>
                  <input type="date" value={form.date} onChange={e => setForm({...form, date: e.target.value})}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" required />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Due Date</label>
                  <input type="date" value={form.dueDate} onChange={e => setForm({...form, dueDate: e.target.value})}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" required />
                </div>
              </div>

              <div className="flex items-center gap-2">
                <input type="checkbox" id="vat" checked={form.includeVat} onChange={e => setForm({...form, includeVat: e.target.checked})} className="rounded" />
                <label htmlFor="vat" className="text-sm text-gray-700">Bill includes 16% VAT (deductible from VAT owed)</label>
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-sm font-medium text-gray-700">Items</label>
                  <button type="button" onClick={addItem} className="text-xs text-blue-600 hover:underline">+ Add item</button>
                </div>
                <div className="border border-gray-200 rounded-lg overflow-hidden">
                  <div className="grid grid-cols-12 gap-2 px-3 py-2 bg-gray-50 text-xs font-medium text-gray-500">
                    <div className="col-span-6">Description</div><div className="col-span-2 text-center">Qty</div>
                    <div className="col-span-3 text-right">Unit Price</div><div className="col-span-1"></div>
                  </div>
                  {form.items.map((item, i) => (
                    <div key={i} className="grid grid-cols-12 gap-2 px-3 py-2 border-t border-gray-100">
                      <div className="col-span-6">
                        <input value={item.description} onChange={e => updateItem(i, "description", e.target.value)}
                          className="w-full border border-gray-200 rounded px-2 py-1 text-sm focus:outline-none" placeholder="Item" required />
                      </div>
                      <div className="col-span-2">
                        <input type="number" min="0.01" step="0.01" value={item.quantity} onChange={e => updateItem(i, "quantity", parseFloat(e.target.value) || 0)}
                          className="w-full border border-gray-200 rounded px-2 py-1 text-sm text-center focus:outline-none" />
                      </div>
                      <div className="col-span-3">
                        <input type="number" min="0" step="0.01" value={item.unitPrice} onChange={e => updateItem(i, "unitPrice", parseFloat(e.target.value) || 0)}
                          className="w-full border border-gray-200 rounded px-2 py-1 text-sm text-right focus:outline-none" />
                      </div>
                      <div className="col-span-1 flex items-center justify-center">
                        {form.items.length > 1 && <button type="button" onClick={() => removeItem(i)} className="text-gray-300 hover:text-red-500">×</button>}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="bg-gray-50 rounded-lg p-3 text-sm space-y-1">
                <div className="flex justify-between"><span className="text-gray-500">Subtotal</span><span>{subtotal.toFixed(2)} JOD</span></div>
                {form.includeVat && <div className="flex justify-between"><span className="text-gray-500">VAT (16%)</span><span>{vat.toFixed(2)} JOD</span></div>}
                <div className="flex justify-between font-bold border-t pt-1"><span>Total</span><span>{(subtotal + vat).toFixed(2)} JOD</span></div>
              </div>

              <div className="flex gap-3">
                <button type="button" onClick={() => setShowForm(false)} className="flex-1 border border-gray-300 rounded-lg py-2 text-sm text-gray-600 hover:bg-gray-50">Cancel</button>
                <button type="submit" className="flex-1 bg-blue-600 text-white rounded-lg py-2 text-sm font-medium hover:bg-blue-700">Save Bill</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {loading ? (
        <div className="flex justify-center py-12"><div className="animate-spin w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full" /></div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          {bills.length === 0 ? (
            <div className="text-center py-12 text-gray-400"><Receipt className="w-12 h-12 mx-auto mb-3 opacity-30" /><p>No bills recorded yet</p></div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead><tr className="bg-gray-50 text-left text-xs font-medium text-gray-500">
                  <th className="px-4 py-3">Supplier</th><th className="px-4 py-3">Bill #</th>
                  <th className="px-4 py-3">Date</th><th className="px-4 py-3">Due</th>
                  <th className="px-4 py-3 text-right">Total</th><th className="px-4 py-3">Status</th><th className="px-4 py-3"></th>
                </tr></thead>
                <tbody className="divide-y divide-gray-100">
                  {bills.map(bill => {
                    const isOverdue = bill.status !== "paid" && new Date(bill.dueDate) < new Date();
                    const status = isOverdue ? "overdue" : bill.status;
                    return (
                      <tr key={bill.id} className="hover:bg-gray-50">
                        <td className="px-4 py-3 font-medium">{bill.supplierName}</td>
                        <td className="px-4 py-3 text-gray-500">{bill.number || "—"}</td>
                        <td className="px-4 py-3 text-gray-500">{new Date(bill.date).toLocaleDateString("en-GB", { day: "2-digit", month: "short" })}</td>
                        <td className="px-4 py-3 text-gray-500">{new Date(bill.dueDate).toLocaleDateString("en-GB", { day: "2-digit", month: "short" })}</td>
                        <td className="px-4 py-3 text-right font-medium">{bill.total.toFixed(2)} JOD</td>
                        <td className="px-4 py-3">
                          <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${statusColor[status] || statusColor.unpaid}`}>{status}</span>
                        </td>
                        <td className="px-4 py-3">
                          {bill.status !== "paid" && (
                            <button onClick={() => markPaid(bill.id, bill.total)} className="text-xs text-green-600 hover:underline">Mark Paid</button>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
