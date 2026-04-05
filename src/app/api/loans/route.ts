import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { calculateLoanSchedule } from "@/lib/utils";

export async function GET(req: NextRequest) {
  const user = await getSession(req);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const loans = await prisma.loan.findMany({
    where: { userId: user.id },
    include: { payments: { orderBy: { dueDate: "asc" } } },
    orderBy: { startDate: "desc" },
  });
  return NextResponse.json(loans);
}

export async function POST(req: NextRequest) {
  const user = await getSession(req);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const data = await req.json();

  const schedule = calculateLoanSchedule(
    data.amount,
    data.interestRate,
    data.termMonths,
    new Date(data.startDate)
  );

  const loan = await prisma.loan.create({
    data: {
      userId: user.id,
      lenderName: data.lenderName,
      amount: data.amount,
      interestRate: data.interestRate,
      startDate: new Date(data.startDate),
      termMonths: data.termMonths,
      liquidity: data.liquidity || "LongTerm",
      notes: data.notes,
      payments: {
        create: schedule.map((s) => ({
          dueDate: s.dueDate,
          amount: s.payment,
          principal: s.principal,
          interest: s.interest,
        })),
      },
    },
    include: { payments: { orderBy: { dueDate: "asc" } } },
  });
  return NextResponse.json(loan);
}
