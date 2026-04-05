// Onboarding explanations for each page, stored in localStorage

export const PAGE_EXPLANATIONS: Record<string, { title: string; body: string; analogy?: string }> = {
  dashboard: {
    title: "Welcome to your Dashboard",
    body: "This is your financial command center. At a glance you can see how much money came in, how much went out, and how much you have right now. Think of it like the speedometer and fuel gauge of your business.",
    analogy: "Just like checking your phone's battery and signal before leaving the house — this page tells you the health of your business in seconds.",
  },
  accounts: {
    title: "What is a Chart of Accounts?",
    body: "A Chart of Accounts is simply a list of labeled buckets where you put your money. Every time money moves, it goes from one bucket to another. For example: when a customer pays you, money moves from 'Accounts Receivable' into 'Bank Account'.",
    analogy: "Think of it like a filing cabinet. Instead of keeping all your papers in one pile, you create labeled folders: 'What I Own', 'What I Owe', 'Money Coming In', 'Money Going Out'. That's all this is.",
  },
  transactions: {
    title: "Recording Transactions",
    body: "A transaction is any time money moves — a sale, a bill paid, a salary, a loan repayment. Record each one here so your books stay accurate. You can type details manually or take a photo of a receipt and the AI will read it for you.",
    analogy: "Like keeping a diary for your money. Every movement gets written down so you never lose track of where it went.",
  },
  invoices: {
    title: "Invoices & What You're Owed",
    body: "When you sell something or complete a job, you send the customer an invoice — a formal request for payment. This page tracks all your invoices: who owes you, how much, and whether they've paid. Jordan VAT of 16% is added automatically.",
    analogy: "Like sending someone a bill at a restaurant — except you can track whether they actually paid it.",
  },
  bills: {
    title: "Bills & What You Owe",
    body: "These are invoices you receive from your suppliers. When you buy goods or services on credit, the supplier sends you a bill. Track them here so you never miss a payment deadline and damage a supplier relationship.",
    analogy: "Just like your phone bill or electricity bill at home — except these are the ones for your business.",
  },
  inventory: {
    title: "Inventory Management",
    body: "If your business sells physical products, this page tracks what you have in stock, what it cost you, and what you sell it for. When stock runs low, you get an alert. The app automatically calculates the total value of everything in your warehouse.",
    analogy: "Like counting the items on a store shelf — knowing you have 50 bottles left and each cost you 2 JOD means you have 100 JOD worth of stock.",
  },
  employees: {
    title: "Employees & Payroll",
    body: "Add your employees here, set their monthly salary, and record each payment. The app estimates income tax and social security based on Jordanian law. At the end of the month you can see exactly who's been paid and who hasn't.",
    analogy: "Like a payroll ledger — your accountant's spreadsheet, built into the app.",
  },
  loans: {
    title: "Loans & Financing",
    body: "If your business borrowed money — from a bank, an investor, or a family member — record it here. The app automatically calculates your monthly payment schedule, how much goes to interest vs principal, and when each payment is due.",
    analogy: "Like having the loan amortization table your bank gives you, but updated live as you make payments.",
  },
  assets: {
    title: "Fixed Assets & Depreciation",
    body: "Fixed assets are big items your business owns long-term: equipment, vehicles, furniture, property. Over time these lose value (called depreciation). This page tracks each asset and automatically calculates its current book value.",
    analogy: "You bought a car for 15,000 JOD. Five years later it's worth 7,000 JOD. That 8,000 JOD reduction is depreciation — and this page tracks it automatically.",
  },
  vat: {
    title: "VAT Management",
    body: "VAT (Value Added Tax) is 16% in Jordan. When you sell something, you collect VAT from the customer. When you buy something, you pay VAT to the supplier. At the end of each quarter, you pay the government the difference. This page calculates that for you.",
    analogy: "You're like a tax collector for the government. You hold the VAT temporarily, then hand it over. This page tracks exactly how much you're holding.",
  },
  reports: {
    title: "Financial Reports",
    body: "This is where you generate professional financial statements. These reports are what banks, auditors, and tax authorities ask for. You can export any report as a PDF or send it to your accountant as a spreadsheet.",
    analogy: "Think of these as the official scorecards of your business — the documents that prove to outsiders how your business is doing.",
  },
  "ai-assistant": {
    title: "Your AI Financial Assistant",
    body: "Ask this assistant anything about your finances in plain English or Arabic. It has access to all your real data and can explain reports, flag issues, and answer questions like 'Am I profitable this month?' or 'Which customer owes me the most?'",
    analogy: "Like having an accountant on call 24/7 who already knows everything about your business.",
  },
};

export function getOnboardingKey(page: string) {
  return `hisab_onboarding_dismissed_${page}`;
}

export function isDismissed(page: string): boolean {
  if (typeof window === "undefined") return true;
  return localStorage.getItem(getOnboardingKey(page)) === "true";
}

export function dismiss(page: string) {
  if (typeof window === "undefined") return;
  localStorage.setItem(getOnboardingKey(page), "true");
}

export function resetOnboarding(page?: string) {
  if (typeof window === "undefined") return;
  if (page) {
    localStorage.removeItem(getOnboardingKey(page));
  } else {
    Object.keys(PAGE_EXPLANATIONS).forEach(p => localStorage.removeItem(getOnboardingKey(p)));
  }
}
