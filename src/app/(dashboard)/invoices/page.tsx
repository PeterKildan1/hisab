"use client";
import { useEffect, useState } from "react";
import { Plus, FileText, CheckCircle, Clock, AlertCircle, DollarSign } from "lucide-react";

type InvoiceItem = { description: string; quantity: number; unitPrice: number };
type Invoice = {
  id: string; number: string; customerName: string; customerEmail: string | null;
  date: string; dueDate: string; status: string; subtotal: number; vatAmount: number;
  total: number; paidAmount: number; items: InvoiceItem[];
};

const statusIcon = { paid: CheckCircle, unpaid: Clock, partial: DollarSign, overdue: AlertCircle };
const statusColor = { paid: "text-green-600 bg-green-50", unpaid: "text-blue-600 bg-blue-50", partial: "text-amber-600 bg-amber-50", overdue: "text-red-600 bg-red-50" };

export default function InvoicesPage() {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
  const [form, setForm] = useState({
    customerName: "", customerEmail: "", customerPhone: "",
    date: new Date().toISOString().split("T")[0],
    dueDate: new Date(Date.now() + 30 * 86400000).toISOString().split("T")[0],
    notes: "",
    items: [{ description: "", quantity: 1, unitPrice: 0 }],
  });

  const load = () => fetch("/api/invoices").then(r => r.json()).then(d => { setInvoices(d); setLoading(false); });
  useEffect(() => { load(); }, []);

  const addItem = () => setForm(f => ({ ...f, items: [...f.items, { description: "", quantity: 1, unitPrice: 0 }] }));
  const removeItem = (i: number) => setForm(f => ({ ...f, items: f.items.filter((_, idx) => idx !== i) }));
  const updateItem = (i: number, field: string, value: string | number) =>
    setForm(f => ({ ...f, items: f.items.map((item, idx) => idx === i ? { ...item, [field]: value } : item) }));

  const subtotal = form.items.reduce((s, i) => s + i.quantity * i.unitPrice, 0);
  const vat = subtotal * 0.16;

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    await fetch("/api/invoices", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(form) });
    setShowForm(false);
    load();
  };

  const markPaid = async (id: string, total: number) => {
    await fetch(`/api/invoices/${id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ status: "paid", paidAmount: total }) });
    load();
  };

  const stats = {
    total: invoices.reduce((s, i) => s + i.total, 0),
    paid: invoices.filter(i => i.status === "paid").reduce((s, i) => s + i.total, 0),
    outstanding: invoices.filter(i => i.status !== "paid").reduce((s, i) => s + (i.total - i.paidAmount), 0),
    overdue: invoices.filter(i => i.status === "overdue" || (i.status !== "paid" && new Date(i.dueDate) < new Date())).length,
  };

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2"><FileText className="w-6 h-6 text-blue-600" /> Invoices & Receivables</h1>
          <p className="text-sm text-gray-500 mt-1">Bills you send to customers. 16% VAT applied automatically per Jordanian law.</p>
        </div>
        <button onClick={() => setShowForm(true)} className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700">
          <Plus className="w-4 h-4" /> New Invoice
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: "Total Invoiced", value: stats.total, color: "text-gray-800" },
          { label: "Collected", value: stats.paid, color: "text-green-700" },
          { label: "Outstanding", value: stats.outstanding, color: "text-blue-700" },
          { label: "Overdue", value: stats.overdue, color: "text-red-700", isCount: true },
        ].map(s => (
          <div key={s.label} className="bg-white border border-gray-200 rounded-xl p-4">
            <div className="text-xs text-gray-500 mb-1">{s.label}</div>
            <div className={`text-xl font-bold ${s.color}`}>
              {s.isCount ? s.value : `${(s.value as number).toLocaleString("en", { minimumFractionDigits: 2 })} JOD`}
            </div>
          </div>
        ))}
      </div>

      {showForm && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-start justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl p-6 w-full max-w-2xl shadow-2xl my-4">
            <h2 className="font-semibold text-lg mb-4">New Invoice</h2>
            <form onSubmit={save} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Customer Name</label>
                  <input value={form.customerName} onChange={e => setForm({...form, customerName: e.target.value})}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" required />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Customer Email</label>
                  <input type="email" value={form.customerEmail} onChange={e => setForm({...form, customerEmail: e.target.value})}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Invoice Date</label>
                  <input type="date" value={form.date} onChange={e => setForm({...form, date: e.target.value})}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" required />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Due Date</label>
                  <input type="date" value={form.dueDate} onChange={e => setForm({...form, dueDate: e.target.value})}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" required />
                </div>
              </div>

              {/* Line items */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-sm font-medium text-gray-700">Items</label>
                  <button type="button" onClick={addItem} className="text-xs text-blue-600 hover:underline">+ Add item</button>
                </div>
                <div className="border border-gray-200 rounded-lg overflow-hidden">
                  <div className="grid grid-cols-12 gap-2 px-3 py-2 bg-gray-50 text-xs font-medium text-gray-500">
                    <div className="col-span-6">Description</div>
                    <div className="col-span-2 text-center">Qty</div>
                    <div className="col-span-3 text-right">Unit Price</div>
                    <div className="col-span-1"></div>
                  </div>
                  {form.items.map((item, i) => (
                    <div key={i} className="grid grid-cols-12 gap-2 px-3 py-2 border-t border-gray-100">
                      <div className="col-span-6">
                        <input value={item.description} onChange={e => updateItem(i, "description", e.target.value)}
                          className="w-full border border-gray-200 rounded px-2 py-1 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                          placeholder="Item description" required />
                      </div>
                      <div className="col-span-2">
                        <input type="number" min="0.01" step="0.01" value={item.quantity} onChange={e => updateItem(i, "quantity", parseFloat(e.target.value) || 0)}
                          className="w-full border border-gray-200 rounded px-2 py-1 text-sm text-center focus:outline-none focus:ring-1 focus:ring-blue-500" />
                      </div>
                      <div className="col-span-3">
                        <input type="number" min="0" step="0.01" value={item.unitPrice} onChange={e => updateItem(i, "unitPrice", parseFloat(e.target.value) || 0)}
                          className="w-full border border-gray-200 rounded px-2 py-1 text-sm text-right focus:outline-none focus:ring-1 focus:ring-blue-500" />
                      </div>
                      <div className="col-span-1 flex items-center justify-center">
                        {form.items.length > 1 && (
                          <button type="button" onClick={() => removeItem(i)} className="text-gray-300 hover:text-red-500 text-sm">×</button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Totals */}
              <div className="bg-gray-50 rounded-lg p-4 space-y-1 text-sm">
                <div className="flex justify-between"><span className="text-gray-500">Subtotal</span><span>{subtotal.toFixed(2)} JOD</span></div>
                <div className="flex justify-between"><span className="text-gray-500">VAT (16%)</span><span>{vat.toFixed(2)} JOD</span></div>
                <div className="flex justify-between font-bold text-base border-t border-gray-200 pt-1 mt-1"><span>Total</span><span>{(subtotal + vat).toFixed(2)} JOD</span></div>
              </div>

              <div className="flex gap-3">
                <button type="button" onClick={() => setShowForm(false)} className="flex-1 border border-gray-300 rounded-lg py-2 text-sm text-gray-600 hover:bg-gray-50">Cancel</button>
                <button type="submit" className="flex-1 bg-blue-600 text-white rounded-lg py-2 text-sm font-medium hover:bg-blue-700">Create Invoice</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {loading ? (
        <div className="flex justify-center py-12"><div className="animate-spin w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full" /></div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          {invoices.length === 0 ? (
            <div className="text-center py-12 text-gray-400">
              <FileText className="w-12 h-12 mx-auto mb-3 opacity-30" />
              <p>No invoices yet</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead><tr className="bg-gray-50 text-left text-xs font-medium text-gray-500">
                  <th className="px-4 py-3">Invoice</th><th className="px-4 py-3">Customer</th>
                  <th className="px-4 py-3">Date</th><th className="px-4 py-3">Due</th>
                  <th className="px-4 py-3 text-right">Total</th><th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3"></th>
                </tr></thead>
                <tbody className="divide-y divide-gray-100">
                  {invoices.map(inv => {
                    const isOverdue = inv.status !== "paid" && new Date(inv.dueDate) < new Date();
                    const status = (isOverdue && inv.status !== "paid") ? "overdue" : inv.status as keyof typeof statusColor;
                    const Icon = statusIcon[status] || Clock;
                    return (
                      <tr key={inv.id} className="hover:bg-gray-50 cursor-pointer" onClick={() => setSelectedInvoice(inv)}>
                        <td className="px-4 py-3 font-medium text-blue-600">{inv.number}</td>
                        <td className="px-4 py-3">{inv.customerName}</td>
                        <td className="px-4 py-3 text-gray-500">{new Date(inv.date).toLocaleDateString("en-GB", { day: "2-digit", month: "short" })}</td>
                        <td className="px-4 py-3 text-gray-500">{new Date(inv.dueDate).toLocaleDateString("en-GB", { day: "2-digit", month: "short" })}</td>
                        <td className="px-4 py-3 text-right font-medium">{inv.total.toFixed(2)} JOD</td>
                        <td className="px-4 py-3">
                          <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${statusColor[status]}`}>
                            <Icon className="w-3 h-3" />{status}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          {inv.status !== "paid" && (
                            <button onClick={e => { e.stopPropagation(); markPaid(inv.id, inv.total); }}
                              className="text-xs text-green-600 hover:underline">Mark Paid</button>
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

      {/* Invoice detail modal */}
      {selectedInvoice && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-2xl">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-semibold text-lg">{selectedInvoice.number}</h2>
              <button onClick={() => setSelectedInvoice(null)} className="text-gray-400 hover:text-gray-600">×</button>
            </div>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between"><span className="text-gray-500">Customer</span><span>{selectedInvoice.customerName}</span></div>
              <div className="flex justify-between"><span className="text-gray-500">Date</span><span>{new Date(selectedInvoice.date).toLocaleDateString()}</span></div>
              <div className="flex justify-between"><span className="text-gray-500">Due</span><span>{new Date(selectedInvoice.dueDate).toLocaleDateString()}</span></div>
              <div className="border-t pt-2 mt-2 space-y-1">
                {selectedInvoice.items.map((item, i) => (
                  <div key={i} className="flex justify-between text-xs">
                    <span>{item.description} × {item.quantity}</span>
                    <span>{(item.quantity * item.unitPrice).toFixed(2)} JOD</span>
                  </div>
                ))}
              </div>
              <div className="border-t pt-2 space-y-1">
                <div className="flex justify-between"><span className="text-gray-500">Subtotal</span><span>{selectedInvoice.subtotal.toFixed(2)} JOD</span></div>
                <div className="flex justify-between"><span className="text-gray-500">VAT 16%</span><span>{selectedInvoice.vatAmount.toFixed(2)} JOD</span></div>
                <div className="flex justify-between font-bold"><span>Total</span><span>{selectedInvoice.total.toFixed(2)} JOD</span></div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
