"use client";
import { useEffect, useState } from "react";
import { Plus, Users, CheckCircle, Clock, DollarSign } from "lucide-react";

type SalaryPayment = { id: string; month: string; baseSalary: number; bonus: number; deductions: number; netPaid: number; status: string; paidDate: string | null };
type Employee = { id: string; name: string; jobTitle: string | null; monthlySalary: number; startDate: string; active: boolean; salaryPayments: SalaryPayment[] };

const CURRENT_MONTH = `${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, "0")}`;

export default function EmployeesPage() {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [showPayroll, setShowPayroll] = useState<Employee | null>(null);
  const [form, setForm] = useState({ name: "", jobTitle: "", monthlySalary: 0, startDate: new Date().toISOString().split("T")[0], phone: "", nationalId: "" });
  const [payrollForm, setPayrollForm] = useState({ month: CURRENT_MONTH, bonus: 0, deductions: 0, notes: "" });

  const load = () => fetch("/api/employees").then(r => r.json()).then(d => { setEmployees(d); setLoading(false); });
  useEffect(() => { load(); }, []);

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    await fetch("/api/employees", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(form) });
    setShowForm(false);
    load();
  };

  const runPayroll = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!showPayroll) return;
    await fetch("/api/employees/payroll", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ employeeId: showPayroll.id, ...payrollForm }),
    });
    setShowPayroll(null);
    load();
  };

  const totalPayroll = employees.filter(e => e.active).reduce((s, e) => s + e.monthlySalary, 0);
  const paidThisMonth = employees.filter(e => e.salaryPayments.some(p => p.month === CURRENT_MONTH)).length;

  // Jordan social security estimate: 6.5% employee, 14.25% employer (approximate)
  const getNetSalary = (gross: number) => {
    const socialSecurity = gross * 0.065;
    const taxable = gross - socialSecurity;
    let tax = 0;
    if (taxable > 833) tax = Math.min((taxable - 833), 833) * 0.05;
    if (taxable > 1666) tax += Math.min((taxable - 1666), 833) * 0.10;
    if (taxable > 2499) tax += (taxable - 2499) * 0.15;
    return { net: gross - socialSecurity - tax, socialSecurity, tax };
  };

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2"><Users className="w-6 h-6 text-blue-600" /> Employees & Payroll</h1>
          <p className="text-sm text-gray-500 mt-1">Manage your team, salaries, and monthly payroll. Estimates based on Jordanian tax law.</p>
        </div>
        <button onClick={() => setShowForm(true)} className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700">
          <Plus className="w-4 h-4" /> Add Employee
        </button>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div className="bg-white border border-gray-200 rounded-xl p-4">
          <div className="text-xs text-gray-500 mb-1">Monthly Payroll</div>
          <div className="text-xl font-bold text-gray-800">{totalPayroll.toFixed(2)} JOD</div>
        </div>
        <div className="bg-white border border-gray-200 rounded-xl p-4">
          <div className="text-xs text-gray-500 mb-1">Active Employees</div>
          <div className="text-xl font-bold text-gray-800">{employees.filter(e => e.active).length}</div>
        </div>
        <div className={`border rounded-xl p-4 ${paidThisMonth < employees.filter(e => e.active).length ? "bg-amber-50 border-amber-200" : "bg-green-50 border-green-200"}`}>
          <div className="text-xs text-gray-500 mb-1">Paid This Month</div>
          <div className={`text-xl font-bold ${paidThisMonth < employees.filter(e => e.active).length ? "text-amber-700" : "text-green-700"}`}>
            {paidThisMonth} / {employees.filter(e => e.active).length}
          </div>
        </div>
      </div>

      <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 text-sm text-blue-800">
        <strong>Jordan Payroll Note:</strong> Estimates include ~6.5% employee social security deduction. Income tax is calculated on a monthly progressive scale. Employer social security contribution is ~14.25%. These are estimates — consult an accountant for exact figures.
      </div>

      {showForm && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-2xl">
            <h2 className="font-semibold text-lg mb-4">Add Employee</h2>
            <form onSubmit={save} className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
                <input value={form.name} onChange={e => setForm({...form, name: e.target.value})}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" required />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Job Title</label>
                  <input value={form.jobTitle} onChange={e => setForm({...form, jobTitle: e.target.value})}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Monthly Salary (JOD)</label>
                  <input type="number" step="0.01" min="0" value={form.monthlySalary} onChange={e => setForm({...form, monthlySalary: parseFloat(e.target.value) || 0})}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" required />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Start Date</label>
                  <input type="date" value={form.startDate} onChange={e => setForm({...form, startDate: e.target.value})}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" required />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
                  <input value={form.phone} onChange={e => setForm({...form, phone: e.target.value})}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                </div>
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowForm(false)} className="flex-1 border border-gray-300 rounded-lg py-2 text-sm">Cancel</button>
                <button type="submit" className="flex-1 bg-blue-600 text-white rounded-lg py-2 text-sm font-medium hover:bg-blue-700">Add Employee</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showPayroll && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-sm shadow-2xl">
            <h2 className="font-semibold text-lg mb-1">Pay Salary</h2>
            <p className="text-sm text-gray-500 mb-4">{showPayroll.name} — Base: {showPayroll.monthlySalary.toFixed(2)} JOD/mo</p>
            {(() => {
              const { net, socialSecurity, tax } = getNetSalary(showPayroll.monthlySalary + payrollForm.bonus - payrollForm.deductions);
              return (
                <div className="bg-gray-50 rounded-lg p-3 text-xs space-y-1 mb-4">
                  <div className="flex justify-between"><span>Gross</span><span>{(showPayroll.monthlySalary + payrollForm.bonus - payrollForm.deductions).toFixed(2)} JOD</span></div>
                  <div className="flex justify-between text-red-600"><span>Social Security (6.5%)</span><span>-{socialSecurity.toFixed(2)} JOD</span></div>
                  <div className="flex justify-between text-red-600"><span>Income Tax (est.)</span><span>-{tax.toFixed(2)} JOD</span></div>
                  <div className="flex justify-between font-bold border-t pt-1"><span>Net to Employee</span><span>{net.toFixed(2)} JOD</span></div>
                </div>
              );
            })()}
            <form onSubmit={runPayroll} className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Bonus (JOD)</label>
                  <input type="number" step="0.01" min="0" value={payrollForm.bonus} onChange={e => setPayrollForm({...payrollForm, bonus: parseFloat(e.target.value) || 0})}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Deductions (JOD)</label>
                  <input type="number" step="0.01" min="0" value={payrollForm.deductions} onChange={e => setPayrollForm({...payrollForm, deductions: parseFloat(e.target.value) || 0})}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                </div>
              </div>
              <div className="flex gap-3">
                <button type="button" onClick={() => setShowPayroll(null)} className="flex-1 border border-gray-300 rounded-lg py-2 text-sm">Cancel</button>
                <button type="submit" className="flex-1 bg-green-600 text-white rounded-lg py-2 text-sm font-medium hover:bg-green-700">Confirm Payment</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {loading ? (
        <div className="flex justify-center py-12"><div className="animate-spin w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full" /></div>
      ) : (
        <div className="grid gap-4">
          {employees.length === 0 ? (
            <div className="bg-white rounded-xl border border-gray-200 text-center py-12 text-gray-400">
              <Users className="w-12 h-12 mx-auto mb-3 opacity-30" /><p>No employees added yet</p>
            </div>
          ) : employees.map(emp => {
            const paidThisMonthEmp = emp.salaryPayments.some(p => p.month === CURRENT_MONTH);
            const { net } = getNetSalary(emp.monthlySalary);
            return (
              <div key={emp.id} className="bg-white rounded-xl border border-gray-200 p-5 flex items-center justify-between">
                <div>
                  <div className="font-semibold text-gray-800">{emp.name}</div>
                  <div className="text-sm text-gray-500">{emp.jobTitle || "Employee"}</div>
                  <div className="text-xs text-gray-400 mt-1">
                    Gross: {emp.monthlySalary.toFixed(2)} JOD · Net est: {net.toFixed(2)} JOD · Since {new Date(emp.startDate).getFullYear()}
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  {paidThisMonthEmp ? (
                    <span className="flex items-center gap-1 text-xs text-green-600 bg-green-50 px-2 py-1 rounded-full">
                      <CheckCircle className="w-3 h-3" /> Paid
                    </span>
                  ) : (
                    <span className="flex items-center gap-1 text-xs text-amber-600 bg-amber-50 px-2 py-1 rounded-full">
                      <Clock className="w-3 h-3" /> Unpaid
                    </span>
                  )}
                  {!paidThisMonthEmp && (
                    <button onClick={() => { setShowPayroll(emp); setPayrollForm({ month: CURRENT_MONTH, bonus: 0, deductions: 0, notes: "" }); }}
                      className="flex items-center gap-1 text-xs bg-blue-600 text-white px-3 py-1.5 rounded-lg hover:bg-blue-700">
                      <DollarSign className="w-3 h-3" /> Pay
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
