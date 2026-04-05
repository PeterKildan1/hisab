"use client";
import { useEffect, useState } from "react";
import { Plus, Package, AlertTriangle, TrendingDown, TrendingUp } from "lucide-react";

type InventoryItem = {
  id: string; name: string; sku: string | null; quantity: number;
  unitCost: number; sellingPrice: number; reorderLevel: number;
  movements: Array<{ id: string; type: string; quantity: number; reason: string | null; date: string }>;
};

export default function InventoryPage() {
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [showMovement, setShowMovement] = useState<InventoryItem | null>(null);
  const [form, setForm] = useState({ name: "", sku: "", quantity: 0, unitCost: 0, sellingPrice: 0, reorderLevel: 0 });
  const [movement, setMovement] = useState({ type: "in", quantity: 1, unitCost: 0, reason: "" });

  const load = () => fetch("/api/inventory").then(r => r.json()).then(d => { setItems(d); setLoading(false); });
  useEffect(() => { load(); }, []);

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    await fetch("/api/inventory", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(form) });
    setShowForm(false);
    setForm({ name: "", sku: "", quantity: 0, unitCost: 0, sellingPrice: 0, reorderLevel: 0 });
    load();
  };

  const recordMovement = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!showMovement) return;
    await fetch(`/api/inventory/${showMovement.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ movement }),
    });
    setShowMovement(null);
    load();
  };

  const totalValue = items.reduce((s, i) => s + i.quantity * i.unitCost, 0);
  const lowStock = items.filter(i => i.quantity <= i.reorderLevel);

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2"><Package className="w-6 h-6 text-blue-600" /> Inventory</h1>
          <p className="text-sm text-gray-500 mt-1">Track what you have in stock, its value, and when to reorder.</p>
        </div>
        <button onClick={() => setShowForm(true)} className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700">
          <Plus className="w-4 h-4" /> Add Product
        </button>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div className="bg-white border border-gray-200 rounded-xl p-4">
          <div className="text-xs text-gray-500 mb-1">Total Stock Value</div>
          <div className="text-xl font-bold text-green-700">{totalValue.toFixed(2)} JOD</div>
        </div>
        <div className="bg-white border border-gray-200 rounded-xl p-4">
          <div className="text-xs text-gray-500 mb-1">Products</div>
          <div className="text-xl font-bold text-gray-800">{items.length}</div>
        </div>
        <div className={`border rounded-xl p-4 ${lowStock.length > 0 ? "bg-amber-50 border-amber-200" : "bg-white border-gray-200"}`}>
          <div className="text-xs text-gray-500 mb-1">Low Stock Alerts</div>
          <div className={`text-xl font-bold ${lowStock.length > 0 ? "text-amber-700" : "text-gray-800"}`}>{lowStock.length}</div>
        </div>
      </div>

      {lowStock.length > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
          <div className="flex items-center gap-2 text-amber-800 font-medium mb-2"><AlertTriangle className="w-4 h-4" /> Low Stock Items</div>
          <div className="flex flex-wrap gap-2">
            {lowStock.map(i => (
              <span key={i.id} className="text-xs bg-amber-100 text-amber-800 px-2 py-1 rounded-full">
                {i.name}: {i.quantity} left (reorder at {i.reorderLevel})
              </span>
            ))}
          </div>
        </div>
      )}

      {showForm && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-2xl">
            <h2 className="font-semibold text-lg mb-4">Add Product</h2>
            <form onSubmit={save} className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div className="col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Product Name</label>
                  <input value={form.name} onChange={e => setForm({...form, name: e.target.value})}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" required />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">SKU (optional)</label>
                  <input value={form.sku} onChange={e => setForm({...form, sku: e.target.value})}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Opening Quantity</label>
                  <input type="number" min="0" value={form.quantity} onChange={e => setForm({...form, quantity: parseFloat(e.target.value) || 0})}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Unit Cost (JOD)</label>
                  <input type="number" step="0.01" min="0" value={form.unitCost} onChange={e => setForm({...form, unitCost: parseFloat(e.target.value) || 0})}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" required />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Selling Price (JOD)</label>
                  <input type="number" step="0.01" min="0" value={form.sellingPrice} onChange={e => setForm({...form, sellingPrice: parseFloat(e.target.value) || 0})}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" required />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Reorder Level</label>
                  <input type="number" min="0" value={form.reorderLevel} onChange={e => setForm({...form, reorderLevel: parseFloat(e.target.value) || 0})}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                </div>
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowForm(false)} className="flex-1 border border-gray-300 rounded-lg py-2 text-sm text-gray-600">Cancel</button>
                <button type="submit" className="flex-1 bg-blue-600 text-white rounded-lg py-2 text-sm font-medium hover:bg-blue-700">Add Product</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showMovement && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-sm shadow-2xl">
            <h2 className="font-semibold text-lg mb-1">Stock Movement</h2>
            <p className="text-sm text-gray-500 mb-4">{showMovement.name} — Current: {showMovement.quantity}</p>
            <form onSubmit={recordMovement} className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
                <select value={movement.type} onChange={e => setMovement({...movement, type: e.target.value})}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                  <option value="in">Stock In (purchase/return)</option>
                  <option value="out">Stock Out (sale/use)</option>
                  <option value="adjustment">Adjustment</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Quantity</label>
                <input type="number" min="0.01" step="0.01" value={movement.quantity} onChange={e => setMovement({...movement, quantity: parseFloat(e.target.value) || 0})}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" required />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Reason</label>
                <input value={movement.reason} onChange={e => setMovement({...movement, reason: e.target.value})}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="e.g. sold to customer, received from supplier" />
              </div>
              <div className="flex gap-3">
                <button type="button" onClick={() => setShowMovement(null)} className="flex-1 border border-gray-300 rounded-lg py-2 text-sm text-gray-600">Cancel</button>
                <button type="submit" className="flex-1 bg-blue-600 text-white rounded-lg py-2 text-sm font-medium hover:bg-blue-700">Record</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {loading ? (
        <div className="flex justify-center py-12"><div className="animate-spin w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full" /></div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          {items.length === 0 ? (
            <div className="text-center py-12 text-gray-400"><Package className="w-12 h-12 mx-auto mb-3 opacity-30" /><p>No inventory items yet</p></div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead><tr className="bg-gray-50 text-left text-xs font-medium text-gray-500">
                  <th className="px-4 py-3">Product</th><th className="px-4 py-3">SKU</th>
                  <th className="px-4 py-3 text-right">In Stock</th><th className="px-4 py-3 text-right">Unit Cost</th>
                  <th className="px-4 py-3 text-right">Sell Price</th><th className="px-4 py-3 text-right">Stock Value</th>
                  <th className="px-4 py-3"></th>
                </tr></thead>
                <tbody className="divide-y divide-gray-100">
                  {items.map(item => (
                    <tr key={item.id} className={`hover:bg-gray-50 ${item.quantity <= item.reorderLevel ? "bg-amber-50/30" : ""}`}>
                      <td className="px-4 py-3 font-medium">
                        {item.name}
                        {item.quantity <= item.reorderLevel && <AlertTriangle className="inline w-3 h-3 text-amber-500 ml-1" />}
                      </td>
                      <td className="px-4 py-3 text-gray-400">{item.sku || "—"}</td>
                      <td className="px-4 py-3 text-right font-medium">{item.quantity}</td>
                      <td className="px-4 py-3 text-right text-gray-500">{item.unitCost.toFixed(2)}</td>
                      <td className="px-4 py-3 text-right text-gray-500">{item.sellingPrice.toFixed(2)}</td>
                      <td className="px-4 py-3 text-right font-medium text-green-700">{(item.quantity * item.unitCost).toFixed(2)} JOD</td>
                      <td className="px-4 py-3">
                        <button onClick={() => setShowMovement(item)} className="text-xs text-blue-600 hover:underline">Movement</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
