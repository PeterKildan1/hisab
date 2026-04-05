import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";

export async function GET(req: NextRequest) {
  const user = await getSession(req);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const invoices = await prisma.invoice.findMany({
    where: { userId: user.id },
    include: { items: true },
    orderBy: { date: "desc" },
  });
  return NextResponse.json(invoices);
}

export async function POST(req: NextRequest) {
  const user = await getSession(req);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const data = await req.json();

  // Auto-generate invoice number
  const count = await prisma.invoice.count({ where: { userId: user.id } });
  const number = `INV-${String(count + 1).padStart(4, "0")}`;

  const subtotal = data.items.reduce(
    (sum: number, item: { quantity: number; unitPrice: number }) => sum + item.quantity * item.unitPrice,
    0
  );
  const vatAmount = (subtotal * 16) / 100;
  const total = subtotal + vatAmount;

  const invoice = await prisma.invoice.create({
    data: {
      userId: user.id,
      number,
      customerName: data.customerName,
      customerEmail: data.customerEmail,
      customerPhone: data.customerPhone,
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
          vatRate: 16,
          total: item.quantity * item.unitPrice,
        })),
      },
    },
    include: { items: true },
  });
  return NextResponse.json(invoice);
}
