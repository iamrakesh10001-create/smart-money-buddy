export type TransactionType = 'expense' | 'income';

export type Category =
  | 'Food'
  | 'Shopping'
  | 'Rent'
  | 'Travel'
  | 'Entertainment'
  | 'Bills'
  | 'Healthcare'
  | 'Fuel'
  | 'EMI'
  | 'Salary'
  | 'Other';

export interface Expense {
  id: string;
  amount: number;
  merchant: string;
  category: Category;
  type: TransactionType;
  note?: string;
  createdAt: string;
}

export interface Goal {
  id: string;
  name: string;
  targetAmount: number;
  currentAmount: number;
  deadline?: string;
  icon: string;
  color: string;
  createdAt: string;
}

export interface UserProfile {
  name: string;
  monthlyIncome: number;
  salaryDate: number;
  primaryCategory: Category;
  monthlyTarget: number;
  primaryGoal: string;
  onboardingComplete: boolean;
}

export interface ChatMessage {
  id: string;
  text: string;
  isUser: boolean;
  expense?: Expense;
  createdAt: string;
}
