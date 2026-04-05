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
    orderBy: { date: "asc" },
  });

  const invoices = await prisma.invoice.findMany({
    where: { userId: user.id, date: { gte: startDate, lte: endDate }, status: "paid" },
    orderBy: { date: "asc" },
  });

  const bills = await prisma.bill.findMany({
    where: { userId: user.id, date: { gte: startDate, lte: endDate }, status: "paid" },
    orderBy: { date: "asc" },
  });

  // Build monthly buckets
  const monthMap: Record<string, { month: string; inflows: number; outflows: number }> = {};

  const getMonthKey = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
  const getMonthLabel = (key: string) => {
    const [y, m] = key.split("-");
    return new Date(parseInt(y), parseInt(m) - 1, 1).toLocaleString("en", { month: "short", year: "2-digit" });
  };

  invoices.forEach(inv => {
    const key = getMonthKey(new Date(inv.date));
    if (!monthMap[key]) monthMap[key] = { month: getMonthLabel(key), inflows: 0, outflows: 0 };
    monthMap[key].inflows += inv.paidAmount;
  });

  bills.forEach(bill => {
    const key = getMonthKey(new Date(bill.date));
    if (!monthMap[key]) monthMap[key] = { month: getMonthLabel(key), inflows: 0, outflows: 0 };
    monthMap[key].outflows += bill.paidAmount;
  });

  const byMonth = Object.values(monthMap).sort((a, b) => a.month.localeCompare(b.month));

  const cashTxItems = transactions.map(tx => {
    let inflow = 0;
    let outflow = 0;
    for (const line of tx.journalLines) {
      if (line.creditAccount?.type === "Income") inflow += line.amount;
      if (line.debitAccount?.type === "Expense") outflow += line.amount;
    }
    return { date: tx.date, description: tx.description, inflow, outflow };
  }).filter(t => t.inflow > 0 || t.outflow > 0);

  const invoiceTxItems = invoices.map(inv => ({
    date: inv.date, description: `Invoice ${inv.number} — ${inv.customerName}`,
    inflow: inv.paidAmount, outflow: 0,
  }));

  const billTxItems = bills.map(bill => ({
    date: bill.date, description: `Bill — ${bill.supplierName}`,
    inflow: 0, outflow: bill.paidAmount,
  }));

  const allTx = [...cashTxItems, ...invoiceTxItems, ...billTxItems]
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  const totalInflows = allTx.reduce((s, t) => s + t.inflow, 0);
  const totalOutflows = allTx.reduce((s, t) => s + t.outflow, 0);

  return NextResponse.json({
    totalInflows, totalOutflows, byMonth, transactions: allTx.slice(0, 100),
  });
}
