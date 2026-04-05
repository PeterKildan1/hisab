import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";

function ageBucket(daysOverdue: number): string {
  if (daysOverdue <= 0) return "Current";
  if (daysOverdue <= 30) return "1-30 days";
  if (daysOverdue <= 60) return "31-60 days";
  if (daysOverdue <= 90) return "61-90 days";
  return "90+ days";
}

export async function GET(req: NextRequest) {
  const user = await getSession(req);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const invoices = await prisma.invoice.findMany({
    where: { userId: user.id, status: { not: "paid" } },
    orderBy: { dueDate: "asc" },
  });

  const now = new Date();
  const items = invoices.map(inv => {
    const daysOverdue = Math.floor((now.getTime() - new Date(inv.dueDate).getTime()) / (1000 * 60 * 60 * 24));
    const outstanding = inv.total - inv.paidAmount;
    const bucket = ageBucket(daysOverdue);
    return { ...inv, daysOverdue, outstanding, bucket };
  });

  const buckets: Record<string, number> = {
    "Current": 0, "1-30 days": 0, "31-60 days": 0, "61-90 days": 0, "90+ days": 0,
  };
  items.forEach(i => { buckets[i.bucket] = (buckets[i.bucket] || 0) + i.outstanding; });

  const total = items.reduce((s, i) => s + i.outstanding, 0);
  return NextResponse.json({ items, buckets, total });
}
