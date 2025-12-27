
import React, { useState, useEffect, useRef } from 'react';
import { Ingredient, Recipe, Timer, CountryCode, MealReminder, Restaurant } from './types';
import { 
  analyzeIngredients, 
  getRecipesForIngredients, 
  playInstructionVoice, 
  stopVoice, 
  generateRecipeImage, 
  generateStepImage, 
  generateIngredientImage, 
  getExploreIngredients,
  getDishesByLocation,
  getHerbalRecipes,
  getDoctorSuggestedRecipes,
  getVegRestaurants
} from './services/geminiService';
import { TimerItem } from './components/TimerItem';

type Tab = 'discover' | 'explore' | 'custom' | 'health' | 'restaurants' | 'favorites';

const COUNTRIES = [
  { code: 'US', name: 'USA', amazon: 'https://www.amazon.com/s?k=' },
  { code: 'IN', name: 'India', amazon: 'https://www.amazon.in/s?k=' },
  { code: 'UK', name: 'UK', amazon: 'https://www.amazon.co.uk/s?k=' },
  { code: 'CA', name: 'Canada', amazon: 'https://www.amazon.ca/s?k=' },
  { code: 'AU', name: 'Australia', amazon: 'https://www.amazon.com.au/s?k=' },
  { code: 'OTHER', name: 'Other', amazon: 'https://www.google.com/search?q=buy+' }
];

const STATES: Record<string, string[]> = {
  US: ['California', 'New York', 'Texas', 'Florida', 'Washington'],
  IN: ['Maharashtra', 'Karnataka', 'Delhi', 'Tamil Nadu', 'Gujarat', 'Kerala', 'Rajasthan'],
  UK: ['England', 'Scotland', 'Wales', 'Northern Ireland'],
  CA: ['Ontario', 'Quebec', 'British Columbia', 'Alberta'],
  AU: ['New South Wales', 'Victoria', 'Queensland', 'Western Australia']
};

const AILMENTS = [
  { id: 'digestion', label: 'Digestion', icon: '🍃' },
  { id: 'immunity', label: 'Immunity', icon: '🛡️' },
  { id: 'sleep', label: 'Sleep', icon: '😴' },
  { id: 'stress', label: 'Stress', icon: '🧘' },
  { id: 'cold', label: 'Cold & Flu', icon: '🤧' },
  { id: 'energy', label: 'Energy Boost', icon: '⚡' },
];

const INITIAL_REMINDERS: MealReminder[] = [
  { id: 'breakfast', label: 'Breakfast', time: '08:00', enabled: false },
  { id: 'brunch', label: 'Brunch', time: '11:00', enabled: false },
  { id: 'lunch', label: 'Lunch', time: '13:00', enabled: false },
  { id: 'dinner', label: 'Dinner', time: '20:00', enabled: false },
];

interface IngredientCardProps {
  ing: Ingredient;
  isFavorite: boolean;
  onToggleFavorite: (ing: Ingredient) => void;
  onAddToFridge?: (ing: Ingredient) => void;
  buyLink: string;
  countryName: string;
  isExplore?: boolean;
}

const IngredientCard: React.FC<IngredientCardProps> = ({ 
  ing, 
  isFavorite, 
  onToggleFavorite, 
  onAddToFridge, 
  buyLink, 
  countryName,
  isExplore = false 
}) => (
  <div className="bg-white rounded-[40px] border border-emerald-50 shadow-sm hover:shadow-xl transition-all flex flex-col overflow-hidden relative group min-h-[480px]">
    <button 
      onClick={() => onToggleFavorite(ing)}
      className={`absolute top-4 right-4 z-10 p-3 rounded-full transition-all ${isFavorite ? 'bg-red-500 text-white shadow-lg' : 'bg-white/80 text-slate-300 hover:text-red-400 opacity-0 group-hover:opacity-100'}`}
    >
      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/></svg>
    </button>
    
    <div className="h-48 bg-emerald-50 overflow-hidden relative">
      {ing.imageUrl ? (
        <img src={ing.imageUrl} alt={ing.name} className="w-full h-full object-cover group-hover:scale-110 transition duration-1000" />
      ) : (
        <div className="w-full h-full flex items-center justify-center text-emerald-200 font-bold">Image Pending...</div>
      )}
      <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent" />
    </div>

    <div className="p-7 flex-1 flex flex-col">
      <div className="flex justify-between items-start mb-4">
        <h3 className="font-black text-emerald-950 text-2xl truncate pr-2">{ing.name}</h3>
        <span className="flex-shrink-0 text-xs bg-emerald-50 text-emerald-800 px-3 py-1.5 rounded-full font-black border border-emerald-100">{ing.calories} kcal</span>
      </div>

      <div className="grid grid-cols-3 gap-2 text-[10px] uppercase font-black text-slate-400 mb-5 tracking-tighter">
        <div className="bg-slate-50 p-3 rounded-2xl text-center border border-slate-100">
          <span className="block text-emerald-600 mb-0.5">Protein</span> {ing.protein}
        </div>
        <div className="bg-slate-50 p-3 rounded-2xl text-center border border-slate-100">
           <span className="block text-emerald-600 mb-0.5">Carbs</span> {ing.carbs}
        </div>
        <div className="bg-slate-50 p-3 rounded-2xl text-center border border-slate-100">
           <span className="block text-emerald-600 mb-0.5">Fat</span> {ing.fat}
        </div>
      </div>

      <div className="flex-1">
        <p className="text-slate-500 text-sm leading-relaxed font-medium mb-6 line-clamp-4">
          <span className="text-emerald-800 font-black text-[10px] uppercase block mb-1">Health Property</span>
          "{ing.properties}"
        </p>
      </div>

      <div className="space-y-3 mt-auto pt-4 border-t border-slate-50">
        <a 
          href={buyLink}
          target="_blank"
          rel="noopener noreferrer"
          className="w-full bg-emerald-50 text-emerald-700 py-3 rounded-2xl font-black text-xs text-center hover:bg-emerald-100 transition-all flex items-center justify-center gap-2"
        >
          🛒 Buy Now ({countryName})
        </a>
        {isExplore && onAddToFridge && (
          <button 
            onClick={() => onAddToFridge(ing)}
            className="w-full bg-emerald-950 text-white py-3 rounded-2xl font-black text-xs hover:bg-black transition-all shadow-md"
          >
            Add to Fridge
          </button>
        )}
      </div>
    </div>
  </div>
);

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<Tab>('discover');
  const [ingredients, setIngredients] = useState<Ingredient[]>([]);
  const [exploreResults, setExploreResults] = useState<Ingredient[]>([]);
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [manualRecipes, setManualRecipes] = useState<Recipe[]>([]);
  const [favIngredients, setFavIngredients] = useState<Ingredient[]>([]);
  const [favRecipes, setFavRecipes] = useState<Recipe[]>([]);
  
  const [country, setCountry] = useState<CountryCode>('US');
  const [state, setState] = useState<string>('');

  const [timers, setTimers] = useState<Timer[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isRegionalLoading, setIsRegionalLoading] = useState(false);
  const [isHealthLoading, setIsHealthLoading] = useState(false);
  const [isRestaurantsLoading, setIsRestaurantsLoading] = useState(false);
  
  const [activeRecipe, setActiveRecipe] = useState<Recipe | null>(null);
  const [currentStepIdx, setCurrentStepIdx] = useState(-1);
  const [remainingTime, setRemainingTime] = useState(0);
  const [isTimerRunning, setIsTimerRunning] = useState(false);
  const [finishedImage, setFinishedImage] = useState<string | null>(null);
  const [isGeneratingImage, setIsGeneratingImage] = useState(false);
  const [isFavIngredientsOpen, setIsFavIngredientsOpen] = useState(false);
  const [stepImages, setStepImages] = useState<Record<number, string>>({});
  const [isGeneratingStepImage, setIsGeneratingStepImage] = useState(false);
  
  const [regionalDishes, setRegionalDishes] = useState<{ name: string, description: string, imageUrl?: string }[]>([]);
  const [exploreSearch, setExploreSearch] = useState('');

  // New features state
  const [selectedAilment, setSelectedAilment] = useState(AILMENTS[0].id);
  const [herbalRecipes, setHerbalRecipes] = useState<Recipe[]>([]);
  const [doctorRecipes, setDoctorRecipes] = useState<Recipe[]>([]);
  const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
  const [reminders, setReminders] = useState<MealReminder[]>(INITIAL_REMINDERS);
  const [isRemindersTrayOpen, setIsRemindersTrayOpen] = useState(false);

  const [newRecipe, setNewRecipe] = useState<Partial<Recipe>>({
    title: '',
    description: '',
    difficulty: 'Easy',
    totalTime: '',
    steps: [{ label: '', instruction: '', durationSeconds: 60 }]
  });

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Persistence helpers
  const safeSave = (key: string, data: any) => {
    try {
      localStorage.setItem(key, JSON.stringify(data));
    } catch (e) {
      console.error('Failed to save to local storage:', e);
    }
  };

  // Initialization
  useEffect(() => {
    try {
      const savedManual = localStorage.getItem('vegiq_manual_recipes');
      if (savedManual) setManualRecipes(JSON.parse(savedManual));

      const savedFavIngredients = localStorage.getItem('vegiq_stash_ingredients');
      if (savedFavIngredients) setFavIngredients(JSON.parse(savedFavIngredients));

      const savedFavRecipes = localStorage.getItem('vegiq_stash_recipes');
      if (savedFavRecipes) setFavRecipes(JSON.parse(savedFavRecipes));

      const savedLocation = localStorage.getItem('vegiq_location');
      if (savedLocation) {
        const loc = JSON.parse(savedLocation);
        setCountry(loc.country);
        setState(loc.state);
      }

      const savedReminders = localStorage.getItem('vegiq_reminders');
      if (savedReminders) setReminders(JSON.parse(savedReminders));
    } catch (e) {
      console.error('Failed to load from local storage:', e);
    }
  }, []);

  useEffect(() => safeSave('vegiq_manual_recipes', manualRecipes), [manualRecipes]);
  useEffect(() => safeSave('vegiq_stash_ingredients', favIngredients), [favIngredients]);
  useEffect(() => safeSave('vegiq_stash_recipes', favRecipes), [favRecipes]);
  useEffect(() => safeSave('vegiq_location', { country, state }), [country, state]);
  useEffect(() => safeSave('vegiq_reminders', reminders), [reminders]);

  // Triggers
  useEffect(() => {
    if (activeTab === 'explore') fetchRegionalDishes();
    if (activeTab === 'health') {
      fetchHerbalRecipes(selectedAilment);
      if (doctorRecipes.length === 0) fetchDoctorRecipes();
    }
    if (activeTab === 'restaurants') fetchRestaurants();
  }, [activeTab, country, state, selectedAilment]);

  const fetchRegionalDishes = async () => {
    setIsRegionalLoading(true);
    try {
      const dishes = await getDishesByLocation(country, state);
      const dishesWithImages = await Promise.all(dishes.map(async d => {
        const img = await generateRecipeImage(d.name);
        return { ...d, imageUrl: img || undefined };
      }));
      setRegionalDishes(dishesWithImages);
    } catch (e) {
      console.error(e);
    } finally {
      setIsRegionalLoading(false);
    }
  };

  const fetchHerbalRecipes = async (ailmentId: string) => {
    setIsHealthLoading(true);
    try {
      const ailmentLabel = AILMENTS.find(a => a.id === ailmentId)?.label || ailmentId;
      const suggestions = await getHerbalRecipes(ailmentLabel);
      const suggestionsWithImages = await Promise.all(suggestions.map(async r => {
        const img = await generateRecipeImage(r.title);
        return { ...r, imageUrl: img || undefined };
      }));
      setHerbalRecipes(suggestionsWithImages);
    } catch (e) {
      console.error(e);
    } finally {
      setIsHealthLoading(false);
    }
  };

  const fetchDoctorRecipes = async () => {
    setIsHealthLoading(true);
    try {
      const suggestions = await getDoctorSuggestedRecipes();
      const suggestionsWithImages = await Promise.all(suggestions.map(async r => {
        const img = await generateRecipeImage(r.title);
        return { ...r, imageUrl: img || undefined };
      }));
      setDoctorRecipes(suggestionsWithImages);
    } catch (e) {
      console.error(e);
    } finally {
      setIsHealthLoading(false);
    }
  };

  const fetchRestaurants = async () => {
    setIsRestaurantsLoading(true);
    try {
      const suggested = await getVegRestaurants(country, state);
      const withImages = await Promise.all(suggested.map(async r => {
        const img = await generateRecipeImage(`${r.name} restaurant exterior`);
        return { ...r, imageUrl: img || undefined };
      }));
      setRestaurants(withImages);
    } catch (e) {
      console.error(e);
    } finally {
      setIsRestaurantsLoading(false);
    }
  };

  // Reminder management
  const updateReminder = (id: string, updates: Partial<MealReminder>) => {
    setReminders(prev => prev.map(r => r.id === id ? { ...r, ...updates } : r));
  };

  const addReminder = () => {
    const newR: MealReminder = {
      id: Math.random().toString(36).substr(2, 9),
      label: 'Custom Meal',
      time: '12:00',
      enabled: true
    };
    setReminders([...reminders, newR]);
  };

  const removeReminder = (id: string) => {
    setReminders(reminders.filter(r => r.id !== id));
  };

  // Notification logic (Simulated checking)
  useEffect(() => {
    const checkInterval = setInterval(() => {
      const now = new Date();
      const currentTime = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
      
      reminders.forEach(r => {
        if (r.enabled && r.time === currentTime && now.getSeconds() === 0) {
          if ('Notification' in window && Notification.permission === 'granted') {
            new Notification(`VegIQ: Time for ${r.label}!`, {
              body: `Don't forget your healthy vegetarian ${r.label.toLowerCase()}!`,
              icon: '/icon.png'
            });
          } else {
            alert(`Time for ${r.label}! 🥗`);
          }
        }
      });
    }, 1000);
    return () => clearInterval(checkInterval);
  }, [reminders]);

  const requestNotificationPermission = async () => {
    if ('Notification' in window) {
      const permission = await Notification.requestPermission();
      if (permission === 'granted') alert('Notifications enabled!');
    }
  };

  // Timer Logic
  useEffect(() => {
    const interval = setInterval(() => {
      setTimers(prev => prev.map(timer => {
        if (timer.status === 'running' && timer.remaining > 0) {
          const nextRemaining = timer.remaining - 1;
          if (nextRemaining === 0) {
            playInstructionVoice(`Time is up for ${timer.label}`);
            return { ...timer, remaining: 0, status: 'finished' };
          }
          return { ...timer, remaining: nextRemaining };
        }
        return timer;
      }));
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    let interval: any;
    if (isTimerRunning && remainingTime > 0) {
      interval = setInterval(() => {
        setRemainingTime(prev => prev - 1);
      }, 1000);
    } else if (isTimerRunning && remainingTime === 0) {
      setIsTimerRunning(false);
      handleNextStep();
    }
    return () => clearInterval(interval);
  }, [isTimerRunning, remainingTime]);

  const toggleFavIngredient = (ing: Ingredient) => {
    setFavIngredients(prev => {
      const exists = prev.find(f => f.name.toLowerCase() === ing.name.toLowerCase());
      if (exists) return prev.filter(f => f.name.toLowerCase() !== ing.name.toLowerCase());
      return [...prev, { ...ing, isFavorite: true }];
    });
  };

  const addFromStashToFridge = (ing: Ingredient) => {
    setIngredients(prev => {
      if (!prev.find(i => i.name.toLowerCase() === ing.name.toLowerCase())) {
        return [...prev, { ...ing, id: Math.random().toString(36).substr(2, 9) }];
      }
      return prev;
    });
  };

  const toggleFavRecipe = (rec: Recipe) => {
    setFavRecipes(prev => {
      const exists = prev.find(f => f.title.toLowerCase() === rec.title.toLowerCase());
      if (exists) return prev.filter(f => f.title.toLowerCase() !== rec.title.toLowerCase());
      return [...prev, { ...rec, isFavorite: true }];
    });
  };

  const startRecipe = (recipe: Recipe) => {
    setFinishedImage(null);
    setStepImages({});
    setActiveRecipe(recipe);
    setCurrentStepIdx(0);
    setRemainingTime(recipe.steps[0].durationSeconds);
    setIsTimerRunning(false);
    fetchStepImage(recipe, 0); 
  };

  const fetchStepImage = async (recipe: Recipe, idx: number) => {
    setIsGeneratingStepImage(true);
    try {
      const url = await generateStepImage(recipe.title, recipe.steps[idx].label, recipe.steps[idx].instruction);
      if (url) setStepImages(prev => ({ ...prev, [idx]: url }));
    } catch (e) {
      console.error(e);
    } finally {
      setIsGeneratingStepImage(false);
    }
  };

  const handleNextStep = () => {
    if (!activeRecipe) return;
    const nextIdx = currentStepIdx + 1;
    stopVoice();
    if (nextIdx < activeRecipe.steps.length) {
      setCurrentStepIdx(nextIdx);
      setRemainingTime(activeRecipe.steps[nextIdx].durationSeconds);
      setIsTimerRunning(false); 
      fetchStepImage(activeRecipe, nextIdx);
    } else {
      handleFinishRecipe();
    }
  };

  const handleFinishRecipe = async () => {
    if (!activeRecipe) return;
    setIsGeneratingImage(true);
    try {
      const imageUrl = await generateRecipeImage(activeRecipe.title);
      setFinishedImage(imageUrl);
      playInstructionVoice("Bon Appétit! Your cooking sequence is complete.");
    } catch (e) {
      console.error(e);
    } finally {
      setIsGeneratingImage(false);
    }
  };

  const closeRecipeOverlay = () => {
    setActiveRecipe(null);
    setCurrentStepIdx(-1);
    setFinishedImage(null);
    setIsTimerRunning(false);
    stopVoice();
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsLoading(true);
    const reader = new FileReader();
    reader.onloadend = async () => {
      try {
        const base64 = (reader.result as string).split(',')[1];
        const newIngredients = await analyzeIngredients({ imageBase64: base64 });
        const ingsWithImages = await Promise.all(newIngredients.map(async ing => {
          const img = await generateIngredientImage(ing.name);
          return { ...ing, imageUrl: img || undefined };
        }));
        setIngredients(prev => [...prev, ...ingsWithImages]);
      } catch (e) {
        console.error(e);
      } finally {
        setIsLoading(false);
      }
    };
    reader.readAsDataURL(file);
  };

  const addIngredientByText = async (text: string) => {
    if (!text) return;
    setIsLoading(true);
    try {
      const newIngredients = await analyzeIngredients({ text });
      const ingsWithImages = await Promise.all(newIngredients.map(async ing => {
        const img = await generateIngredientImage(ing.name);
        return { ...ing, imageUrl: img || undefined };
      }));
      setIngredients(prev => [...prev, ...ingsWithImages]);
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  const runExplore = async (dish: string) => {
    if (!dish) return;
    setExploreSearch(dish);
    setIsLoading(true);
    try {
      const res = await getExploreIngredients(dish);
      const ingsWithImages = await Promise.all(res.map(async ing => {
        const img = await generateIngredientImage(ing.name);
        return { ...ing, imageUrl: img || undefined };
      }));
      setExploreResults(ingsWithImages);
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  const getSuggestions = async () => {
    if (ingredients.length === 0) return;
    setIsLoading(true);
    try {
      const sug = await getRecipesForIngredients(ingredients);
      const recipesWithImages = await Promise.all(sug.map(async r => {
        const img = await generateRecipeImage(r.title);
        return { ...r, imageUrl: img || undefined };
      }));
      setRecipes(recipesWithImages);
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  const saveManualRecipe = () => {
    if (!newRecipe.title || !newRecipe.steps?.length) return;
    const recipe: Recipe = {
      ...newRecipe as Recipe,
      id: Math.random().toString(36).substr(2, 9),
      totalTime: `${Math.ceil((newRecipe.steps?.reduce((acc, s) => acc + s.durationSeconds, 0) || 0) / 60)} mins`
    };
    setManualRecipes(prev => [recipe, ...prev]);
    setNewRecipe({ title: '', description: '', difficulty: 'Easy', totalTime: '', steps: [{ label: '', instruction: '', durationSeconds: 60 }] });
    alert('Recipe saved!');
  };

  const formatTime = (s: number) => {
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `${m}:${sec.toString().padStart(2, '0')}`;
  };

  const getBuyLink = (ingName: string) => {
    const c = COUNTRIES.find(cnt => cnt.code === country);
    const baseUrl = c?.amazon || 'https://www.google.com/search?q=buy+';
    return `${baseUrl}${encodeURIComponent(ingName)}${country === 'OTHER' ? '+online' : ''}`;
  };

  const getCountryName = () => COUNTRIES.find(c => c.code === country)?.name || 'Store';

  return (
    <div className="min-h-screen bg-emerald-50 text-slate-900 pb-20 font-sans">
      {/* Header */}
      <header className="bg-white border-b border-emerald-100 p-4 sm:p-6 sticky top-0 z-[100] shadow-sm">
        <div className="max-w-7xl mx-auto flex flex-col lg:flex-row justify-between items-center gap-6">
          <div className="w-full lg:w-auto flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4 sm:gap-8">
            <h1 className="text-3xl font-serif font-bold text-emerald-800">VegIQ</h1>
            <nav className="flex bg-slate-100 p-1 rounded-2xl overflow-x-auto max-w-full custom-scrollbar">
              {['discover', 'explore', 'custom', 'health', 'restaurants', 'favorites'].map((t) => (
                <button 
                  key={t}
                  onClick={() => setActiveTab(t as Tab)}
                  className={`px-4 sm:px-5 py-2 sm:py-2.5 rounded-xl font-black transition-all text-[10px] sm:text-xs capitalize whitespace-nowrap ${activeTab === t ? 'bg-white text-emerald-800 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                >
                  {t}
                </button>
              ))}
            </nav>
          </div>

          <div className="flex items-center gap-4">
            <button 
              onClick={() => setIsRemindersTrayOpen(!isRemindersTrayOpen)}
              className="relative p-3 rounded-full bg-slate-100 text-slate-600 hover:bg-emerald-100 hover:text-emerald-700 transition-all shadow-sm"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" /></svg>
              {reminders.some(r => r.enabled) && (
                <span className="absolute top-2 right-2 w-3 h-3 bg-emerald-500 border-2 border-white rounded-full"></span>
              )}
            </button>
          </div>
        </div>
      </header>

      {/* Reminders Tray UI */}
      {isRemindersTrayOpen && (
        <div className="fixed top-24 right-4 sm:right-10 z-[150] w-full max-w-sm animate-in slide-in-from-top-4 fade-in duration-300">
          <div className="bg-white rounded-[40px] shadow-3xl border border-slate-100 p-8 space-y-8">
            <div className="flex justify-between items-center">
              <h3 className="text-xl font-black text-slate-900">Meal Reminders</h3>
              <button onClick={requestNotificationPermission} className="text-[10px] font-black text-emerald-600 hover:text-emerald-700 uppercase tracking-widest">ENABLE BROWSER</button>
            </div>
            <div className="space-y-4">
              {reminders.map(r => (
                <div key={r.id} className="flex items-center justify-between p-5 bg-slate-50/50 rounded-3xl border border-slate-100/50 group hover:bg-white hover:shadow-xl hover:border-emerald-50 transition-all">
                  <div className="flex-1 space-y-1">
                    <div className="flex items-center gap-2">
                      <input 
                        type="text" 
                        value={r.label}
                        onChange={(e) => updateReminder(r.id, { label: e.target.value })}
                        className="text-base font-black text-slate-800 bg-transparent outline-none focus:ring-1 focus:ring-emerald-200 rounded px-1 w-full"
                      />
                      {!INITIAL_REMINDERS.some(ir => ir.id === r.id) && (
                        <button onClick={() => removeReminder(r.id)} className="text-slate-300 hover:text-red-400 p-1 opacity-0 group-hover:opacity-100 transition-all">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                        </button>
                      )}
                    </div>
                    <input 
                      type="time" 
                      value={r.time} 
                      onChange={(e) => updateReminder(r.id, { time: e.target.value })}
                      className="text-sm bg-transparent outline-none font-bold text-slate-400 cursor-pointer"
                    />
                  </div>
                  <button 
                    onClick={() => updateReminder(r.id, { enabled: !r.enabled })}
                    className={`w-12 h-7 rounded-full transition-all relative shadow-inner ${r.enabled ? 'bg-emerald-500' : 'bg-slate-200'}`}
                  >
                    <div className={`absolute top-1 w-5 h-5 bg-white rounded-full transition-all shadow-md ${r.enabled ? 'left-6' : 'left-1'}`}></div>
                  </button>
                </div>
              ))}
            </div>
            
            <button 
              onClick={addReminder}
              className="w-full py-4 border-2 border-dashed border-emerald-100 rounded-3xl text-emerald-600 font-black text-xs hover:bg-emerald-50 hover:border-emerald-200 transition-all flex items-center justify-center gap-2"
            >
              + ADD CUSTOM REMINDER
            </button>
            
            <p className="text-[10px] text-slate-400 text-center font-medium leading-relaxed italic px-4">
              "We'll alert you at the set times to keep your vegetarian diet on track."
            </p>
          </div>
        </div>
      )}

      {/* Main Content */}
      <main className="max-w-7xl mx-auto p-4 md:p-8 space-y-12">
        {activeTab === 'discover' && (
          <>
            <section className="space-y-8">
              <div className="flex flex-wrap justify-between items-center gap-4">
                <h2 className="text-2xl sm:text-3xl font-black text-emerald-900 flex items-center gap-3">
                  <span className="bg-emerald-100 p-2 sm:p-3 rounded-2xl text-lg sm:text-xl">🥦</span> Your Fridge
                </h2>
                <div className="flex flex-wrap items-center justify-center sm:justify-end gap-2 sm:gap-4">
                  {ingredients.length > 0 && (
                    <button onClick={() => setIngredients([])} className="text-xs sm:text-sm text-red-500 font-bold hover:underline mr-2">Clear Fridge</button>
                  )}
                  
                  <div className="flex items-center bg-slate-100/80 border border-slate-200 rounded-2xl p-1 gap-1 w-full sm:w-auto shadow-sm">
                    <select value={country} onChange={(e) => { setCountry(e.target.value as CountryCode); setState(''); }} className="bg-transparent text-[10px] sm:text-xs font-black text-slate-700 py-2 px-2 sm:px-3 outline-none cursor-pointer flex-1 sm:flex-none">
                      {COUNTRIES.map(c => <option key={c.code} value={c.code}>{c.name}</option>)}
                    </select>
                    <div className="w-[1px] h-4 bg-slate-300" />
                    <select value={state} onChange={(e) => setState(e.target.value)} className="bg-transparent text-[10px] sm:text-xs font-black text-slate-700 py-2 px-2 sm:px-3 outline-none cursor-pointer flex-1 sm:flex-none" disabled={!STATES[country]}>
                      <option value="">Select State</option>
                      {STATES[country]?.map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                  </div>

                  <button onClick={() => setIsFavIngredientsOpen(true)} className="p-3 bg-red-50 text-red-500 rounded-xl hover:bg-red-100 transition shadow-sm relative flex justify-center">
                    <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="currentColor" viewBox="0 0 24 24"><path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/></svg>
                    {favIngredients.length > 0 && <span className="absolute -top-1 -right-1 bg-red-600 text-white text-[10px] w-5 h-5 flex items-center justify-center rounded-full border-2 border-white font-black">{favIngredients.length}</span>}
                  </button>
                  <button onClick={() => fileInputRef.current?.click()} className="bg-emerald-600 text-white px-4 sm:px-6 py-3 rounded-xl font-bold hover:bg-emerald-700 transition flex items-center justify-center gap-2 shadow-lg text-[10px] sm:text-xs">
                    <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812-1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                    Scan
                  </button>
                  <input type="file" ref={fileInputRef} onChange={handleFileChange} className="hidden" accept="image/*" />
                </div>
              </div>
              
              <div className="relative">
                <input onKeyDown={(e) => { if(e.key === 'Enter') { addIngredientByText(e.currentTarget.value); e.currentTarget.value = ''; } }} type="text" placeholder="Type an ingredient (e.g. banana, spinach, paneer)" className="w-full px-6 sm:px-10 py-5 sm:py-6 rounded-[24px] sm:rounded-[32px] border-2 border-emerald-100 bg-white text-slate-800 placeholder:text-slate-400 focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 outline-none shadow-xl transition-all text-base sm:text-xl font-bold" />
                <div className="absolute right-8 top-1/2 -translate-y-1/2 text-emerald-300 font-black text-[10px] uppercase tracking-widest hidden md:block">Press Enter</div>
              </div>
              
              {isLoading && <div className="text-center py-20 flex flex-col items-center gap-4">
                <div className="w-12 h-12 border-4 border-emerald-100 border-t-emerald-600 rounded-full animate-spin" />
                <p className="font-black text-emerald-800 animate-pulse text-lg">Curating Nutrition Data...</p>
              </div>}

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 sm:gap-8">
                {ingredients.map(ing => <IngredientCard key={ing.id} ing={ing} isFavorite={favIngredients.some(f => f.name.toLowerCase() === ing.name.toLowerCase())} onToggleFavorite={toggleFavIngredient} buyLink={getBuyLink(ing.name)} countryName={getCountryName()} />)}
              </div>

              {ingredients.length > 0 && !isLoading && (
                <div className="flex justify-center pt-8 sm:pt-12">
                  <button onClick={getSuggestions} className="group relative flex items-center justify-center px-10 sm:px-20 py-6 sm:py-8 font-black text-xl sm:text-3xl text-white transition-all bg-emerald-950 rounded-[30px] sm:rounded-[40px] shadow-3xl hover:bg-black active:scale-95 w-full sm:w-auto">🥗 Create Custom Recipes</button>
                </div>
              )}
            </section>
          </>
        )}

        {activeTab === 'explore' && (
          <section className="space-y-12 animate-in fade-in slide-in-from-bottom duration-700">
            <div className="max-w-4xl mx-auto text-center space-y-6">
              <h2 className="text-3xl sm:text-5xl font-serif font-black text-emerald-950">Dish Discovery</h2>
              <div className="relative pt-6 px-4">
                <input value={exploreSearch} onChange={(e) => setExploreSearch(e.target.value)} onKeyDown={(e) => { if(e.key === 'Enter') runExplore(e.currentTarget.value); }} type="text" placeholder="e.g. Mushroom Risotto" className="w-full px-6 sm:px-10 py-6 sm:py-8 rounded-[30px] sm:rounded-[40px] border-2 border-emerald-100 bg-white text-slate-900 focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 outline-none shadow-2xl transition-all text-xl sm:text-2xl font-bold text-center" />
                <button onClick={() => runExplore(exploreSearch)} className="mt-6 bg-emerald-950 text-white px-8 sm:px-12 py-4 sm:py-5 rounded-full font-black text-base sm:text-lg hover:bg-black transition-all shadow-xl active:scale-95">✨ Discover Ingredients</button>
              </div>
            </div>

            <div className="bg-emerald-100/50 p-6 sm:p-12 rounded-[40px] sm:rounded-[60px] space-y-8">
              <h3 className="text-2xl sm:text-3xl font-black text-emerald-950">Regional Specialties</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {regionalDishes.map((dish, idx) => (
                  <div key={idx} className="bg-white rounded-[32px] p-6 shadow-sm hover:shadow-xl transition-all border border-emerald-50 group cursor-pointer" onClick={() => runExplore(dish.name)}>
                    <div className="h-40 bg-emerald-50 rounded-2xl mb-4 overflow-hidden relative">
                      {dish.imageUrl && <img src={dish.imageUrl} alt={dish.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" />}
                      <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent" />
                    </div>
                    <h4 className="text-xl font-black text-slate-900 mb-2">{dish.name}</h4>
                    <p className="text-slate-500 text-xs font-medium leading-relaxed italic line-clamp-2">"{dish.description}"</p>
                  </div>
                ))}
              </div>
            </div>
          </section>
        )}

        {activeTab === 'restaurants' && (
          <section className="space-y-12 animate-in fade-in slide-in-from-bottom duration-700">
            <div className="max-w-4xl mx-auto text-center space-y-6">
              <h2 className="text-3xl sm:text-5xl font-serif font-black text-emerald-950">Pure Veg Eats</h2>
              <p className="text-slate-500 text-base sm:text-xl px-4 italic">"{state || country}'s finest strictly vegetarian restaurants at your fingertips."</p>
            </div>

            {isRestaurantsLoading ? (
              <div className="text-center py-24 flex flex-col items-center gap-6">
                <div className="w-16 h-16 border-4 border-emerald-200 border-t-emerald-600 rounded-full animate-spin" />
                <p className="text-xl font-black text-emerald-900 animate-pulse">Scouting for the best greens nearby...</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {restaurants.map(rest => (
                  <div key={rest.id} className="bg-white rounded-[40px] overflow-hidden border border-emerald-50 shadow-sm hover:shadow-2xl transition-all flex flex-col group">
                    <div className="h-56 overflow-hidden relative">
                      {rest.imageUrl ? (
                        <img src={rest.imageUrl} alt={rest.name} className="w-full h-full object-cover group-hover:scale-110 transition-all duration-1000" />
                      ) : (
                        <div className="w-full h-full bg-emerald-50 flex items-center justify-center font-black text-emerald-200">RESTO IMAGE</div>
                      )}
                      <div className="absolute top-6 left-6 flex gap-2">
                        <span className="bg-white/90 backdrop-blur-md text-emerald-800 text-[10px] font-black px-3 py-1.5 rounded-full shadow-sm">{rest.priceLevel}</span>
                        <span className="bg-emerald-600/90 backdrop-blur-md text-white text-[10px] font-black px-3 py-1.5 rounded-full shadow-sm flex items-center gap-1">⭐ {rest.rating}</span>
                      </div>
                      <div className="absolute bottom-6 right-6">
                        <span className="bg-emerald-950/80 backdrop-blur-md text-white text-[10px] font-black px-3 py-1.5 rounded-full shadow-sm">🕒 {rest.deliveryTime}</span>
                      </div>
                    </div>
                    <div className="p-8 space-y-4">
                      <div className="flex justify-between items-start">
                        <h3 className="text-2xl font-black text-slate-900 leading-tight">{rest.name}</h3>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {rest.cuisine.map((c, idx) => (
                          <span key={idx} className="text-[9px] font-black uppercase tracking-widest text-emerald-600 bg-emerald-50 px-2 py-1 rounded-md">{c}</span>
                        ))}
                      </div>
                      <p className="text-slate-500 text-sm leading-relaxed line-clamp-2">"{rest.description}"</p>
                      <button className="w-full py-4 bg-emerald-950 text-white rounded-2xl font-black text-xs hover:bg-black transition-all active:scale-95 shadow-xl">Order Delivery</button>
                    </div>
                  </div>
                ))}
              </div>
            )}
            
            <div className="bg-emerald-950 rounded-[48px] p-10 sm:p-16 text-center space-y-6 text-white shadow-3xl">
              <h3 className="text-3xl font-serif font-black">Missing a Gem?</h3>
              <p className="text-emerald-100/70 font-medium">If we missed your favorite pure veg spot in {state || country}, let us know!</p>
              <button className="bg-emerald-500 text-white px-8 py-4 rounded-full font-black hover:bg-white hover:text-emerald-950 transition-all">Submit Restaurant</button>
            </div>
          </section>
        )}

        {activeTab === 'health' && (
          <section className="space-y-12 animate-in fade-in slide-in-from-bottom duration-700">
            <div className="max-w-4xl mx-auto text-center space-y-6">
              <h2 className="text-3xl sm:text-5xl font-serif font-black text-emerald-950">Apothecary & Wellness</h2>
              <div className="flex flex-wrap justify-center gap-3 pt-6 px-4">
                {AILMENTS.map((a) => (
                  <button key={a.id} onClick={() => setSelectedAilment(a.id)} className={`px-6 py-4 rounded-2xl font-black transition-all flex items-center gap-3 shadow-sm border ${selectedAilment === a.id ? 'bg-emerald-800 text-white border-emerald-800 scale-105' : 'bg-white text-emerald-950 border-emerald-100 hover:bg-emerald-50'}`}>
                    <span>{a.icon}</span> <span className="text-sm sm:text-base">{a.label}</span>
                  </button>
                ))}
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {herbalRecipes.map(recipe => (
                <div key={recipe.id} className="bg-white rounded-[40px] overflow-hidden border border-emerald-50 shadow-sm hover:shadow-2xl transition-all flex flex-col group relative">
                  <button onClick={() => toggleFavRecipe(recipe)} className="absolute top-6 right-6 z-20 p-4 rounded-[20px] backdrop-blur-md transition-all shadow-xl bg-white/90 text-slate-300 hover:text-red-400">
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/></svg>
                  </button>
                  <div className="h-60 overflow-hidden relative">
                    {recipe.imageUrl && <img src={recipe.imageUrl} alt={recipe.title} className="w-full h-full object-cover group-hover:scale-110 transition duration-1000" />}
                  </div>
                  <div className="p-8 flex-1 flex flex-col">
                    <h3 className="text-2xl font-black text-slate-900 mb-4">{recipe.title}</h3>
                    <p className="text-slate-500 text-sm mb-6 flex-1 italic leading-relaxed">"{recipe.description}"</p>
                    <button onClick={() => startRecipe(recipe)} className="w-full bg-emerald-950 text-white py-4 rounded-[24px] font-black hover:bg-black transition-all shadow-xl active:scale-95">Prepare Now</button>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {activeTab === 'custom' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-10 sm:gap-16 animate-in fade-in slide-in-from-bottom duration-700 px-4">
            <section className="lg:col-span-2 bg-white p-8 sm:p-16 rounded-[48px] sm:rounded-[64px] border border-emerald-100 shadow-xl space-y-12">
              <div className="space-y-4">
                <h2 className="text-3xl sm:text-4xl font-serif font-black text-emerald-950">Recipe Creator</h2>
                <p className="text-slate-400 font-medium text-sm sm:text-base">Draft your own culinary sequence with custom timed steps.</p>
              </div>
              <div className="space-y-8">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-emerald-800 uppercase tracking-widest px-4">Recipe Title</label>
                  <input 
                    type="text" 
                    value={newRecipe.title} 
                    onChange={e => setNewRecipe(prev => ({...prev, title: e.target.value}))}
                    placeholder="Enter a catchy title..." 
                    className="w-full px-6 sm:px-8 py-4 sm:py-5 rounded-2xl sm:rounded-3xl border border-slate-100 bg-slate-50 focus:ring-4 focus:ring-emerald-500/10 focus:bg-white focus:border-emerald-500 outline-none transition font-bold text-base sm:text-lg"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-emerald-800 uppercase tracking-widest px-4">Description</label>
                  <textarea 
                    value={newRecipe.description}
                    onChange={e => setNewRecipe(prev => ({...prev, description: e.target.value}))}
                    placeholder="A brief story about this dish..." 
                    className="w-full px-6 sm:px-8 py-4 sm:py-5 rounded-2xl sm:rounded-3xl border border-slate-100 bg-slate-50 focus:ring-4 focus:ring-emerald-500/10 focus:bg-white focus:border-emerald-500 outline-none transition h-24 sm:h-32 font-medium"
                  />
                </div>
                <div className="flex justify-between items-center pt-4 border-t border-slate-50">
                  <h3 className="text-xl sm:text-2xl font-black text-slate-800">Cooking Steps</h3>
                  <button 
                    onClick={() => setNewRecipe(p => ({...p, steps: [...(p.steps||[]), {label:'', instruction:'', durationSeconds:60}]}))} 
                    className="bg-emerald-50 text-emerald-700 px-4 sm:px-6 py-2 rounded-full font-black text-xs sm:text-sm hover:bg-emerald-100 transition-all"
                  >
                    + Add Step
                  </button>
                </div>
                <div className="space-y-6">
                  {newRecipe.steps?.map((s, i) => (
                    <div key={i} className="bg-slate-50 p-6 sm:p-8 rounded-[30px] sm:rounded-[40px] space-y-5 border border-slate-100 relative group">
                      <div className="absolute -left-2 top-6 w-7 h-7 bg-emerald-950 text-white rounded-full flex items-center justify-center font-black text-[10px] shadow-lg">{i+1}</div>
                      <input type="text" placeholder="Step Label (e.g. Sautéing)" value={s.label} onChange={e => {
                        const ns = [...(newRecipe.steps||[])]; ns[i].label = e.target.value; setNewRecipe(p=>({...p, steps:ns}));
                      }} className="w-full bg-white px-5 sm:px-6 py-3 sm:py-4 rounded-xl sm:rounded-2xl border-none shadow-sm focus:ring-2 focus:ring-emerald-500 outline-none font-bold text-sm sm:text-base" />
                      <textarea placeholder="Step Instructions..." value={s.instruction} onChange={e => {
                        const ns = [...(newRecipe.steps||[])]; ns[i].instruction = e.target.value; setNewRecipe(p=>({...p, steps:ns}));
                      }} className="w-full bg-white px-5 sm:px-6 py-3 sm:py-4 rounded-xl sm:rounded-2xl border-none shadow-sm focus:ring-2 focus:ring-emerald-500 outline-none font-medium h-20 sm:h-24 text-sm sm:text-base" />
                      <div className="flex items-center gap-3 sm:gap-4">
                        <span className="text-[8px] sm:text-[10px] font-black text-slate-400 uppercase">Duration (Seconds)</span>
                        <input type="number" value={s.durationSeconds} onChange={e => {
                          const ns = [...(newRecipe.steps||[])]; ns[i].durationSeconds = parseInt(e.target.value); setNewRecipe(p=>({...p, steps:ns}));
                        }} className="w-24 sm:w-32 bg-white px-3 sm:px-4 py-2 rounded-lg sm:rounded-xl border-none shadow-sm font-black text-emerald-700 text-sm sm:text-base" />
                      </div>
                    </div>
                  ))}
                </div>
                <button onClick={saveManualRecipe} className="w-full py-6 sm:py-8 bg-emerald-950 text-white rounded-[30px] sm:rounded-[40px] font-black text-xl sm:text-2xl hover:bg-black transition-all shadow-3xl active:scale-95">Save Recipe</button>
              </div>
            </section>
            <section className="space-y-8">
              <h2 className="text-xl sm:text-2xl font-black text-emerald-950 px-2 uppercase tracking-widest">My Creations</h2>
              <div className="space-y-6">
                {manualRecipes.length === 0 ? (
                  <div className="p-10 text-center text-slate-300 font-black uppercase text-[10px] tracking-widest border-4 border-dashed border-emerald-50 rounded-[30px] sm:rounded-[48px]">No manual recipes yet</div>
                ) : (
                  manualRecipes.map(r => (
                    <div key={r.id} className="bg-white p-8 sm:p-10 rounded-[30px] sm:rounded-[48px] border border-emerald-50 shadow-sm hover:shadow-xl transition-all space-y-6">
                      <h3 className="text-xl sm:text-2xl font-black text-slate-900 leading-tight">{r.title}</h3>
                      <p className="text-xs sm:text-sm text-slate-500 leading-relaxed font-medium">"{r.description}"</p>
                      <button onClick={() => startRecipe(r)} className="w-full py-4 sm:py-5 bg-slate-950 text-white rounded-[24px] sm:rounded-[32px] font-black hover:bg-black transition-all shadow-lg active:scale-95">Start Cooking</button>
                    </div>
                  ))
                )}
              </div>
            </section>
          </div>
        )}

        {activeTab === 'favorites' && (
          <section className="space-y-12 animate-in fade-in slide-in-from-bottom duration-700 px-4">
            <h2 className="text-3xl sm:text-4xl font-serif font-black text-emerald-950">Saved Masterpieces</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 sm:gap-12">
              {favRecipes.length === 0 ? (
                <div className="col-span-full py-24 sm:py-32 text-center text-slate-300 uppercase tracking-widest text-[10px] font-black border-4 border-dashed border-emerald-50 rounded-[64px]">No favorites saved yet</div>
              ) : (
                favRecipes.map(recipe => (
                  <div key={recipe.id} className="bg-white rounded-[40px] sm:rounded-[56px] overflow-hidden border border-emerald-50 shadow-sm hover:shadow-2xl transition-all flex flex-col group relative">
                    <button onClick={() => toggleFavRecipe(recipe)} className="absolute top-6 right-6 z-20 p-5 rounded-[28px] bg-red-500 text-white shadow-xl"><svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24"><path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/></svg></button>
                    <div className="h-60 overflow-hidden relative">
                      {recipe.imageUrl && <img src={recipe.imageUrl} alt={recipe.title} className="w-full h-full object-cover group-hover:scale-110 transition duration-1000" />}
                    </div>
                    <div className="p-8 sm:p-10 flex-1 flex flex-col">
                      <h3 className="text-2xl sm:text-3xl font-black text-slate-900 mb-4">{recipe.title}</h3>
                      <button onClick={() => startRecipe(recipe)} className="w-full bg-emerald-950 text-white py-5 rounded-[24px] font-black active:scale-95 shadow-xl transition-all">Cook Now</button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </section>
        )}
      </main>

      {activeRecipe && (
        <div className="fixed inset-0 z-[300] flex items-center justify-center p-2 sm:p-4 bg-slate-900/80 backdrop-blur-2xl">
          <div className="bg-white rounded-[40px] sm:rounded-[72px] w-full max-w-7xl shadow-3xl overflow-hidden flex flex-col h-[95vh] animate-in zoom-in duration-500">
            {!finishedImage ? (
              <div className="flex flex-col md:flex-row h-full overflow-hidden">
                <div className="w-full md:w-1/2 p-10 sm:p-20 flex flex-col items-center text-center overflow-y-auto bg-white custom-scrollbar">
                  <h2 className="text-3xl sm:text-5xl font-serif font-black text-slate-900 leading-tight mb-8">{activeRecipe.title}</h2>
                  <div className="my-8 sm:my-14 text-8xl sm:text-[160px] font-black text-emerald-600 tabular-nums leading-none tracking-tighter drop-shadow-sm">{formatTime(remainingTime)}</div>
                  <div className="mb-10 sm:mb-16 max-w-lg space-y-4">
                    <h3 className="text-2xl sm:text-3xl font-black text-slate-800 tracking-tight">{activeRecipe.steps[currentStepIdx]?.label}</h3>
                    <p className="text-slate-400 text-base sm:text-xl font-medium leading-relaxed">"{activeRecipe.steps[currentStepIdx]?.instruction}"</p>
                  </div>
                  <div className="grid grid-cols-2 gap-4 w-full mt-auto">
                    <button onClick={() => setIsTimerRunning(!isTimerRunning)} className={`py-6 rounded-[30px] font-black text-lg sm:text-2xl shadow-xl transition-all active:scale-95 ${isTimerRunning ? 'bg-slate-100 text-slate-700' : 'bg-emerald-700 text-white hover:bg-emerald-800'}`}>{isTimerRunning ? 'Pause' : 'Start'}</button>
                    <button onClick={handleNextStep} className="py-6 bg-black text-white rounded-[30px] font-black text-lg sm:text-2xl hover:bg-slate-900 transition shadow-xl active:scale-95">Next</button>
                  </div>
                </div>
                <div className="w-full md:w-1/2 bg-slate-100 relative overflow-hidden group min-h-[300px] md:min-h-0">
                  {stepImages[currentStepIdx] ? <img src={stepImages[currentStepIdx]} className="w-full h-full object-cover" alt="Cooking Step" /> : <div className="w-full h-full flex flex-col items-center justify-center gap-6"><div className="w-16 h-16 border-4 border-emerald-100 border-t-emerald-600 rounded-full animate-spin" /><div className="text-emerald-300 font-black uppercase text-xs tracking-widest animate-pulse">Visualizing Sequence...</div></div>}
                  <button onClick={closeRecipeOverlay} className="absolute top-6 right-6 p-4 bg-white/30 hover:bg-white/50 backdrop-blur-xl rounded-full text-white transition-all"><svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg></button>
                </div>
              </div>
            ) : (
              <div className="h-full flex flex-col items-center justify-between p-10 sm:p-20 text-center animate-in zoom-in duration-1000 bg-white">
                <h2 className="text-4xl sm:text-7xl font-serif font-black text-emerald-950">Bon Appétit!</h2>
                <div className="flex-1 w-full max-w-5xl my-8 relative rounded-[40px] overflow-hidden shadow-3xl border-[12px] border-emerald-50"><img src={finishedImage} className="w-full h-full object-cover" alt="Finished Dish" /></div>
                <button onClick={closeRecipeOverlay} className="w-full max-w-md py-6 bg-emerald-950 text-white rounded-[32px] font-black text-xl hover:bg-black transition-all">Finish Session</button>
              </div>
            )}
          </div>
        </div>
      )}

      {isFavIngredientsOpen && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-xl">
          <div className="bg-white rounded-[64px] w-full max-w-3xl shadow-3xl overflow-hidden flex flex-col max-h-[90vh] p-6 sm:p-12 animate-in zoom-in duration-300">
            <div className="flex justify-between items-center mb-10">
              <h2 className="text-2xl sm:text-4xl font-black text-emerald-950">Ingredient Stash</h2>
              <button onClick={() => setIsFavIngredientsOpen(false)} className="p-4 bg-slate-100 rounded-full text-slate-400 hover:text-red-500 transition-all"><svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg></button>
            </div>
            <div className="overflow-y-auto space-y-6 pr-4 custom-scrollbar flex-1">
              {favIngredients.map(ing => (
                <div key={ing.id} className="bg-slate-50 p-6 rounded-[40px] flex items-center justify-between gap-6 border border-slate-100 group transition-all">
                  <div className="flex items-center gap-6">
                    <div className="w-24 h-24 rounded-3xl bg-white overflow-hidden shadow-sm flex-shrink-0">{ing.imageUrl && <img src={ing.imageUrl} className="w-full h-full object-cover" alt={ing.name} />}</div>
                    <div className="flex-1"><p className="font-black text-slate-900 text-2xl mb-1">{ing.name}</p><p className="text-xs text-slate-400 font-black uppercase tracking-widest">{ing.calories} kcal</p></div>
                  </div>
                  <button onClick={() => { addFromStashToFridge(ing); alert('Added!'); }} className="bg-emerald-600 text-white px-8 py-4 rounded-full font-black text-sm hover:bg-black transition-all active:scale-95">Add</button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default App;
