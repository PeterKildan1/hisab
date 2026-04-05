"use client";
import { useEffect, useState } from "react";
import { Settings, Building2, User, Briefcase, Heart, Check, Save } from "lucide-react";
import { useUser } from "@/lib/useUser";
import { resetOnboarding } from "@/lib/onboarding";

const ACCOUNT_TYPES = [
  { id: "SmallBusiness", label: "Small Business", icon: Building2, color: "blue", desc: "Full accounting: invoices, payroll, inventory, VAT, loans" },
  { id: "Freelancer", label: "Freelancer", icon: Briefcase, color: "purple", desc: "Project income, client invoices, business expenses, estimated tax" },
  { id: "Personal", label: "Personal", icon: User, color: "green", desc: "Budget tracking, savings goals, personal loans" },
  { id: "Nonprofit", label: "Nonprofit", icon: Heart, color: "rose", desc: "Donations, grants, program expenses, donor management" },
];

const colorActive: Record<string, string> = {
  blue: "border-blue-500 bg-blue-50",
  purple: "border-purple-500 bg-purple-50",
  green: "border-green-500 bg-green-50",
  rose: "border-rose-500 bg-rose-50",
};

export default function SettingsPage() {
  const { user, refresh } = useUser();
  const [form, setForm] = useState({ businessName: "", ownerName: "", phone: "", accountType: "SmallBusiness" });
  const [saved, setSaved] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (user) {
      setForm({
        businessName: user.businessName,
        ownerName: user.ownerName,
        phone: user.phone || "",
        accountType: user.accountType,
      });
    }
  }, [user]);

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    await fetch("/api/auth/me", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    refresh();
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  return (
    <div className="p-6 max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
          <Settings className="w-6 h-6 text-blue-600" /> Settings
        </h1>
        <p className="text-sm text-gray-500 mt-1">Manage your account, business details, and preferences.</p>
      </div>

      <form onSubmit={save} className="space-y-6">
        {/* Business details */}
        <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-4">
          <h2 className="font-semibold text-gray-800">Business Details</h2>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Business Name</label>
            <input value={form.businessName} onChange={e => setForm({ ...form, businessName: e.target.value })}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" required />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Your Name</label>
            <input value={form.ownerName} onChange={e => setForm({ ...form, ownerName: e.target.value })}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" required />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
            <input value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="+962 7x xxx xxxx" />
          </div>
        </div>

        {/* Account type */}
        <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-4">
          <div>
            <h2 className="font-semibold text-gray-800">Account Type</h2>
            <p className="text-sm text-gray-500 mt-0.5">This changes which sections appear in the sidebar and which dashboard you see.</p>
          </div>
          <div className="grid grid-cols-2 gap-3">
            {ACCOUNT_TYPES.map(type => {
              const Icon = type.icon;
              const selected = form.accountType === type.id;
              return (
                <button key={type.id} type="button" onClick={() => setForm({ ...form, accountType: type.id })}
                  className={`p-4 rounded-xl border-2 text-left transition-all ${selected ? colorActive[type.color] : "border-gray-200 bg-white hover:border-gray-300"}`}>
                  <div className="flex items-center gap-2 mb-1">
                    <Icon className="w-4 h-4 text-gray-600" />
                    <span className="font-semibold text-sm">{type.label}</span>
                    {selected && <Check className="w-3.5 h-3.5 ml-auto text-blue-600" />}
                  </div>
                  <p className="text-xs text-gray-500 leading-tight">{type.desc}</p>
                </button>
              );
            })}
          </div>
        </div>

        {/* Onboarding */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h2 className="font-semibold text-gray-800 mb-1">Help & Onboarding</h2>
          <p className="text-sm text-gray-500 mb-4">Reset the page introduction cards if you want to see them again.</p>
          <button type="button" onClick={() => { resetOnboarding(); alert("Onboarding cards reset. Refresh any page to see them again."); }}
            className="border border-gray-300 text-gray-700 px-4 py-2 rounded-lg text-sm hover:bg-gray-50 transition-colors">
            Reset All Introduction Cards
          </button>
        </div>

        <button type="submit" disabled={saving}
          className="w-full flex items-center justify-center gap-2 bg-blue-600 text-white py-2.5 rounded-xl font-semibold hover:bg-blue-700 disabled:opacity-50 transition-colors">
          {saved ? <><Check className="w-4 h-4" /> Saved!</> : saving ? "Saving…" : <><Save className="w-4 h-4" /> Save Changes</>}
        </button>
      </form>
    </div>
  );
}
