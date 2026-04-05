import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";

export async function GET(req: NextRequest) {
  const user = await getSession(req);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const assets = await prisma.fixedAsset.findMany({
    where: { userId: user.id },
    orderBy: { purchaseDate: "desc" },
  });
  return NextResponse.json(assets);
}

export async function POST(req: NextRequest) {
  const user = await getSession(req);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const data = await req.json();
  const asset = await prisma.fixedAsset.create({
    data: {
      userId: user.id,
      name: data.name,
      category: data.category,
      purchasePrice: data.purchasePrice,
      purchaseDate: new Date(data.purchaseDate),
      usefulLifeYears: data.usefulLifeYears,
      residualValue: data.residualValue || 0,
      notes: data.notes,
    },
  });
  return NextResponse.json(asset);
}
