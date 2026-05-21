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
  Education: { icon: 'book', color: '#3F51B5', emoji: '📚' },
  Subscriptions: { icon: 'repeat', color: '#00BCD4', emoji: '🔄' },
  'Personal Care': { icon: 'user', color: '#FF4081', emoji: '💆' },
  Investments: { icon: 'trending-up', color: '#4CAF50', emoji: '📈' },
  Gifts: { icon: 'gift', color: '#FF5722', emoji: '🎁' },
  Alcohol: { icon: 'coffee', color: '#795548', emoji: '🍺' },
  Kids: { icon: 'smile', color: '#FFC107', emoji: '👶' },
  Pets: { icon: 'feather', color: '#8BC34A', emoji: '🐾' },
  Other: { icon: 'more-horizontal', color: '#9E9E9E', emoji: '💸' },
};

export const CATEGORY_KEYWORDS: Record<string, Category> = {
  food: 'Food', eat: 'Food', meal: 'Food', lunch: 'Food', dinner: 'Food', breakfast: 'Food',
  coffee: 'Food', tea: 'Food', chai: 'Food', snack: 'Food', restaurant: 'Food',
  swiggy: 'Food', zomato: 'Food', mcdonalds: 'Food', dominos: 'Food', pizza: 'Food',
  burger: 'Food', biryani: 'Food', cafe: 'Food', juice: 'Food', milk: 'Food',
  maggi: 'Food', thali: 'Food', dosa: 'Food', paneer: 'Food', idli: 'Food', roti: 'Food',
  dunzo: 'Food', blinkit: 'Food',

  travel: 'Travel', uber: 'Travel', ola: 'Travel', rapido: 'Travel', auto: 'Travel',
  taxi: 'Travel', metro: 'Travel', bus: 'Travel', train: 'Travel', flight: 'Travel',
  irctc: 'Travel', cab: 'Travel', rickshaw: 'Travel', indigo: 'Travel', makemytrip: 'Travel',
  goibibo: 'Travel', airbnb: 'Travel', hotel: 'Travel', booking: 'Travel',

  petrol: 'Fuel', diesel: 'Fuel', fuel: 'Fuel', cng: 'Fuel',

  shop: 'Shopping', shopping: 'Shopping', amazon: 'Shopping', flipkart: 'Shopping',
  myntra: 'Shopping', meesho: 'Shopping', cloth: 'Shopping', shirt: 'Shopping',
  jeans: 'Shopping', shoes: 'Shopping', grocery: 'Shopping', dmart: 'Shopping',
  bigbasket: 'Shopping', zepto: 'Shopping', instamart: 'Shopping',
  dress: 'Shopping', bag: 'Shopping', ajio: 'Shopping', nykaa: 'Shopping',
  lenskart: 'Shopping', decathlon: 'Shopping',

  bill: 'Bills', electric: 'Bills', electricity: 'Bills', wifi: 'Bills', internet: 'Bills',
  mobile: 'Bills', recharge: 'Bills', broadband: 'Bills', postpaid: 'Bills',
  jio: 'Bills', airtel: 'Bills', bsnl: 'Bills', vi: 'Bills', water: 'Bills',
  gas: 'Bills', maintenance: 'Bills', society: 'Bills',

  netflix: 'Subscriptions', spotify: 'Subscriptions', prime: 'Subscriptions',
  hotstar: 'Subscriptions', youtube: 'Subscriptions', apple: 'Subscriptions',
  zee5: 'Subscriptions', sonyliv: 'Subscriptions', subscription: 'Subscriptions',
  membership: 'Subscriptions', adobe: 'Subscriptions', chatgpt: 'Subscriptions',

  rent: 'Rent', pg: 'Rent', hostel: 'Rent', flat: 'Rent', accommodation: 'Rent',

  doctor: 'Healthcare', medicine: 'Healthcare', hospital: 'Healthcare',
  pharmacy: 'Healthcare', medical: 'Healthcare', health: 'Healthcare',
  gym: 'Healthcare', yoga: 'Healthcare', medic: 'Healthcare', apollo: 'Healthcare',
  practo: 'Healthcare', diagnostic: 'Healthcare',

  emi: 'EMI', loan: 'EMI',

  movie: 'Entertainment', cinema: 'Entertainment', game: 'Entertainment',
  entertainment: 'Entertainment', party: 'Entertainment', concert: 'Entertainment',
  pvr: 'Entertainment', inox: 'Entertainment', bookmyshow: 'Entertainment',
  bowling: 'Entertainment', amusement: 'Entertainment',

  salary: 'Salary', income: 'Salary', received: 'Salary', credited: 'Salary',
  stipend: 'Salary', freelance: 'Salary', got: 'Salary', earned: 'Salary',
  bonus: 'Salary', payment: 'Salary',

  school: 'Education', college: 'Education', university: 'Education', course: 'Education',
  book: 'Education', books: 'Education', tuition: 'Education', coaching: 'Education',
  udemy: 'Education', coursera: 'Education', fees: 'Education', exam: 'Education',
  byju: 'Education', unacademy: 'Education',

  salon: 'Personal Care', haircut: 'Personal Care', spa: 'Personal Care', parlour: 'Personal Care',
  grooming: 'Personal Care', cosmetic: 'Personal Care', makeup: 'Personal Care',
  shampoo: 'Personal Care', deodorant: 'Personal Care', skincare: 'Personal Care',

  mutual: 'Investments', sip: 'Investments', stock: 'Investments', mf: 'Investments',
  zerodha: 'Investments', groww: 'Investments', fd: 'Investments', ppf: 'Investments',
  invest: 'Investments', shares: 'Investments',

  gift: 'Gifts', present: 'Gifts', wedding: 'Gifts', birthday: 'Gifts',

  beer: 'Alcohol', wine: 'Alcohol', whisky: 'Alcohol', alcohol: 'Alcohol',
  pub: 'Alcohol', bar: 'Alcohol', liquor: 'Alcohol',

  baby: 'Kids', diapers: 'Kids', toy: 'Kids', toys: 'Kids', kids: 'Kids', child: 'Kids',

  pet: 'Pets', dog: 'Pets', cat: 'Pets', vet: 'Pets', petfood: 'Pets',
};

export function detectCategory(text: string): Category {
  const lower = text.toLowerCase();
  for (const [keyword, category] of Object.entries(CATEGORY_KEYWORDS)) {
    if (lower.includes(keyword)) return category;
  }
  return 'Other';
}

export const GOAL_ICONS = ['🎯', '💻', '✈️', '🏠', '🚗', '📱', '💍', '🎓', '💪', '🌴', '🎸', '📷', '🏋️', '💰', '🛵', '📺'];
export const GOAL_COLORS = ['#6C47FF', '#FF6B9D', '#00C896', '#FF6B35', '#2196F3', '#E91E63', '#FF9800', '#4ECDC4', '#4CAF50', '#9C27B0'];

export const ALL_CATEGORIES = Object.keys(CATEGORY_INFO) as Category[];
