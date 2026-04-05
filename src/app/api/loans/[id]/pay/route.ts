import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = await getSession(req);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;
  const { paymentId } = await req.json();

  const loan = await prisma.loan.findFirst({ where: { id, userId: user.id } });
  if (!loan) return NextResponse.json({ error: "Not found" }, { status: 404 });

  await prisma.loanPayment.update({
    where: { id: paymentId },
    data: { status: "paid", paidDate: new Date() },
  });
  return NextResponse.json({ success: true });
}
