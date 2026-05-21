import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { Expense } from '@/types';
import { Storage } from '@/utils/storage';

interface ExpenseContextType {
  expenses: Expense[];
  isLoading: boolean;
  addExpense: (expense: Expense) => Promise<void>;
  deleteExpense: (id: string) => Promise<void>;
  monthlyTotal: number;
  monthlyIncome: number;
  monthlyExpenses: Expense[];
  categoryTotals: Record<string, number>;
  topCategory: string;
}

const ExpenseContext = createContext<ExpenseContextType | null>(null);

export function ExpenseProvider({ children }: { children: ReactNode }) {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    Storage.getExpenses().then(data => {
      setExpenses(data);
      setIsLoading(false);
    });
  }, []);

  const addExpense = useCallback(async (expense: Expense) => {
    setExpenses(prev => {
      const updated = [expense, ...prev];
      Storage.setExpenses(updated);
      return updated;
    });
  }, []);

  const deleteExpense = useCallback(async (id: string) => {
    setExpenses(prev => {
      const updated = prev.filter(e => e.id !== id);
      Storage.setExpenses(updated);
      return updated;
    });
  }, []);

  const now = new Date();
  const monthlyExpenses = expenses.filter(e => {
    const d = new Date(e.createdAt);
    return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
  });

  const monthlyTotal = monthlyExpenses
    .filter(e => e.type === 'expense')
    .reduce((sum, e) => sum + e.amount, 0);

  const monthlyIncome = monthlyExpenses
    .filter(e => e.type === 'income')
    .reduce((sum, e) => sum + e.amount, 0);

  const categoryTotals: Record<string, number> = {};
  monthlyExpenses.filter(e => e.type === 'expense').forEach(e => {
    categoryTotals[e.category] = (categoryTotals[e.category] || 0) + e.amount;
  });

  const topCategory = Object.entries(categoryTotals).sort((a, b) => b[1] - a[1])[0]?.[0] ?? '';

  return (
    <ExpenseContext.Provider value={{
      expenses, isLoading, addExpense, deleteExpense,
      monthlyTotal, monthlyIncome, monthlyExpenses, categoryTotals, topCategory,
    }}>
      {children}
    </ExpenseContext.Provider>
  );
}

export function useExpenses() {
  const ctx = useContext(ExpenseContext);
  if (!ctx) throw new Error('useExpenses must be used within ExpenseProvider');
  return ctx;
}
