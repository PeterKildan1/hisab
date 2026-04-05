import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";

export async function POST(req: NextRequest) {
  const user = await getSession(req);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { employeeId, month, bonus = 0, deductions = 0, notes } = await req.json();

  const employee = await prisma.employee.findFirst({
    where: { id: employeeId, userId: user.id },
  });
  if (!employee) return NextResponse.json({ error: "Employee not found" }, { status: 404 });

  const netPaid = employee.monthlySalary + bonus - deductions;
  const payment = await prisma.salaryPayment.create({
    data: {
      employeeId,
      month,
      baseSalary: employee.monthlySalary,
      bonus,
      deductions,
      netPaid,
      status: "paid",
      paidDate: new Date(),
      notes,
    },
  });
  return NextResponse.json(payment);
}
