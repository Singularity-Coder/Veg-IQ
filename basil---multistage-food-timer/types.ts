
export type TimerStatus = 'idle' | 'running' | 'paused' | 'finished';

export interface Ingredient {
  id: string;
  name: string;
  calories: number;
  protein: string;
  carbs: string;
  fat: string;
  properties: string;
  imageUrl?: string;
  isFavorite?: boolean;
}

export interface RecipeStep {
  label: string;
  durationSeconds: number;
  instruction: string;
  imageUrl?: string;
}

export interface Recipe {
  id: string;
  title: string;
  description: string;
  difficulty: 'Easy' | 'Medium' | 'Hard';
  totalTime: string;
  steps: RecipeStep[];
  imageUrl?: string;
  isFavorite?: boolean;
}

export interface Timer {
  id: string;
  label: string;
  duration: number; 
  remaining: number;
  status: TimerStatus;
  category: 'meat' | 'veg' | 'pasta' | 'custom' | 'ai';
  createdAt: number;
}

export interface AIRecipeResponse {
  foodName: string;
  cookingMethod: string;
  suggestedTimeInSeconds: number;
  temperature?: string;
  tips: string[];
}

export type CountryCode = 'US' | 'IN' | 'UK' | 'CA' | 'AU' | 'OTHER';

export interface MealReminder {
  id: string;
  label: string;
  time: string; // HH:mm
  enabled: boolean;
}

export interface Restaurant {
  id: string;
  name: string;
  rating: number;
  deliveryTime: string;
  priceLevel: string;
  imageUrl?: string;
  cuisine: string[];
  description: string;
}

export type Tab = 'discover' | 'explore' | 'custom' | 'health' | 'restaurants' | 'favorites';

