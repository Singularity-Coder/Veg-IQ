import { Tab } from './types'

export const CATEGORY_COLORS = {
  meat: 'bg-red-50 text-red-700 border-red-200',
  veg: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  pasta: 'bg-amber-50 text-amber-700 border-amber-200',
  custom: 'bg-sky-50 text-sky-700 border-sky-200',
  ai: 'bg-purple-50 text-purple-700 border-purple-200',
};

export const COUNTRIES = [
  { code: 'US', name: 'USA', amazon: 'https://www.amazon.com/s?k=' },
  { code: 'IN', name: 'INDIA', amazon: 'https://www.amazon.in/s?k=' },
  { code: 'UK', name: 'UK', amazon: 'https://www.amazon.co.uk/s?k=' },
  { code: 'CA', name: 'CANADA', amazon: 'https://www.amazon.ca/s?k=' },
  { code: 'AU', name: 'AUSTRALIA', amazon: 'https://www.amazon.com.au/s?k=' },
  { code: 'OTHER', name: 'OTHER', amazon: 'https://www.google.com/search?q=buy+' }
];

export const STATES: Record<string, string[]> = {
  US: ['California', 'New York', 'Texas', 'Florida', 'Washington'],
  IN: ['Maharashtra', 'Karnataka', 'Delhi', 'Tamil Nadu', 'Gujarat', 'Kerala', 'Rajasthan'],
  UK: ['England', 'Scotland', 'Wales', 'Northern Ireland'],
  CA: ['Ontario', 'Quebec', 'British Columbia', 'Alberta'],
  AU: ['New South Wales', 'Victoria', 'Queensland', 'Western Australia']
};

export const AILMENTS = [
  { id: 'digestion', label: 'DIGESTION', icon: '🍃' },
  { id: 'immunity', label: 'IMMUNITY', icon: '🛡️' },
  { id: 'sleep', label: 'SLEEP', icon: '😴' },
  { id: 'stress', label: 'STRESS', icon: '🧘' },
  { id: 'cold', label: 'COLD & FLU', icon: '🤧' },
  { id: 'energy', label: 'ENERGY', icon: '⚡' },
];

export const INITIAL_REMINDERS: MealReminder[] = [
  { id: 'breakfast', label: 'BREAKFAST', time: '08:00', enabled: false },
  { id: 'brunch', label: 'BRUNCH', time: '11:00', enabled: false },
  { id: 'lunch', label: 'LUNCH', time: '13:00', enabled: false },
  { id: 'dinner', label: 'DINNER', time: '20:00', enabled: false },
];

export const PANTRY_SUGGESTIONS = ['Spinach', 'Avocado', 'Tomatoes', 'Mushrooms', 'Tofu', 'Bell Peppers', 'Garlic', 'Quinoa'];
export const DISH_SUGGESTIONS = ['Mushroom Risotto', 'Truffle Pasta', 'Buddha Bowl', 'Veggie Curry', 'Caprese Salad', 'Paneer Tikka'];

export const TAB_BANNERS: Record<Tab, string> = {
  discover: "https://images.unsplash.com/photo-1556910103-1c02745aae4d?auto=format&fit=crop&q=80&w=2000",
  explore: "https://images.unsplash.com/photo-1506368249639-73a05d6f6488?auto=format&fit=crop&q=80&w=2000",
  health: "https://images.unsplash.com/photo-1512621776951-a57141f2eefd?auto=format&fit=crop&q=80&w=2000",
  restaurants: "https://images.unsplash.com/photo-1514362545857-3bc16c4c7d1b?auto=format&fit=crop&q=80&w=2000",
  custom: "https://images.unsplash.com/photo-1473093295043-cdd812d0e601?q=80&w=2070&auto=format&fit=crop&q=80&w=2000",
  favorites: "https://images.unsplash.com/photo-1490645935967-10de6ba17061?auto=format&fit=crop&q=80&w=2000"
};
