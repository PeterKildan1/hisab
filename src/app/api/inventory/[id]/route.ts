import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = await getSession(req);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;
  const data = await req.json();

  if (data.movement) {
    const { type, quantity, unitCost, reason } = data.movement;
    const item = await prisma.inventoryItem.findFirst({ where: { id, userId: user.id } });
    if (!item) return NextResponse.json({ error: "Not found" }, { status: 404 });
    const newQty = type === "in" ? item.quantity + quantity : item.quantity - quantity;
    await prisma.inventoryItem.update({
      where: { id },
      data: {
        quantity: newQty,
        movements: { create: { type, quantity, unitCost, reason } },
      },
    });
    return NextResponse.json({ success: true });
  }

  await prisma.inventoryItem.updateMany({ where: { id, userId: user.id }, data });
  return NextResponse.json({ success: true });
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = await getSession(req);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;
  await prisma.inventoryItem.deleteMany({ where: { id, userId: user.id } });
  return NextResponse.json({ success: true });
}
