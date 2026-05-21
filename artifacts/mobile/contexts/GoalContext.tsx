import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { Goal } from '@/types';
import { Storage } from '@/utils/storage';

interface GoalContextType {
  goals: Goal[];
  isLoading: boolean;
  addGoal: (goal: Goal) => Promise<void>;
  updateGoal: (id: string, updates: Partial<Goal>) => Promise<void>;
  deleteGoal: (id: string) => Promise<void>;
  addContribution: (id: string, amount: number) => Promise<void>;
}

const GoalContext = createContext<GoalContextType | null>(null);

export function GoalProvider({ children }: { children: ReactNode }) {
  const [goals, setGoals] = useState<Goal[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    Storage.getGoals().then(data => {
      setGoals(data);
      setIsLoading(false);
    });
  }, []);

  const saveGoals = (updated: Goal[]) => {
    setGoals(updated);
    Storage.setGoals(updated);
  };

  const addGoal = useCallback(async (goal: Goal) => {
    setGoals(prev => {
      const updated = [...prev, goal];
      Storage.setGoals(updated);
      return updated;
    });
  }, []);

  const updateGoal = useCallback(async (id: string, updates: Partial<Goal>) => {
    setGoals(prev => {
      const updated = prev.map(g => g.id === id ? { ...g, ...updates } : g);
      Storage.setGoals(updated);
      return updated;
    });
  }, []);

  const deleteGoal = useCallback(async (id: string) => {
    setGoals(prev => {
      const updated = prev.filter(g => g.id !== id);
      Storage.setGoals(updated);
      return updated;
    });
  }, []);

  const addContribution = useCallback(async (id: string, amount: number) => {
    setGoals(prev => {
      const updated = prev.map(g =>
        g.id === id
          ? { ...g, currentAmount: Math.min(g.currentAmount + amount, g.targetAmount) }
          : g
      );
      Storage.setGoals(updated);
      return updated;
    });
  }, []);

  return (
    <GoalContext.Provider value={{ goals, isLoading, addGoal, updateGoal, deleteGoal, addContribution }}>
      {children}
    </GoalContext.Provider>
  );
}

export function useGoals() {
  const ctx = useContext(GoalContext);
  if (!ctx) throw new Error('useGoals must be used within GoalProvider');
  return ctx;
}
