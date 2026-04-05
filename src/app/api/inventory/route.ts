import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";

export async function GET(req: NextRequest) {
  const user = await getSession(req);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const items = await prisma.inventoryItem.findMany({
    where: { userId: user.id },
    include: { movements: { orderBy: { date: "desc" }, take: 10 } },
    orderBy: { name: "asc" },
  });
  return NextResponse.json(items);
}

export async function POST(req: NextRequest) {
  const user = await getSession(req);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const data = await req.json();
  const item = await prisma.inventoryItem.create({
    data: {
      userId: user.id,
      name: data.name,
      sku: data.sku,
      quantity: data.quantity || 0,
      unitCost: data.unitCost,
      sellingPrice: data.sellingPrice,
      reorderLevel: data.reorderLevel || 0,
      movements: data.quantity > 0 ? {
        create: {
          type: "in",
          quantity: data.quantity,
          unitCost: data.unitCost,
          reason: "Opening stock",
        },
      } : undefined,
    },
  });
  return NextResponse.json(item);
}
