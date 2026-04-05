"use client";
import { useEffect, useState } from "react";
import { Calculator, Info, CheckCircle } from "lucide-react";

type VATData = {
  vatOnSales: number; vatOnPurchases: number; netVAT: number;
  invoices: Array<{ number: string; customerName: string; date: string; subtotal: number; vatAmount: number; total: number; status: string }>;
  bills: Array<{ supplierName: string; date: string; subtotal: number; vatAmount: number }>;
};

export default function VATPage() {
  const [data, setData] = useState<VATData | null>(null);
  const [loading, setLoading] = useState(true);
  const [quarter, setQuarter] = useState(() => {
    const now = new Date();
    return `${now.getFullYear()}-Q${Math.floor(now.getMonth() / 3) + 1}`;
  });

  useEffect(() => {
    setLoading(true);
    fetch(`/api/vat?quarter=${quarter}`)
      .then(r => r.json())
      .then(d => { setData(d); setLoading(false); })
      .catch(() => setLoading(false));
  }, [quarter]);

  const quarters = [];
  const now = new Date();
  for (let i = 0; i < 8; i++) {
    const d = new Date(now.getFullYear(), now.getMonth() - i * 3, 1);
    quarters.push(`${d.getFullYear()}-Q${Math.floor(d.getMonth() / 3) + 1}`);
  }

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2"><Calculator className="w-6 h-6 text-blue-600" /> VAT Management</h1>
        <p className="text-sm text-gray-500 mt-1">Jordan VAT is 16%. You collect it from customers and pay it to the government, minus what you paid on purchases.</p>
      </div>

      <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 flex items-start gap-3 text-sm text-blue-800">
        <Info className="w-5 h-5 flex-shrink-0 mt-0.5" />
        <div>
          <strong>How VAT works:</strong> When you sell something for 100 JOD + 16 JOD VAT, you collect 16 JOD.
          When you buy supplies for 50 JOD + 8 JOD VAT, you get 8 JOD credit.
          You pay the government the difference: 16 − 8 = <strong>8 JOD</strong>.
        </div>
      </div>

      {/* Quarter selector */}
      <div className="flex items-center gap-3">
        <label className="text-sm font-medium text-gray-700">Quarter:</label>
        <select value={quarter} onChange={e => setQuarter(e.target.value)}
          className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
          {[...new Set(quarters)].map(q => <option key={q} value={q}>{q}</option>)}
        </select>
      </div>

      {loading ? (
        <div className="flex justify-center py-12"><div className="animate-spin w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full" /></div>
      ) : !data ? null : (
        <>
          {/* Summary cards */}
          <div className="grid grid-cols-3 gap-4">
            <div className="bg-green-50 border border-green-200 rounded-xl p-5">
              <div className="text-xs text-green-700 font-medium mb-1">VAT Collected (Output)</div>
              <div className="text-2xl font-bold text-green-800">{data.vatOnSales.toFixed(2)} JOD</div>
              <div className="text-xs text-green-600 mt-1">From customer invoices</div>
            </div>
            <div className="bg-blue-50 border border-blue-200 rounded-xl p-5">
              <div className="text-xs text-blue-700 font-medium mb-1">VAT Paid (Input)</div>
              <div className="text-2xl font-bold text-blue-800">{data.vatOnPurchases.toFixed(2)} JOD</div>
              <div className="text-xs text-blue-600 mt-1">On supplier bills</div>
            </div>
            <div className={`border rounded-xl p-5 ${data.netVAT > 0 ? "bg-red-50 border-red-200" : "bg-gray-50 border-gray-200"}`}>
              <div className={`text-xs font-medium mb-1 ${data.netVAT > 0 ? "text-red-700" : "text-gray-700"}`}>Net VAT Owed</div>
              <div className={`text-2xl font-bold ${data.netVAT > 0 ? "text-red-800" : "text-gray-800"}`}>{data.netVAT.toFixed(2)} JOD</div>
              <div className={`text-xs mt-1 ${data.netVAT > 0 ? "text-red-600" : "text-gray-500"}`}>
                {data.netVAT > 0 ? "To pay to tax authority" : "No VAT due this period"}
              </div>
            </div>
          </div>

          {/* Calculation breakdown */}
          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <h3 className="font-semibold text-gray-800 mb-3">VAT Calculation</h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between py-2 border-b border-gray-100">
                <span className="text-gray-600">VAT Collected from Sales</span>
                <span className="font-medium text-green-700">+ {data.vatOnSales.toFixed(2)} JOD</span>
              </div>
              <div className="flex justify-between py-2 border-b border-gray-100">
                <span className="text-gray-600">VAT Paid on Purchases</span>
                <span className="font-medium text-blue-700">- {data.vatOnPurchases.toFixed(2)} JOD</span>
              </div>
              <div className="flex justify-between py-2 font-bold text-base">
                <span>Net VAT {data.netVAT > 0 ? "Due to Government" : "Credit"}</span>
                <span className={data.netVAT > 0 ? "text-red-700" : "text-green-700"}>{Math.abs(data.netVAT).toFixed(2)} JOD</span>
              </div>
            </div>
          </div>

          {/* Invoices with VAT */}
          {data.invoices.length > 0 && (
            <div className="bg-white rounded-xl border border-gray-200 p-5">
              <h3 className="font-semibold text-gray-800 mb-3">Sales with VAT ({data.invoices.length} invoices)</h3>
              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead><tr className="text-gray-500 text-left">
                    <th className="py-2 pr-4">Invoice</th><th className="py-2 pr-4">Customer</th>
                    <th className="py-2 pr-4">Date</th><th className="py-2 pr-4 text-right">Net</th>
                    <th className="py-2 pr-4 text-right">VAT</th><th className="py-2 text-right">Total</th>
                  </tr></thead>
                  <tbody className="divide-y divide-gray-50">
                    {data.invoices.map(inv => (
                      <tr key={inv.number}>
                        <td className="py-2 pr-4 font-medium text-blue-600">{inv.number}</td>
                        <td className="py-2 pr-4">{inv.customerName}</td>
                        <td className="py-2 pr-4 text-gray-400">{new Date(inv.date).toLocaleDateString("en-GB", { day: "2-digit", month: "short" })}</td>
                        <td className="py-2 pr-4 text-right">{inv.subtotal.toFixed(2)}</td>
                        <td className="py-2 pr-4 text-right text-green-700">{inv.vatAmount.toFixed(2)}</td>
                        <td className="py-2 text-right font-medium">{inv.total.toFixed(2)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Bills with VAT */}
          {data.bills.length > 0 && (
            <div className="bg-white rounded-xl border border-gray-200 p-5">
              <h3 className="font-semibold text-gray-800 mb-3">Purchases with VAT ({data.bills.length} bills)</h3>
              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead><tr className="text-gray-500 text-left">
                    <th className="py-2 pr-4">Supplier</th><th className="py-2 pr-4">Date</th>
                    <th className="py-2 pr-4 text-right">Net</th><th className="py-2 text-right">VAT Credit</th>
                  </tr></thead>
                  <tbody className="divide-y divide-gray-50">
                    {data.bills.map((bill, i) => (
                      <tr key={i}>
                        <td className="py-2 pr-4">{bill.supplierName}</td>
                        <td className="py-2 pr-4 text-gray-400">{new Date(bill.date).toLocaleDateString("en-GB", { day: "2-digit", month: "short" })}</td>
                        <td className="py-2 pr-4 text-right">{bill.subtotal.toFixed(2)}</td>
                        <td className="py-2 text-right text-blue-700">{bill.vatAmount.toFixed(2)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
