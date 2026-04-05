import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";

export async function GET(req: NextRequest) {
  const user = await getSession(req);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  return NextResponse.json({
    id: user.id,
    email: user.email,
    businessName: user.businessName,
    ownerName: user.ownerName,
    phone: user.phone,
    language: user.language,
    accountType: user.accountType,
    logoUrl: user.logoUrl,
  });
}

export async function PATCH(req: NextRequest) {
  const user = await getSession(req);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { prisma } = await import("@/lib/prisma");
  const data = await req.json();
  const allowed = ["businessName", "ownerName", "phone", "language", "accountType", "logoUrl"];
  const update: Record<string, string> = {};
  for (const key of allowed) {
    if (data[key] !== undefined) update[key] = data[key];
  }
  const updated = await prisma.user.update({ where: { id: user.id }, data: update });
  return NextResponse.json({ success: true, accountType: updated.accountType });
}
