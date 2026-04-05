import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import Anthropic from "@anthropic-ai/sdk";

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

export async function POST(req: NextRequest) {
  const user = await getSession(req);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { message } = await req.json();

  // Gather business context
  const [accounts, invoices, bills, employees, loans, assets] = await Promise.all([
    prisma.account.findMany({ where: { userId: user.id } }),
    prisma.invoice.findMany({ where: { userId: user.id }, orderBy: { date: "desc" }, take: 20 }),
    prisma.bill.findMany({ where: { userId: user.id }, orderBy: { date: "desc" }, take: 20 }),
    prisma.employee.findMany({ where: { userId: user.id } }),
    prisma.loan.findMany({ where: { userId: user.id }, include: { payments: true } }),
    prisma.fixedAsset.findMany({ where: { userId: user.id } }),
  ]);

  const totalIncome = accounts.filter(a => a.type === "Income").reduce((s, a) => s + a.balance, 0);
  const totalExpenses = accounts.filter(a => a.type === "Expense").reduce((s, a) => s + a.balance, 0);
  const totalAssets = accounts.filter(a => a.type === "Asset").reduce((s, a) => s + a.balance, 0);
  const totalLiabilities = accounts.filter(a => a.type === "Liability").reduce((s, a) => s + a.balance, 0);
  const outstandingReceivables = invoices.filter(i => i.status !== "paid").reduce((s, i) => s + (i.total - i.paidAmount), 0);
  const outstandingPayables = bills.filter(b => b.status !== "paid").reduce((s, b) => s + (b.total - b.paidAmount), 0);

  const context = `
Business: ${user.businessName}
Owner: ${user.ownerName}
Currency: JOD (Jordanian Dinar)
VAT Rate: 16%

FINANCIAL SUMMARY:
- Total Income: ${totalIncome.toFixed(2)} JOD
- Total Expenses: ${totalExpenses.toFixed(2)} JOD
- Net Profit: ${(totalIncome - totalExpenses).toFixed(2)} JOD
- Total Assets: ${totalAssets.toFixed(2)} JOD
- Total Liabilities: ${totalLiabilities.toFixed(2)} JOD
- Equity: ${(totalAssets - totalLiabilities).toFixed(2)} JOD
- Outstanding Receivables: ${outstandingReceivables.toFixed(2)} JOD
- Outstanding Payables: ${outstandingPayables.toFixed(2)} JOD
- Employees: ${employees.length} (Monthly payroll: ${employees.reduce((s, e) => s + e.monthlySalary, 0).toFixed(2)} JOD)
- Active Loans: ${loans.length}
- Fixed Assets: ${assets.length}

ACCOUNTS:
${accounts.map(a => `${a.name} (${a.type}): ${a.balance.toFixed(2)} JOD`).join("\n")}
`.trim();

  // Save user message
  await prisma.chatMessage.create({
    data: { userId: user.id, role: "user", content: message },
  });

  const response = await client.messages.create({
    model: "claude-opus-4-6",
    max_tokens: 1024,
    system: `You are Hisab AI, an intelligent accounting assistant for ${user.businessName} in Jordan.
You help business owners understand their finances in simple, plain language.
You have access to real financial data for this business.
Respond in the same language the user writes in (Arabic or English).
Be concise, friendly, and practical. Use JOD as currency. Apply Jordanian VAT rules (16%).

CURRENT BUSINESS DATA:
${context}`,
    messages: [{ role: "user", content: message }],
  });

  const reply = response.content[0].type === "text" ? response.content[0].text : "";

  // Save assistant response
  await prisma.chatMessage.create({
    data: { userId: user.id, role: "assistant", content: reply },
  });

  return NextResponse.json({ reply });
}
