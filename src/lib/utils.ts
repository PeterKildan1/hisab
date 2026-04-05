import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCurrency(amount: number, currency = "JOD") {
  return new Intl.NumberFormat("en-JO", {
    style: "currency",
    currency,
    minimumFractionDigits: 2,
  }).format(amount);
}

export function formatDate(date: Date | string) {
  return new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(new Date(date));
}

export function getQuarter(date: Date) {
  const month = date.getMonth();
  const quarter = Math.floor(month / 3) + 1;
  return `${date.getFullYear()}-Q${quarter}`;
}

export function getMonthRange(date: Date) {
  const start = new Date(date.getFullYear(), date.getMonth(), 1);
  const end = new Date(date.getFullYear(), date.getMonth() + 1, 0, 23, 59, 59);
  return { start, end };
}

export function calculateDepreciation(
  purchasePrice: number,
  residualValue: number,
  usefulLifeYears: number,
  purchaseDate: Date
) {
  const annualDepreciation = (purchasePrice - residualValue) / usefulLifeYears;
  const monthlyDepreciation = annualDepreciation / 12;
  const now = new Date();
  const monthsOwned =
    (now.getFullYear() - purchaseDate.getFullYear()) * 12 +
    (now.getMonth() - purchaseDate.getMonth());
  const totalDepreciation = Math.min(
    monthlyDepreciation * monthsOwned,
    purchasePrice - residualValue
  );
  const bookValue = purchasePrice - totalDepreciation;
  return { annualDepreciation, monthlyDepreciation, bookValue, totalDepreciation };
}

export function calculateLoanSchedule(
  principal: number,
  annualRate: number,
  termMonths: number,
  startDate: Date
) {
  const monthlyRate = annualRate / 100 / 12;
  const monthlyPayment =
    monthlyRate === 0
      ? principal / termMonths
      : (principal * (monthlyRate * Math.pow(1 + monthlyRate, termMonths))) /
        (Math.pow(1 + monthlyRate, termMonths) - 1);

  const schedule = [];
  let balance = principal;
  for (let i = 0; i < termMonths; i++) {
    const interest = balance * monthlyRate;
    const principalPayment = monthlyPayment - interest;
    balance -= principalPayment;
    const dueDate = new Date(startDate);
    dueDate.setMonth(dueDate.getMonth() + i + 1);
    schedule.push({
      month: i + 1,
      dueDate,
      payment: monthlyPayment,
      principal: principalPayment,
      interest,
      balance: Math.max(0, balance),
    });
  }
  return schedule;
}

export const JORDAN_VAT_RATE = 16;

export function calculateVAT(amount: number) {
  return (amount * JORDAN_VAT_RATE) / 100;
}

export function getMonthName(month: number) {
  return new Date(2000, month - 1, 1).toLocaleString("en", { month: "long" });
}
