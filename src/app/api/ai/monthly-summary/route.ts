import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import Anthropic from "@anthropic-ai/sdk";

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

export async function GET(req: NextRequest) {
  const user = await getSession(req);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0);

  const [invoices, bills, transactions, loans, employees] = await Promise.all([
    prisma.invoice.findMany({ where: { userId: user.id, date: { gte: monthStart, lte: monthEnd } } }),
    prisma.bill.findMany({ where: { userId: user.id, date: { gte: monthStart, lte: monthEnd } } }),
    prisma.transaction.findMany({
      where: { userId: user.id, date: { gte: monthStart, lte: monthEnd } },
      include: { journalLines: true },
    }),
    prisma.loan.findMany({
      where: { userId: user.id },
      include: {
        payments: {
          where: { dueDate: { gte: now, lte: new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000) } },
        },
      },
    }),
    prisma.employee.findMany({ where: { userId: user.id } }),
  ]);

  const totalInvoiced = invoices.reduce((s, i) => s + i.total, 0);
  const totalBilled = bills.reduce((s, b) => s + b.total, 0);
  const overdueInvoices = invoices.filter(i => i.status !== "paid" && new Date(i.dueDate) < now);
  const upcomingLoanPayments = loans.flatMap(l => l.payments).filter(p => p.status === "pending");

  const summary = `
Month: ${now.toLocaleString("en", { month: "long", year: "numeric" })}
Invoiced to customers: ${totalInvoiced.toFixed(2)} JOD (${invoices.length} invoices)
Bills from suppliers: ${totalBilled.toFixed(2)} JOD (${bills.length} bills)
Overdue invoices: ${overdueInvoices.length} (${overdueInvoices.reduce((s, i) => s + (i.total - i.paidAmount), 0).toFixed(2)} JOD)
Upcoming loan payments in 30 days: ${upcomingLoanPayments.length} (${upcomingLoanPayments.reduce((s, p) => s + p.amount, 0).toFixed(2)} JOD)
Monthly payroll: ${employees.reduce((s, e) => s + e.monthlySalary, 0).toFixed(2)} JOD
Transactions recorded: ${transactions.length}
`.trim();

  const response = await client.messages.create({
    model: "claude-opus-4-6",
    max_tokens: 800,
    messages: [
      {
        role: "user",
        content: `Based on this financial data for ${user.businessName}, provide a brief monthly summary (3-4 paragraphs) covering: what went well, what to watch out for, and upcoming obligations. Be friendly and practical, written for a non-accountant business owner.

${summary}`,
      },
    ],
  });

  const text = response.content[0].type === "text" ? response.content[0].text : "";
  return NextResponse.json({ summary: text });
}
