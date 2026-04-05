"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutDashboard, BookOpen, ArrowLeftRight, FileText, Receipt,
  Package, Users, CreditCard, Building2, Calculator, BarChart3,
  Bot, LogOut, Menu, ChevronRight, Settings, PiggyBank, Target
} from "lucide-react";
import { useUser } from "@/lib/useUser";

type NavItem = { href: string; label: string; icon: React.ElementType; types?: string[] };

const ALL_NAV: NavItem[] = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/accounts", label: "Chart of Accounts", icon: BookOpen, types: ["SmallBusiness", "Freelancer", "Nonprofit"] },
  { href: "/transactions", label: "Transactions", icon: ArrowLeftRight },
  { href: "/invoices", label: "Invoices", icon: FileText, types: ["SmallBusiness", "Freelancer"] },
  { href: "/bills", label: "Bills & Payables", icon: Receipt, types: ["SmallBusiness", "Nonprofit"] },
  { href: "/inventory", label: "Inventory", icon: Package, types: ["SmallBusiness"] },
  { href: "/employees", label: "Employees & Payroll", icon: Users, types: ["SmallBusiness", "Nonprofit"] },
  { href: "/loans", label: "Loans & Financing", icon: CreditCard, types: ["SmallBusiness", "Personal", "Freelancer"] },
  { href: "/assets", label: "Fixed Assets", icon: Building2, types: ["SmallBusiness"] },
  { href: "/vat", label: "VAT Management", icon: Calculator, types: ["SmallBusiness", "Freelancer"] },
  { href: "/reports", label: "Reports", icon: BarChart3 },
  { href: "/ai-assistant", label: "AI Assistant", icon: Bot },
  { href: "/settings", label: "Settings", icon: Settings },
];

const TYPE_LABELS: Record<string, string> = {
  SmallBusiness: "Small Business",
  Freelancer: "Freelancer",
  Personal: "Personal",
  Nonprofit: "Nonprofit",
};

const TYPE_COLORS: Record<string, string> = {
  SmallBusiness: "bg-blue-600",
  Freelancer: "bg-purple-600",
  Personal: "bg-green-600",
  Nonprofit: "bg-rose-600",
};

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { user } = useUser();
  const accountType = user?.accountType || "SmallBusiness";

  const nav = ALL_NAV.filter(item => !item.types || item.types.includes(accountType));

  const handleLogout = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
  };

  const Sidebar = () => (
    <div className="flex flex-col h-full">
      {/* Logo */}
      <div className="flex items-center gap-3 px-5 py-4 border-b border-gray-200">
        <div className={`w-9 h-9 rounded-xl ${TYPE_COLORS[accountType] || "bg-blue-600"} flex items-center justify-center text-white font-bold text-lg`}>
          ح
        </div>
        <div>
          <div className="font-bold text-gray-900 leading-tight">Hisab</div>
          <div className="text-xs text-gray-400">حساب</div>
        </div>
      </div>

      {/* User info */}
      {user && (
        <div className="px-4 py-3 border-b border-gray-100 bg-gray-50">
          <div className="text-xs font-medium text-gray-500 truncate">{user.businessName}</div>
          <div className="text-xs text-gray-400 mt-0.5">{user.ownerName}</div>
          <span className={`inline-block mt-1 text-xs px-2 py-0.5 rounded-full text-white ${TYPE_COLORS[accountType]}`}>
            {TYPE_LABELS[accountType]}
          </span>
        </div>
      )}

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto py-2 px-2">
        {nav.map(({ href, label, icon: Icon }) => {
          const active = pathname === href;
          return (
            <Link
              key={href}
              href={href}
              onClick={() => setSidebarOpen(false)}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg mb-0.5 text-sm font-medium transition-colors ${
                active ? `${TYPE_COLORS[accountType]} text-white` : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
              }`}
            >
              <Icon className="w-4 h-4 flex-shrink-0" />
              <span className="flex-1">{label}</span>
              {active && <ChevronRight className="w-3 h-3 opacity-60" />}
            </Link>
          );
        })}
      </nav>

      {/* Logout */}
      <div className="p-3 border-t border-gray-200">
        <button
          onClick={handleLogout}
          className="flex items-center gap-2 w-full px-3 py-2 text-sm text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
        >
          <LogOut className="w-4 h-4" />
          Sign Out
        </button>
      </div>
    </div>
  );

  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden">
      {/* Desktop sidebar */}
      <div className="hidden md:flex w-60 flex-col bg-white border-r border-gray-200 flex-shrink-0">
        <Sidebar />
      </div>

      {/* Mobile overlay */}
      {sidebarOpen && (
        <div className="md:hidden fixed inset-0 z-40">
          <div className="absolute inset-0 bg-black/50" onClick={() => setSidebarOpen(false)} />
          <div className="absolute left-0 top-0 bottom-0 w-64 bg-white shadow-2xl">
            <Sidebar />
          </div>
        </div>
      )}

      {/* Main content */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Mobile header */}
        <div className="md:hidden flex items-center justify-between px-4 py-3 bg-white border-b border-gray-200">
          <button onClick={() => setSidebarOpen(true)} className="p-1.5 rounded-lg hover:bg-gray-100">
            <Menu className="w-5 h-5" />
          </button>
          <div className="font-bold text-gray-900">Hisab</div>
          <div className="w-8" />
        </div>

        <main className="flex-1 overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
