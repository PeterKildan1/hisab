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
  return NextResponse.json(employees);
}

export async function POST(req: NextRequest) {
  const user = await getSession(req);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const data = await req.json();
  const employee = await prisma.employee.create({
    data: {
      userId: user.id,
      name: data.name,
      jobTitle: data.jobTitle,
      monthlySalary: data.monthlySalary,
      startDate: new Date(data.startDate),
      nationalId: data.nationalId,
      phone: data.phone,
      bankAccount: data.bankAccount,
    },
  });
  return NextResponse.json(employee);
}
