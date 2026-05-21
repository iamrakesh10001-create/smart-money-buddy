import AsyncStorage from '@react-native-async-storage/async-storage';
import { Expense, Goal, UserProfile, ChatMessage, ThemePreference } from '@/types';

const KEYS = {
  EXPENSES: '@smb_expenses',
  GOALS: '@smb_goals',
  PROFILE: '@smb_profile',
  CHAT_HISTORY: '@smb_chat',
  STREAK: '@smb_streak',
  LAST_LOG_DATE: '@smb_last_log',
  THEME: '@smb_theme',
  NOTIFICATIONS: '@smb_notifs',
};

async function get<T>(key: string, fallback: T): Promise<T> {
  try {
    const raw = await AsyncStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

async function set<T>(key: string, value: T): Promise<void> {
  try {
    await AsyncStorage.setItem(key, JSON.stringify(value));
  } catch {}
}

export const Storage = {
  async getExpenses(): Promise<Expense[]> { return get(KEYS.EXPENSES, []); },
  async setExpenses(expenses: Expense[]): Promise<void> { return set(KEYS.EXPENSES, expenses); },
  async getGoals(): Promise<Goal[]> { return get(KEYS.GOALS, []); },
  async setGoals(goals: Goal[]): Promise<void> { return set(KEYS.GOALS, goals); },
  async getProfile(): Promise<UserProfile | null> { return get<UserProfile | null>(KEYS.PROFILE, null); },
  async setProfile(profile: UserProfile): Promise<void> { return set(KEYS.PROFILE, profile); },
  async getChatHistory(): Promise<ChatMessage[]> { return get(KEYS.CHAT_HISTORY, []); },
  async setChatHistory(messages: ChatMessage[]): Promise<void> { return set(KEYS.CHAT_HISTORY, messages); },
  async getStreak(): Promise<number> { return get(KEYS.STREAK, 0); },
  async setStreak(streak: number): Promise<void> { return set(KEYS.STREAK, streak); },
  async getLastLogDate(): Promise<string | null> { return get<string | null>(KEYS.LAST_LOG_DATE, null); },
  async setLastLogDate(date: string): Promise<void> { return set(KEYS.LAST_LOG_DATE, date); },
  async getTheme(): Promise<ThemePreference> { return get<ThemePreference>(KEYS.THEME, 'system'); },
  async setTheme(theme: ThemePreference): Promise<void> { return set(KEYS.THEME, theme); },
  async getNotificationsEnabled(): Promise<boolean> { return get<boolean>(KEYS.NOTIFICATIONS, true); },
  async setNotificationsEnabled(enabled: boolean): Promise<void> { return set(KEYS.NOTIFICATIONS, enabled); },
  async clearAll(): Promise<void> {
    try { await AsyncStorage.multiRemove(Object.values(KEYS)); } catch {}
  },
  async exportAll() {
    const [expenses, goals, profile] = await Promise.all([
      Storage.getExpenses(),
      Storage.getGoals(),
      Storage.getProfile(),
    ]);
    return { expenses, goals, profile, exportedAt: new Date().toISOString() };
  },
};
