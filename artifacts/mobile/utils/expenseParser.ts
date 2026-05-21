import { Expense, Category, TransactionType } from '@/types';
import { detectCategory } from '@/utils/categories';
import { generateId } from '@/utils/format';

const INCOME_KEYWORDS = ['salary', 'income', 'received', 'credited', 'stipend', 'freelance', 'got', 'earned'];

export interface ParseResult {
  success: boolean;
  expense?: Expense;
  message: string;
}

export function parseExpenseMessage(input: string): ParseResult {
  const trimmed = input.trim();

  const numberMatch = trimmed.match(/(\d[\d,]*(?:\.\d+)?)/);
  if (!numberMatch) {
    return {
      success: false,
      message: "I couldn't find an amount. Try something like \"Coffee 80\" or \"Uber 150\"",
    };
  }

  const amount = parseFloat(numberMatch[1].replace(/,/g, ''));
  if (amount <= 0 || amount > 10000000) {
    return {
      success: false,
      message: "That amount looks off. Please try again with a valid amount.",
    };
  }

  const merchantRaw = trimmed
    .replace(numberMatch[0], '')
    .replace(/[₹,\.]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
  const merchant = merchantRaw || 'Expense';

  const category: Category = detectCategory(trimmed);
  const lower = trimmed.toLowerCase();
  const isIncome = INCOME_KEYWORDS.some(kw => lower.includes(kw)) || category === 'Salary';
  const type: TransactionType = isIncome ? 'income' : 'expense';

  const expense: Expense = {
    id: generateId(),
    amount,
    merchant: capitalize(merchant),
    category,
    type,
    createdAt: new Date().toISOString(),
  };

  const categoryEmoji = getCategoryEmoji(category);

  if (type === 'income') {
    return {
      success: true,
      expense,
      message: `Income logged! +₹${amount.toLocaleString('en-IN')} added ${categoryEmoji}`,
    };
  }

  return {
    success: true,
    expense,
    message: `Added ₹${amount.toLocaleString('en-IN')} to ${category} ${categoryEmoji}`,
  };
}

function capitalize(str: string): string {
  return str
    .split(' ')
    .map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
    .join(' ');
}

function getCategoryEmoji(category: Category): string {
  const emojis: Record<Category, string> = {
    Food: '🍜', Shopping: '🛍️', Rent: '🏠', Travel: '🚖',
    Entertainment: '🎬', Bills: '💡', Healthcare: '❤️', Fuel: '⛽',
    EMI: '💳', Salary: '💰', Other: '💸',
  };
  return emojis[category];
}

export const QUICK_SUGGESTIONS = [
  'Coffee 60', 'Lunch 120', 'Uber 150', 'Swiggy 280', 'Groceries 500',
];

export function getAIInsight(totalSpent: number, monthlyIncome: number, topCategory: string): string {
  if (monthlyIncome === 0) return "Start logging expenses to get personalized insights!";

  const ratio = totalSpent / monthlyIncome;
  const daysInMonth = new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0).getDate();
  const dayOfMonth = new Date().getDate();
  const expectedRatio = dayOfMonth / daysInMonth;

  if (ratio > expectedRatio + 0.15) {
    return `You're spending ${Math.round(ratio * 100)}% of monthly income. Slow down on ${topCategory || 'dining'} to stay on track.`;
  }
  if (ratio < expectedRatio - 0.1) {
    return `Great discipline! You're ${Math.round((expectedRatio - ratio) * 100)}% under pace for the month.`;
  }
  if (topCategory === 'Food') {
    return "Food is your top expense. Try home cooking 2x a week to save ₹500–₹800.";
  }
  return "You're on track for the month. Keep logging to build your financial story!";
}
