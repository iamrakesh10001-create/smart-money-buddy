import { Category } from '@/types';

export type CategoryInfo = {
  icon: string;
  color: string;
  emoji: string;
};

export const CATEGORY_INFO: Record<Category, CategoryInfo> = {
  Food: { icon: 'coffee', color: '#FF6B35', emoji: '🍜' },
  Shopping: { icon: 'shopping-bag', color: '#6C47FF', emoji: '🛍️' },
  Rent: { icon: 'home', color: '#4ECDC4', emoji: '🏠' },
  Travel: { icon: 'navigation', color: '#2196F3', emoji: '🚖' },
  Entertainment: { icon: 'film', color: '#E91E63', emoji: '🎬' },
  Bills: { icon: 'file-text', color: '#FF9800', emoji: '💡' },
  Healthcare: { icon: 'heart', color: '#F44336', emoji: '❤️' },
  Fuel: { icon: 'droplet', color: '#607D8B', emoji: '⛽' },
  EMI: { icon: 'credit-card', color: '#9C27B0', emoji: '💳' },
  Salary: { icon: 'trending-up', color: '#00C896', emoji: '💰' },
  Other: { icon: 'more-horizontal', color: '#9E9E9E', emoji: '💸' },
};

export const CATEGORY_KEYWORDS: Record<string, Category> = {
  food: 'Food', eat: 'Food', meal: 'Food', lunch: 'Food', dinner: 'Food', breakfast: 'Food',
  coffee: 'Food', tea: 'Food', chai: 'Food', snack: 'Food', restaurant: 'Food',
  swiggy: 'Food', zomato: 'Food', mcdonalds: 'Food', dominos: 'Food', pizza: 'Food',
  burger: 'Food', biryani: 'Food', cafe: 'Food', juice: 'Food', milk: 'Food',
  maggi: 'Food', thali: 'Food', dosa: 'Food',
  travel: 'Travel', uber: 'Travel', ola: 'Travel', rapido: 'Travel', auto: 'Travel',
  taxi: 'Travel', metro: 'Travel', bus: 'Travel', train: 'Travel', flight: 'Travel',
  irctc: 'Travel', cab: 'Travel', rickshaw: 'Travel',
  petrol: 'Fuel', diesel: 'Fuel', fuel: 'Fuel',
  shop: 'Shopping', shopping: 'Shopping', amazon: 'Shopping', flipkart: 'Shopping',
  myntra: 'Shopping', meesho: 'Shopping', cloth: 'Shopping', shirt: 'Shopping',
  jeans: 'Shopping', shoes: 'Shopping', grocery: 'Shopping', dmart: 'Shopping',
  bigbasket: 'Shopping', blinkit: 'Shopping', zepto: 'Shopping', instamart: 'Shopping',
  dress: 'Shopping', bag: 'Shopping',
  bill: 'Bills', electric: 'Bills', electricity: 'Bills', wifi: 'Bills', internet: 'Bills',
  mobile: 'Bills', recharge: 'Bills', broadband: 'Bills', postpaid: 'Bills',
  netflix: 'Entertainment', spotify: 'Entertainment', prime: 'Entertainment',
  hotstar: 'Entertainment', youtube: 'Entertainment',
  rent: 'Rent', pg: 'Rent', hostel: 'Rent', flat: 'Rent', accommodation: 'Rent',
  doctor: 'Healthcare', medicine: 'Healthcare', hospital: 'Healthcare',
  pharmacy: 'Healthcare', medical: 'Healthcare', health: 'Healthcare',
  gym: 'Healthcare', yoga: 'Healthcare', medic: 'Healthcare',
  emi: 'EMI', loan: 'EMI',
  movie: 'Entertainment', cinema: 'Entertainment', game: 'Entertainment',
  entertainment: 'Entertainment', party: 'Entertainment', concert: 'Entertainment',
  salary: 'Salary', income: 'Salary', received: 'Salary', credited: 'Salary',
  stipend: 'Salary', freelance: 'Salary', got: 'Salary', earned: 'Salary',
};

export function detectCategory(text: string): Category {
  const lower = text.toLowerCase();
  for (const [keyword, category] of Object.entries(CATEGORY_KEYWORDS)) {
    if (lower.includes(keyword)) return category;
  }
  return 'Other';
}

export const GOAL_ICONS = ['🎯', '💻', '✈️', '🏠', '🚗', '📱', '💍', '🎓', '💪', '🌴', '🎸', '📷'];
export const GOAL_COLORS = ['#6C47FF', '#FF6B9D', '#00C896', '#FF6B35', '#2196F3', '#E91E63', '#FF9800', '#4ECDC4'];
