import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";

export async function GET(req: NextRequest) {
  const user = await getSession(req);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const employees = await prisma.employee.findMany({
    where: { userId: user.id },
    include: { salaryPayments: { orderBy: { createdAt: "desc" }, take: 12 } },
    orderBy: { name: "asc" },
  });

  const totalMonthly = employees
    .filter(e => e.active)
    .reduce((s, e) => s + e.monthlySalary, 0);

  return NextResponse.json({ employees, totalMonthly });
}
