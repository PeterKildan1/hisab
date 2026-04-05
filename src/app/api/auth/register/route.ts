import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { hashPassword, createToken } from "@/lib/auth";

const DEFAULT_ACCOUNTS = [
  { name: "Cash on Hand", type: "Asset", subType: "Cash", liquidity: "ShortTerm" },
  { name: "Bank Account", type: "Asset", subType: "Cash", liquidity: "ShortTerm" },
  { name: "Accounts Receivable", type: "Asset", subType: "Receivable", liquidity: "ShortTerm" },
  { name: "Inventory", type: "Asset", subType: "Inventory", liquidity: "ShortTerm" },
  { name: "Prepaid Expenses", type: "Asset", subType: "Prepaid", liquidity: "ShortTerm" },
  { name: "Equipment", type: "Asset", subType: "FixedAsset", liquidity: "LongTerm" },
  { name: "Accounts Payable", type: "Liability", subType: "Payable", liquidity: "ShortTerm" },
  { name: "VAT Payable", type: "Liability", subType: "TaxOwed", liquidity: "ShortTerm" },
  { name: "Salaries Payable", type: "Liability", subType: "SalaryOwed", liquidity: "ShortTerm" },
  { name: "Bank Loan", type: "Liability", subType: "Loan", liquidity: "LongTerm" },
  { name: "Owner's Equity", type: "Equity", subType: null, liquidity: null },
  { name: "Retained Earnings", type: "Equity", subType: null, liquidity: null },
  { name: "Sales Revenue", type: "Income", subType: null, liquidity: null },
  { name: "Service Revenue", type: "Income", subType: null, liquidity: null },
  { name: "Cost of Goods Sold", type: "Expense", subType: null, liquidity: null },
  { name: "Rent Expense", type: "Expense", subType: null, liquidity: null },
  { name: "Salaries Expense", type: "Expense", subType: null, liquidity: null },
  { name: "Utilities Expense", type: "Expense", subType: null, liquidity: null },
  { name: "Marketing Expense", type: "Expense", subType: null, liquidity: null },
  { name: "Interest Expense", type: "Expense", subType: null, liquidity: null },
  { name: "Depreciation Expense", type: "Expense", subType: null, liquidity: null },
];

export async function POST(req: NextRequest) {
  try {
    const { email, password, businessName, ownerName, phone, accountType } = await req.json();

    if (!email || !password || !businessName || !ownerName) {
      return NextResponse.json({ error: "All fields required" }, { status: 400 });
    }

    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      return NextResponse.json({ error: "Email already registered" }, { status: 400 });
    }

    const hashed = await hashPassword(password);
    const user = await prisma.user.create({
      data: {
        email,
        password: hashed,
        businessName,
        ownerName,
        phone,
        accountType: accountType || "SmallBusiness",
      },
    });

    // Create default chart of accounts
    await prisma.account.createMany({
      data: DEFAULT_ACCOUNTS.map((a) => ({
        ...a,
        userId: user.id,
        isSystem: true,
      })),
    });

    const token = await createToken(user.id);
    const response = NextResponse.json({
      user: { id: user.id, email: user.email, businessName: user.businessName },
    });
    response.cookies.set("auth-token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 7,
      path: "/",
    });
    return response;
  } catch (error) {
    console.error("Register error:", error);
    return NextResponse.json({ error: "Registration failed" }, { status: 500 });
  }
}
