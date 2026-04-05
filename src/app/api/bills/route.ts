import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";

export async function GET(req: NextRequest) {
  const user = await getSession(req);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const bills = await prisma.bill.findMany({
    where: { userId: user.id },
    include: { items: true },
    orderBy: { date: "desc" },
  });
  return NextResponse.json(bills);
}

export async function POST(req: NextRequest) {
  const user = await getSession(req);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const data = await req.json();

  const subtotal = data.items.reduce(
    (sum: number, item: { quantity: number; unitPrice: number }) => sum + item.quantity * item.unitPrice,
    0
  );
  const vatAmount = data.includeVat ? (subtotal * 16) / 100 : 0;
  const total = subtotal + vatAmount;

  const bill = await prisma.bill.create({
    data: {
      userId: user.id,
      number: data.number,
      supplierName: data.supplierName,
      date: new Date(data.date),
      dueDate: new Date(data.dueDate),
      subtotal,
      vatAmount,
      total,
      notes: data.notes,
      items: {
        create: data.items.map((item: { description: string; quantity: number; unitPrice: number }) => ({
          description: item.description,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          total: item.quantity * item.unitPrice,
        })),
      },
    },
    include: { items: true },
  });
  return NextResponse.json(bill);
}
