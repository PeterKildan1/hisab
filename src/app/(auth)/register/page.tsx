"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Building2, User, Briefcase, Heart, Check } from "lucide-react";

const ACCOUNT_TYPES = [
  {
    id: "SmallBusiness",
    label: "Small Business",
    icon: Building2,
    description: "Full accounting suite: invoices, payroll, inventory, loans, VAT",
    color: "blue",
  },
  {
    id: "Freelancer",
    label: "Freelancer",
    icon: Briefcase,
    description: "Track project income, client invoices, expenses, and estimated tax",
    color: "purple",
  },
  {
    id: "Personal",
    label: "Personal",
    icon: User,
    description: "Budget tracking, savings goals, personal loans, spending categories",
    color: "green",
  },
  {
    id: "Nonprofit",
    label: "Nonprofit",
    icon: Heart,
    description: "Donations, grants, program expenses, donor management",
    color: "rose",
  },
];

const colorMap: Record<string, string> = {
  blue: "border-blue-500 bg-blue-50 text-blue-700",
  purple: "border-purple-500 bg-purple-50 text-purple-700",
  green: "border-green-500 bg-green-50 text-green-700",
  rose: "border-rose-500 bg-rose-50 text-rose-700",
};

export default function RegisterPage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [form, setForm] = useState({
    email: "", password: "", businessName: "", ownerName: "",
    phone: "", accountType: "SmallBusiness",
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    const res = await fetch("/api/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    const data = await res.json();
    if (!res.ok) {
      setError(data.error || "Registration failed");
      setLoading(false);
    } else {
      router.push("/dashboard");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <div className="w-full max-w-lg">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-blue-600 text-white text-2xl font-bold mb-4">ح</div>
          <h1 className="text-3xl font-bold text-gray-900">Hisab</h1>
          <p className="text-gray-500 mt-1">حساب — Your AI Accounting Assistant</p>
        </div>

        <div className="bg-white rounded-2xl shadow-xl p-8">
          {/* Step indicator */}
          <div className="flex items-center gap-2 mb-6">
            {[1, 2].map(s => (
              <div key={s} className="flex items-center gap-2 flex-1">
                <div className={`w-7 h-7 rounded-full flex items-center justify-center text-sm font-bold transition-colors ${step >= s ? "bg-blue-600 text-white" : "bg-gray-100 text-gray-400"}`}>
                  {step > s ? <Check className="w-4 h-4" /> : s}
                </div>
                <div className={`text-xs font-medium ${step >= s ? "text-blue-600" : "text-gray-400"}`}>
                  {s === 1 ? "Account Type" : "Your Details"}
                </div>
                {s < 2 && <div className="flex-1 h-px bg-gray-200 mx-1" />}
              </div>
            ))}
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg p-3 mb-4 text-sm">{error}</div>
          )}

          {step === 1 && (
            <div>
              <h2 className="text-lg font-semibold text-gray-800 mb-1">What type of account do you need?</h2>
              <p className="text-sm text-gray-500 mb-5">You can change this later in settings.</p>
              <div className="grid grid-cols-2 gap-3">
                {ACCOUNT_TYPES.map(type => {
                  const Icon = type.icon;
                  const selected = form.accountType === type.id;
                  return (
                    <button
                      key={type.id}
                      type="button"
                      onClick={() => setForm({ ...form, accountType: type.id })}
                      className={`p-4 rounded-xl border-2 text-left transition-all ${selected ? colorMap[type.color] + " border-2" : "border-gray-200 hover:border-gray-300 bg-white"}`}
                    >
                      <div className="flex items-center gap-2 mb-2">
                        <Icon className={`w-5 h-5 ${selected ? "" : "text-gray-500"}`} />
                        <span className="font-semibold text-sm">{type.label}</span>
                        {selected && <Check className="w-3.5 h-3.5 ml-auto" />}
                      </div>
                      <p className={`text-xs leading-tight ${selected ? "opacity-80" : "text-gray-500"}`}>{type.description}</p>
                    </button>
                  );
                })}
              </div>
              <button
                type="button"
                onClick={() => setStep(2)}
                className="mt-5 w-full bg-blue-600 text-white py-2.5 rounded-lg font-semibold hover:bg-blue-700 transition-colors"
              >
                Continue →
              </button>
            </div>
          )}

          {step === 2 && (
            <form onSubmit={handleSubmit} className="space-y-4">
              <h2 className="text-lg font-semibold text-gray-800 mb-3">Your details</h2>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {form.accountType === "Personal" ? "Your Name" : "Business Name"}
                </label>
                <input
                  value={form.businessName}
                  onChange={e => setForm({ ...form, businessName: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder={form.accountType === "Personal" ? "Ahmad Al-Hassan" : "Jordan Trading Co."}
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Your Full Name</label>
                <input
                  value={form.ownerName}
                  onChange={e => setForm({ ...form, ownerName: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                <input
                  type="email"
                  value={form.email}
                  onChange={e => setForm({ ...form, email: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Phone (optional)</label>
                <input
                  type="tel"
                  value={form.phone}
                  onChange={e => setForm({ ...form, phone: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="+962 7x xxx xxxx"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
                <input
                  type="password"
                  value={form.password}
                  onChange={e => setForm({ ...form, password: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  minLength={8}
                  required
                />
              </div>
              <div className="flex gap-3 pt-1">
                <button type="button" onClick={() => setStep(1)} className="flex-1 border border-gray-300 rounded-lg py-2.5 text-sm text-gray-600 hover:bg-gray-50">← Back</button>
                <button type="submit" disabled={loading} className="flex-1 bg-blue-600 text-white rounded-lg py-2.5 font-semibold hover:bg-blue-700 disabled:opacity-50">
                  {loading ? "Creating…" : "Create Account"}
                </button>
              </div>
            </form>
          )}

          <p className="text-center text-sm text-gray-500 mt-5">
            Already have an account?{" "}
            <Link href="/login" className="text-blue-600 hover:underline font-medium">Sign in</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
