"use client";
import { useEffect, useState } from "react";
import { Plus, Trash2, BookOpen, Info, ChevronDown, ChevronRight } from "lucide-react";
import OnboardingCard, { HelpButton } from "@/components/OnboardingCard";

type Account = {
  id: string; name: string; type: string; subType: string | null;
  liquidity: string | null; balance: number; isSystem: boolean;
};

const TYPES = [
  {
    value: "Asset",
    label: "Asset — Things you OWN",
    color: "bg-green-100 text-green-700 border-green-200",
    dot: "bg-green-500",
    description: "Anything your business owns or is owed to you. Cash, equipment, inventory, money customers owe you.",
    subtypes: ["Cash", "Receivable", "Inventory", "FixedAsset", "Prepaid", "Other"],
    subtypeLabels: {
      Cash: "Cash — Money in hand or in the bank",
      Receivable: "Receivable — Money customers owe you",
      Inventory: "Inventory — Products you hold for sale",
      FixedAsset: "Fixed Asset — Equipment, vehicles, property",
      Prepaid: "Prepaid — Expenses paid in advance",
      Other: "Other Asset",
    },
  },
  {
    value: "Liability",
    label: "Liability — Things you OWE",
    color: "bg-red-100 text-red-700 border-red-200",
    dot: "bg-red-500",
    description: "Money your business owes to others. Loans, unpaid bills, taxes due, salaries owed.",
    subtypes: ["Payable", "Loan", "TaxOwed", "SalaryOwed", "Credit", "Other"],
    subtypeLabels: {
      Payable: "Payable — Bills you haven't paid yet",
      Loan: "Loan — Borrowed money you must repay",
      TaxOwed: "Tax Owed — VAT or income tax due",
      SalaryOwed: "Salary Owed — Wages not yet paid",
      Credit: "Credit — Overdraft or credit line",
      Other: "Other Liability",
    },
  },
  {
    value: "Equity",
    label: "Equity — What the business is WORTH",
    color: "bg-purple-100 text-purple-700 border-purple-200",
    dot: "bg-purple-500",
    description: "The owner's share of the business. What's left after you subtract all debts from all assets. Assets − Liabilities = Equity.",
    subtypes: [],
    subtypeLabels: {},
  },
  {
    value: "Income",
    label: "Income — Money COMING IN",
    color: "bg-blue-100 text-blue-700 border-blue-200",
    dot: "bg-blue-500",
    description: "Revenue from sales, services, rent received, or any other source. When income goes up, profit goes up.",
    subtypes: [],
    subtypeLabels: {},
  },
  {
    value: "Expense",
    label: "Expense — Money GOING OUT",
    color: "bg-orange-100 text-orange-700 border-orange-200",
    dot: "bg-orange-500",
    description: "Costs of running your business: rent, salaries, utilities, materials. When expenses go up, profit goes down.",
    subtypes: [],
    subtypeLabels: {},
  },
];

const LIQUIDITY_OPTIONS = [
  { value: "ShortTerm", label: "Short Term — under 12 months" },
  { value: "MidTerm", label: "Mid Term — 1 to 3 years" },
  { value: "LongTerm", label: "Long Term — more than 3 years" },
];

export default function AccountsPage() {
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [expanded, setExpanded] = useState<string[]>(["Asset", "Income"]);
  const [form, setForm] = useState({ name: "", type: "Asset", subType: "", liquidity: "ShortTerm", balance: 0 });
  const [tooltip, setTooltip] = useState<string | null>(null);

  const load = () => fetch("/api/accounts").then(r => r.json()).then(d => { setAccounts(d); setLoading(false); });
  useEffect(() => { load(); }, []);

  const selectedType = TYPES.find(t => t.value === form.type)!;

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    await fetch("/api/accounts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    setSaving(false);
    setShowForm(false);
    setForm({ name: "", type: "Asset", subType: "", liquidity: "ShortTerm", balance: 0 });
    load();
  };

  const del = async (id: string) => {
    if (!confirm("Delete this account? This cannot be undone.")) return;
    await fetch(`/api/accounts/${id}`, { method: "DELETE" });
    load();
  };

  const toggleSection = (type: string) =>
    setExpanded(prev => prev.includes(type) ? prev.filter(t => t !== type) : [...prev, type]);

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-4">
      <OnboardingCard page="accounts" />

      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <BookOpen className="w-6 h-6 text-blue-600" /> Chart of Accounts
          </h1>
          <div className="flex items-center gap-2 mt-1">
            <p className="text-sm text-gray-500">Your financial filing cabinet — labeled buckets for every type of money.</p>
            <HelpButton page="accounts" />
          </div>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700"
        >
          <Plus className="w-4 h-4" /> New Account
        </button>
      </div>

      {/* Account type legend */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
        {TYPES.map(type => (
          <div key={type.value} className={`rounded-lg border p-2.5 text-xs ${type.color} cursor-help`}
            onClick={() => setTooltip(tooltip === type.value ? null : type.value)}>
            <div className="font-semibold">{type.value}</div>
            <div className="opacity-75 mt-0.5 leading-tight">{type.description.split(".")[0]}</div>
          </div>
        ))}
      </div>

      {/* New account modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-2xl">
            <h2 className="font-semibold text-lg mb-1">Create New Account</h2>
            <p className="text-sm text-gray-500 mb-4">Add a new labeled bucket for tracking money in your business.</p>
            <form onSubmit={save} className="space-y-4">
              {/* Type selector */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Account Type</label>
                <div className="space-y-1.5">
                  {TYPES.map(type => (
                    <button
                      key={type.value}
                      type="button"
                      onClick={() => setForm({ ...form, type: type.value, subType: "" })}
                      className={`w-full text-left px-3 py-2.5 rounded-lg border text-sm transition-all ${form.type === type.value ? type.color + " border-current" : "border-gray-200 hover:border-gray-300"}`}
                    >
                      <div className="font-medium">{type.label}</div>
                      <div className="text-xs opacity-70 mt-0.5">{type.description}</div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Sub-type */}
              {selectedType.subtypes.length > 0 && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Sub-type</label>
                  <select
                    value={form.subType}
                    onChange={e => setForm({ ...form, subType: e.target.value })}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">— Choose a sub-type —</option>
                    {selectedType.subtypes.map(s => (
                      <option key={s} value={s}>{selectedType.subtypeLabels[s as keyof typeof selectedType.subtypeLabels]}</option>
                    ))}
                  </select>
                </div>
              )}

              {/* Liquidity (Asset/Liability only) */}
              {(form.type === "Asset" || form.type === "Liability") && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Time horizon
                    <span className="ml-1 text-xs text-gray-400 font-normal">— How long until this converts to cash or is due?</span>
                  </label>
                  <select
                    value={form.liquidity}
                    onChange={e => setForm({ ...form, liquidity: e.target.value })}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    {LIQUIDITY_OPTIONS.map(l => <option key={l.value} value={l.value}>{l.label}</option>)}
                  </select>
                </div>
              )}

              {/* Name */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Account Name</label>
                <input
                  value={form.name}
                  onChange={e => setForm({ ...form, name: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder={form.type === "Asset" ? "e.g. Jordan Bank Account" : form.type === "Income" ? "e.g. Consulting Revenue" : "e.g. Monthly Rent"}
                  required
                />
              </div>

              {/* Opening balance */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Opening Balance (JOD)
                  <span className="ml-1 text-xs text-gray-400 font-normal">— Current amount in this account right now</span>
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={form.balance}
                  onChange={e => setForm({ ...form, balance: parseFloat(e.target.value) || 0 })}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="flex gap-3 pt-1">
                <button type="button" onClick={() => setShowForm(false)} className="flex-1 border border-gray-300 rounded-lg py-2 text-sm text-gray-600 hover:bg-gray-50">Cancel</button>
                <button type="submit" disabled={saving} className="flex-1 bg-blue-600 text-white rounded-lg py-2 text-sm font-medium hover:bg-blue-700 disabled:opacity-50">
                  {saving ? "Saving…" : "Create Account"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {loading ? (
        <div className="flex justify-center py-12"><div className="animate-spin w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full" /></div>
      ) : (
        <div className="space-y-3">
          {TYPES.map(type => {
            const accs = accounts.filter(a => a.type === type.value);
            const total = accs.reduce((s, a) => s + a.balance, 0);
            const isOpen = expanded.includes(type.value);
            return (
              <div key={type.value} className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                <button
                  onClick={() => toggleSection(type.value)}
                  className="w-full flex items-center justify-between px-5 py-3.5 hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-3 h-3 rounded-full ${type.dot}`} />
                    <span className="font-semibold text-gray-800">{type.label}</span>
                    <span className="text-xs text-gray-400">{accs.length} accounts</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className={`text-sm font-semibold ${["Asset", "Income"].includes(type.value) ? "text-green-700" : type.value === "Expense" ? "text-red-700" : "text-gray-700"}`}>
                      {total.toLocaleString("en", { minimumFractionDigits: 2 })} JOD
                    </span>
                    {isOpen ? <ChevronDown className="w-4 h-4 text-gray-400" /> : <ChevronRight className="w-4 h-4 text-gray-400" />}
                  </div>
                </button>

                {isOpen && (
                  <div className="border-t border-gray-100">
                    {accs.length === 0 ? (
                      <div className="px-5 py-4 text-sm text-gray-400 italic">No accounts yet in this category</div>
                    ) : (
                      <div className="divide-y divide-gray-50">
                        {accs.map(acc => (
                          <div key={acc.id} className="flex items-center justify-between px-5 py-3 hover:bg-gray-50">
                            <div>
                              <div className="text-sm font-medium text-gray-800">{acc.name}</div>
                              <div className="text-xs text-gray-400 flex gap-2 mt-0.5">
                                {acc.subType && <span>{acc.subType}</span>}
                                {acc.liquidity && <span>· {acc.liquidity.replace("Term", " Term")}</span>}
                                {acc.isSystem && <span className="text-blue-400">· Default</span>}
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
                    )}
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
