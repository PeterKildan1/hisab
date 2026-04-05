import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";

export async function GET(req: NextRequest) {
  const user = await getSession(req);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { searchParams } = new URL(req.url);
  const startDate = searchParams.get("start") ? new Date(searchParams.get("start")!) : new Date(new Date().getFullYear(), 0, 1);
  const endDate = searchParams.get("end") ? new Date(searchParams.get("end")!) : new Date();

  const transactions = await prisma.transaction.findMany({
    where: { userId: user.id, date: { gte: startDate, lte: endDate } },
    include: { journalLines: { include: { debitAccount: true, creditAccount: true } } },
  });

  const invoices = await prisma.invoice.findMany({
    where: { userId: user.id, date: { gte: startDate, lte: endDate } },
    include: { items: true },
  });

  const bills = await prisma.bill.findMany({
    where: { userId: user.id, date: { gte: startDate, lte: endDate } },
    include: { items: true },
  });

  // Group income and expenses
  const incomeByAccount: Record<string, number> = {};
  const expenseByAccount: Record<string, number> = {};

  for (const tx of transactions) {
    for (const line of tx.journalLines) {
      if (line.creditAccount?.type === "Income") {
        incomeByAccount[line.creditAccount.name] = (incomeByAccount[line.creditAccount.name] || 0) + line.amount;
      }
      if (line.debitAccount?.type === "Expense") {
        expenseByAccount[line.debitAccount.name] = (expenseByAccount[line.debitAccount.name] || 0) + line.amount;
      }
    }
  }

  // Add invoice subtotals as Sales Revenue
  const invoiceRevenue = invoices.reduce((s, i) => s + i.subtotal, 0);
  if (invoiceRevenue > 0) {
    incomeByAccount["Sales Revenue (Invoices)"] = (incomeByAccount["Sales Revenue (Invoices)"] || 0) + invoiceRevenue;
  }

  // Add bill totals as expenses
  const billExpenses: Record<string, number> = {};
  for (const bill of bills) {
    billExpenses["Supplier Bills"] = (billExpenses["Supplier Bills"] || 0) + bill.subtotal;
  }
  Object.assign(expenseByAccount, billExpenses);

  const totalIncome = Object.values(incomeByAccount).reduce((s, v) => s + v, 0);
  const totalExpenses = Object.values(expenseByAccount).reduce((s, v) => s + v, 0);

  return NextResponse.json({
    period: { start: startDate, end: endDate },
    income: incomeByAccount,
    expenses: expenseByAccount,
    totalIncome,
    totalExpenses,
    grossProfit: totalIncome - totalExpenses,
    netProfit: totalIncome - totalExpenses,
  });
}
