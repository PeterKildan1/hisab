"use client";
import { useEffect, useState } from "react";
import { Plus, Building2, Trash2 } from "lucide-react";
import { calculateDepreciation } from "@/lib/utils";

type FixedAsset = {
  id: string; name: string; category: string; purchasePrice: number;
  purchaseDate: string; usefulLifeYears: number; residualValue: number; notes: string | null;
};

const CATEGORIES = ["Equipment", "Furniture", "Vehicle", "Property", "Computer", "Other"];

export default function AssetsPage() {
  const [assets, setAssets] = useState<FixedAsset[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ name: "", category: "Equipment", purchasePrice: 0, purchaseDate: new Date().toISOString().split("T")[0], usefulLifeYears: 5, residualValue: 0, notes: "" });

  const load = () => fetch("/api/assets").then(r => r.json()).then(d => { setAssets(d); setLoading(false); });
  useEffect(() => { load(); }, []);

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    await fetch("/api/assets", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(form) });
    setShowForm(false);
    load();
  };

  const del = async (id: string) => {
    if (!confirm("Remove this asset?")) return;
    await fetch(`/api/assets/${id}`, { method: "DELETE" });
    load();
  };

  const totalBookValue = assets.reduce((s, a) => {
    const { bookValue } = calculateDepreciation(a.purchasePrice, a.residualValue, a.usefulLifeYears, new Date(a.purchaseDate));
    return s + bookValue;
  }, 0);

  const totalCost = assets.reduce((s, a) => s + a.purchasePrice, 0);
  const totalDepreciation = totalCost - totalBookValue;

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2"><Building2 className="w-6 h-6 text-blue-600" /> Fixed Assets & Depreciation</h1>
          <p className="text-sm text-gray-500 mt-1">Equipment and property your business owns. Depreciation is calculated automatically (straight-line method).</p>
        </div>
        <button onClick={() => setShowForm(true)} className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700">
          <Plus className="w-4 h-4" /> Add Asset
        </button>
      </div>

      <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 text-sm text-blue-800">
        <strong>Straight-line depreciation:</strong> Asset value is reduced evenly over its useful life. E.g., a 5,000 JOD machine with 5-year life depreciates 1,000 JOD per year, so after 2 years its book value is 3,000 JOD.
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div className="bg-white border border-gray-200 rounded-xl p-4">
          <div className="text-xs text-gray-500 mb-1">Original Cost</div>
          <div className="text-xl font-bold text-gray-800">{totalCost.toFixed(2)} JOD</div>
        </div>
        <div className="bg-white border border-gray-200 rounded-xl p-4">
          <div className="text-xs text-gray-500 mb-1">Total Depreciation</div>
          <div className="text-xl font-bold text-orange-700">{totalDepreciation.toFixed(2)} JOD</div>
        </div>
        <div className="bg-white border border-gray-200 rounded-xl p-4">
          <div className="text-xs text-gray-500 mb-1">Net Book Value</div>
          <div className="text-xl font-bold text-green-700">{totalBookValue.toFixed(2)} JOD</div>
        </div>
      </div>

      {showForm && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-2xl">
            <h2 className="font-semibold text-lg mb-4">Add Fixed Asset</h2>
            <form onSubmit={save} className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Asset Name</label>
                <input value={form.name} onChange={e => setForm({...form, name: e.target.value})}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" required />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
                  <select value={form.category} onChange={e => setForm({...form, category: e.target.value})}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                    {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Purchase Price (JOD)</label>
                  <input type="number" step="0.01" min="0" value={form.purchasePrice} onChange={e => setForm({...form, purchasePrice: parseFloat(e.target.value) || 0})}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" required />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Purchase Date</label>
                  <input type="date" value={form.purchaseDate} onChange={e => setForm({...form, purchaseDate: e.target.value})}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" required />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Useful Life (years)</label>
                  <input type="number" min="1" value={form.usefulLifeYears} onChange={e => setForm({...form, usefulLifeYears: parseInt(e.target.value) || 5})}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" required />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Residual Value (JOD)</label>
                  <input type="number" step="0.01" min="0" value={form.residualValue} onChange={e => setForm({...form, residualValue: parseFloat(e.target.value) || 0})}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                </div>
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowForm(false)} className="flex-1 border border-gray-300 rounded-lg py-2 text-sm">Cancel</button>
                <button type="submit" className="flex-1 bg-blue-600 text-white rounded-lg py-2 text-sm font-medium hover:bg-blue-700">Add Asset</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {loading ? (
        <div className="flex justify-center py-12"><div className="animate-spin w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full" /></div>
      ) : assets.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-200 text-center py-12 text-gray-400">
          <Building2 className="w-12 h-12 mx-auto mb-3 opacity-30" /><p>No fixed assets recorded</p>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead><tr className="bg-gray-50 text-left text-xs font-medium text-gray-500">
                <th className="px-4 py-3">Asset</th><th className="px-4 py-3">Category</th>
                <th className="px-4 py-3 text-right">Cost</th><th className="px-4 py-3 text-right">Depreciated</th>
                <th className="px-4 py-3 text-right">Book Value</th><th className="px-4 py-3 text-right">Annual Dep.</th>
                <th className="px-4 py-3"></th>
              </tr></thead>
              <tbody className="divide-y divide-gray-100">
                {assets.map(asset => {
                  const { bookValue, totalDepreciation: dep, annualDepreciation } = calculateDepreciation(
                    asset.purchasePrice, asset.residualValue, asset.usefulLifeYears, new Date(asset.purchaseDate)
                  );
                  return (
                    <tr key={asset.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3 font-medium">
                        {asset.name}
                        <div className="text-xs text-gray-400">{asset.usefulLifeYears}-year life · Bought {new Date(asset.purchaseDate).getFullYear()}</div>
                      </td>
                      <td className="px-4 py-3 text-gray-500">{asset.category}</td>
                      <td className="px-4 py-3 text-right">{asset.purchasePrice.toFixed(2)}</td>
                      <td className="px-4 py-3 text-right text-orange-600">{dep.toFixed(2)}</td>
                      <td className="px-4 py-3 text-right font-semibold text-green-700">{bookValue.toFixed(2)}</td>
                      <td className="px-4 py-3 text-right text-gray-500">{annualDepreciation.toFixed(2)}</td>
                      <td className="px-4 py-3">
                        <button onClick={() => del(asset.id)} className="text-gray-300 hover:text-red-500 p-1"><Trash2 className="w-3.5 h-3.5" /></button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
