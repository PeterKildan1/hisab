import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { calculateDepreciation } from "@/lib/utils";

export async function GET(req: NextRequest) {
  const user = await getSession(req);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const [accounts, assets, loans, invoices, bills] = await Promise.all([
    prisma.account.findMany({ where: { userId: user.id } }),
    prisma.fixedAsset.findMany({ where: { userId: user.id } }),
    prisma.loan.findMany({ where: { userId: user.id }, include: { payments: true } }),
    prisma.invoice.findMany({ where: { userId: user.id } }),
    prisma.bill.findMany({ where: { userId: user.id } }),
  ]);

  // Fixed assets with depreciation
  const fixedAssetsValue = assets.reduce((s, a) => {
    const { bookValue } = calculateDepreciation(a.purchasePrice, a.residualValue, a.usefulLifeYears, new Date(a.purchaseDate));
    return s + bookValue;
  }, 0);

  // Loan remaining balances
  const loanBalances = loans.map(l => {
    const paid = l.payments.filter(p => p.status === "paid").reduce((s, p) => s + p.principal, 0);
    return { name: l.lenderName, balance: l.amount - paid, liquidity: l.liquidity };
  });

  const accountsByType = {
    assets: accounts.filter(a => a.type === "Asset"),
    liabilities: accounts.filter(a => a.type === "Liability"),
    equity: accounts.filter(a => a.type === "Equity"),
  };

  const totalAssets = accountsByType.assets.reduce((s, a) => s + a.balance, 0) + fixedAssetsValue;
  const totalLiabilities = accountsByType.liabilities.reduce((s, a) => s + a.balance, 0) +
    loanBalances.reduce((s, l) => s + l.balance, 0);
  const totalEquity = accountsByType.equity.reduce((s, a) => s + a.balance, 0);

  const outstandingReceivables = invoices.filter(i => i.status !== "paid").reduce((s, i) => s + (i.total - i.paidAmount), 0);
  const outstandingPayables = bills.filter(b => b.status !== "paid").reduce((s, b) => s + (b.total - b.paidAmount), 0);

  return NextResponse.json({
    assets: {
      accounts: accountsByType.assets,
      fixedAssets: { total: fixedAssetsValue, items: assets },
      outstandingReceivables,
      total: totalAssets + outstandingReceivables,
    },
    liabilities: {
      accounts: accountsByType.liabilities,
      loans: loanBalances,
      outstandingPayables,
      total: totalLiabilities + outstandingPayables,
    },
    equity: {
      accounts: accountsByType.equity,
      retainedEarnings: totalAssets - totalLiabilities - totalEquity,
      total: totalEquity + (totalAssets - totalLiabilities - totalEquity),
    },
    currentRatio: outstandingReceivables > 0 ? (outstandingReceivables / outstandingPayables).toFixed(2) : "N/A",
  });
}
