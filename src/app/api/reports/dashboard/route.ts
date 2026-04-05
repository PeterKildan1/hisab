import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";

export async function GET(req: NextRequest) {
  const user = await getSession(req);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);
  const thirtyDaysLater = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

  const [accounts, invoices, bills, loans, inventoryItems, employees] = await Promise.all([
    prisma.account.findMany({ where: { userId: user.id } }),
    prisma.invoice.findMany({ where: { userId: user.id } }),
    prisma.bill.findMany({ where: { userId: user.id } }),
    prisma.loan.findMany({
      where: { userId: user.id },
      include: { payments: { where: { status: "pending" } } },
    }),
    prisma.inventoryItem.findMany({ where: { userId: user.id } }),
    prisma.employee.findMany({ where: { userId: user.id }, include: { salaryPayments: { where: { month: `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}` } } } }),
  ]);

  // Monthly P&L from transactions
  const monthTransactions = await prisma.transaction.findMany({
    where: { userId: user.id, date: { gte: monthStart, lte: monthEnd } },
    include: { journalLines: { include: { debitAccount: true, creditAccount: true } } },
  });

  // Calculate monthly income and expenses from journal lines
  let monthlyIncome = 0;
  let monthlyExpenses = 0;
  for (const tx of monthTransactions) {
    for (const line of tx.journalLines) {
      if (line.creditAccount?.type === "Income") monthlyIncome += line.amount;
      if (line.debitAccount?.type === "Expense") monthlyExpenses += line.amount;
    }
  }

  // Also include invoice payments as income
  const paidInvoicesThisMonth = invoices.filter(i => {
    const d = new Date(i.date);
    return d >= monthStart && d <= monthEnd && (i.status === "paid" || i.paidAmount > 0);
  });
  const invoiceIncome = paidInvoicesThisMonth.reduce((s, i) => s + i.paidAmount, 0);

  const cashAccounts = accounts.filter(a => a.subType === "Cash");
  const cashPosition = cashAccounts.reduce((s, a) => s + a.balance, 0);

  const outstandingReceivables = invoices
    .filter(i => i.status !== "paid")
    .reduce((s, i) => s + (i.total - i.paidAmount), 0);

  const outstandingPayables = bills
    .filter(b => b.status !== "paid")
    .reduce((s, b) => s + (b.total - b.paidAmount), 0);

  const upcomingPayments = [
    ...bills
      .filter(b => b.status !== "paid" && new Date(b.dueDate) <= thirtyDaysLater)
      .map(b => ({ type: "bill", name: b.supplierName, amount: b.total - b.paidAmount, dueDate: b.dueDate })),
    ...loans.flatMap(l =>
      l.payments
        .filter(p => new Date(p.dueDate) <= thirtyDaysLater)
        .map(p => ({ type: "loan", name: l.lenderName, amount: p.amount, dueDate: p.dueDate }))
    ),
  ].sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime());

  // VAT this quarter
  const vatOnSales = invoices
    .filter(i => { const d = new Date(i.date); return d >= monthStart; })
    .reduce((s, i) => s + i.vatAmount, 0);
  const vatOnPurchases = bills
    .filter(b => { const d = new Date(b.date); return d >= monthStart; })
    .reduce((s, b) => s + b.vatAmount, 0);

  // Alerts
  const alerts = [];
  const overdueInvoices = invoices.filter(i => i.status !== "paid" && new Date(i.dueDate) < now);
  if (overdueInvoices.length > 0) {
    alerts.push({ type: "warning", message: `${overdueInvoices.length} overdue invoice(s) totaling ${overdueInvoices.reduce((s, i) => s + (i.total - i.paidAmount), 0).toFixed(2)} JOD` });
  }
  const lowStock = inventoryItems.filter(i => i.quantity <= i.reorderLevel);
  if (lowStock.length > 0) {
    alerts.push({ type: "warning", message: `${lowStock.length} inventory item(s) low on stock` });
  }
  const unpaidEmployees = employees.filter(e => e.salaryPayments.length === 0 && e.active);
  if (unpaidEmployees.length > 0) {
    alerts.push({ type: "info", message: `${unpaidEmployees.length} employee(s) not yet paid this month` });
  }

  // 6-month chart data
  const chartData = [];
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const start = new Date(d.getFullYear(), d.getMonth(), 1);
    const end = new Date(d.getFullYear(), d.getMonth() + 1, 0, 23, 59, 59);
    const txs = await prisma.transaction.findMany({
      where: { userId: user.id, date: { gte: start, lte: end } },
      include: { journalLines: { include: { debitAccount: true, creditAccount: true } } },
    });
    let inc = 0, exp = 0;
    for (const tx of txs) {
      for (const line of tx.journalLines) {
        if (line.creditAccount?.type === "Income") inc += line.amount;
        if (line.debitAccount?.type === "Expense") exp += line.amount;
      }
    }
    // Add invoice income
    const invInc = invoices.filter(inv => {
      const d2 = new Date(inv.date);
      return d2 >= start && d2 <= end;
    }).reduce((s, inv) => s + inv.subtotal, 0);

    chartData.push({
      month: d.toLocaleString("en", { month: "short" }),
      income: inc + invInc,
      expenses: exp,
    });
  }

  // Expense breakdown
  const expenseAccounts = accounts.filter(a => a.type === "Expense");
  const expenseBreakdown = expenseAccounts
    .filter(a => a.balance > 0)
    .map(a => ({ name: a.name, value: a.balance }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 8);

  return NextResponse.json({
    monthlyIncome: monthlyIncome + invoiceIncome,
    monthlyExpenses,
    netProfit: monthlyIncome + invoiceIncome - monthlyExpenses,
    cashPosition,
    outstandingReceivables,
    outstandingPayables,
    vatOwed: Math.max(0, vatOnSales - vatOnPurchases),
    upcomingPayments,
    alerts,
    chartData,
    expenseBreakdown,
  });
}
