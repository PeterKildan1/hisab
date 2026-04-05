import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";

export async function GET(req: NextRequest) {
  const user = await getSession(req);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { searchParams } = new URL(req.url);
  const search = searchParams.get("search") || "";
  const startDate = searchParams.get("startDate");
  const endDate = searchParams.get("endDate");

  const transactions = await prisma.transaction.findMany({
    where: {
      userId: user.id,
      ...(search && { description: { contains: search } }),
      ...(startDate && endDate && {
        date: { gte: new Date(startDate), lte: new Date(endDate) },
      }),
    },
    include: {
      journalLines: {
        include: {
          debitAccount: true,
          creditAccount: true,
        },
      },
    },
    orderBy: { date: "desc" },
    take: 200,
  });
  return NextResponse.json(transactions);
}

export async function POST(req: NextRequest) {
  const user = await getSession(req);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { date, description, reference, receiptUrl, lines } = await req.json();

  const transaction = await prisma.transaction.create({
    data: {
      userId: user.id,
      date: new Date(date),
      description,
      reference,
      receiptUrl,
      journalLines: {
        create: lines.map((l: { debitAccountId?: string; creditAccountId?: string; amount: number; description?: string }) => ({
          debitAccountId: l.debitAccountId || null,
          creditAccountId: l.creditAccountId || null,
          amount: l.amount,
          description: l.description,
        })),
      },
    },
    include: {
      journalLines: { include: { debitAccount: true, creditAccount: true } },
    },
  });

  // Update account balances
  for (const line of lines as Array<{ debitAccountId?: string; creditAccountId?: string; amount: number }>) {
    if (line.debitAccountId) {
      const acc = await prisma.account.findUnique({ where: { id: line.debitAccountId } });
      if (acc) {
        const delta = ["Asset", "Expense"].includes(acc.type) ? line.amount : -line.amount;
        await prisma.account.update({
          where: { id: line.debitAccountId },
          data: { balance: { increment: delta } },
        });
      }
    }
    if (line.creditAccountId) {
      const acc = await prisma.account.findUnique({ where: { id: line.creditAccountId } });
      if (acc) {
        const delta = ["Liability", "Equity", "Income"].includes(acc.type) ? line.amount : -line.amount;
        await prisma.account.update({
          where: { id: line.creditAccountId },
          data: { balance: { increment: delta } },
        });
      }
    }
  }

  return NextResponse.json(transaction);
}
