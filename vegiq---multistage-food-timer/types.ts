
export type TimerStatus = 'idle' | 'running' | 'paused' | 'finished';

export interface Ingredient {
  id: string;
  name: string;
  calories: number;
  protein: string;
  carbs: string;
  fat: string;
  properties: string;
}

export interface RecipeStep {
  label: string;
  durationSeconds: number;
  instruction: string;
  imageUrl?: string; // Optional field for generated step image
}

export interface Recipe {
  id: string;
  title: string;
  description: string;
  difficulty: 'Easy' | 'Medium' | 'Hard';
  totalTime: string;
  steps: RecipeStep[];
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
