import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";

export async function GET(req: NextRequest) {
  const user = await getSession(req);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { searchParams } = new URL(req.url);
  const quarter = searchParams.get("quarter") || "";

  // Parse quarter
  const match = quarter.match(/^(\d{4})-Q(\d)$/);
  if (!match) return NextResponse.json({ error: "Invalid quarter" }, { status: 400 });
  const year = parseInt(match[1]);
  const q = parseInt(match[2]);
  const startMonth = (q - 1) * 3;
  const startDate = new Date(year, startMonth, 1);
  const endDate = new Date(year, startMonth + 3, 0, 23, 59, 59);

  const [invoices, bills] = await Promise.all([
    prisma.invoice.findMany({
      where: { userId: user.id, date: { gte: startDate, lte: endDate } },
      select: { number: true, customerName: true, date: true, subtotal: true, vatAmount: true, total: true, status: true },
    }),
    prisma.bill.findMany({
      where: { userId: user.id, date: { gte: startDate, lte: endDate }, vatAmount: { gt: 0 } },
      select: { supplierName: true, date: true, subtotal: true, vatAmount: true },
    }),
  ]);

  const vatOnSales = invoices.reduce((s, i) => s + i.vatAmount, 0);
  const vatOnPurchases = bills.reduce((s, b) => s + b.vatAmount, 0);
  const netVAT = vatOnSales - vatOnPurchases;

  return NextResponse.json({ vatOnSales, vatOnPurchases, netVAT, invoices, bills });
}
