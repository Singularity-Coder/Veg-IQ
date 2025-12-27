
import React, { useState, useEffect, useRef } from 'react';
import { Ingredient, Recipe, Timer, CountryCode } from './types';
import { 
  analyzeIngredients, 
  getRecipesForIngredients, 
  playInstructionVoice, 
  stopVoice, 
  generateRecipeImage, 
  generateStepImage, 
  generateIngredientImage, 
  getExploreIngredients 
} from './services/geminiService';
import { TimerItem } from './components/TimerItem';

type Tab = 'discover' | 'explore' | 'create' | 'favorites';

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
  IN: ['Maharashtra', 'Karnataka', 'Delhi', 'Tamil Nadu', 'Gujarat'],
  UK: ['England', 'Scotland', 'Wales', 'Northern Ireland'],
  CA: ['Ontario', 'Quebec', 'British Columbia', 'Alberta'],
  AU: ['New South Wales', 'Victoria', 'Queensland', 'Western Australia']
};

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
  const [activeRecipe, setActiveRecipe] = useState<Recipe | null>(null);
  const [currentStepIdx, setCurrentStepIdx] = useState(-1);
  const [remainingTime, setRemainingTime] = useState(0);
  const [isTimerRunning, setIsTimerRunning] = useState(false);
  const [finishedImage, setFinishedImage] = useState<string | null>(null);
  const [isGeneratingImage, setIsGeneratingImage] = useState(false);
  const [isFavIngredientsOpen, setIsFavIngredientsOpen] = useState(false);
  const [stepImages, setStepImages] = useState<Record<number, string>>({});
  const [isGeneratingStepImage, setIsGeneratingStepImage] = useState(false);
  
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
      if (e instanceof DOMException && (e.name === 'QuotaExceededError' || e.name === 'NS_ERROR_DOM_QUOTA_REACHED')) {
        console.error('Local storage quota exceeded. Unable to save:', key);
        alert("Your Favorites/Stash is full! Try removing some old items to save new ones.");
      } else {
        console.error('Failed to save to local storage:', e);
      }
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
        const { country, state } = JSON.parse(savedLocation);
        setCountry(country);
        setState(state);
      }
    } catch (e) {
      console.error('Failed to load from local storage:', e);
    }
  }, []);

  useEffect(() => safeSave('vegiq_manual_recipes', manualRecipes), [manualRecipes]);
  useEffect(() => safeSave('vegiq_stash_ingredients', favIngredients), [favIngredients]);
  useEffect(() => safeSave('vegiq_stash_recipes', favRecipes), [favRecipes]);
  useEffect(() => safeSave('vegiq_location', { country, state }), [country, state]);

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

  // Favorite Handlers
  const toggleFavIngredient = (ing: Ingredient) => {
    setFavIngredients(prev => {
      const exists = prev.find(f => f.name.toLowerCase() === ing.name.toLowerCase());
      if (exists) {
        return prev.filter(f => f.name.toLowerCase() !== ing.name.toLowerCase());
      } else {
        return [...prev, { ...ing, isFavorite: true }];
      }
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
      if (exists) {
        return prev.filter(f => f.title.toLowerCase() !== rec.title.toLowerCase());
      } else {
        return [...prev, { ...rec, isFavorite: true }];
      }
    });
  };

  const startRecipe = (recipe: Recipe) => {
    setFinishedImage(null);
    setStepImages({});
    setActiveRecipe(recipe);
    setCurrentStepIdx(0);
    const firstStep = recipe.steps[0];
    setRemainingTime(firstStep.durationSeconds);
    setIsTimerRunning(false);
    fetchStepImage(recipe, 0); 
  };

  const fetchStepImage = async (recipe: Recipe, idx: number) => {
    setIsGeneratingStepImage(true);
    try {
      const step = recipe.steps[idx];
      const url = await generateStepImage(recipe.title, step.label, step.instruction);
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
      const nextStep = activeRecipe.steps[nextIdx];
      setCurrentStepIdx(nextIdx);
      setRemainingTime(nextStep.durationSeconds);
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
        console.error("Failed to analyze image", e);
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
      console.error("Failed to add ingredient", e);
    } finally {
      setIsLoading(false);
    }
  };

  const runExplore = async (dish: string) => {
    if (!dish) return;
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
      console.error("Failed to get recipes", e);
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
    const suffix = country === 'OTHER' ? '+online' : '';
    return `${baseUrl}${encodeURIComponent(ingName)}${suffix}`;
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
              {['discover', 'explore', 'create', 'favorites'].map((t) => (
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

          <div className="w-full lg:w-auto flex flex-col sm:flex-row items-center justify-center lg:justify-end gap-4">
            {/* Location Selectors */}
            <div className="flex items-center bg-slate-50 border border-slate-100 rounded-2xl p-1 gap-1 w-full sm:w-auto">
              <select 
                value={country} 
                onChange={(e) => { setCountry(e.target.value as CountryCode); setState(''); }}
                className="bg-transparent text-[10px] sm:text-xs font-black text-slate-700 py-2 px-2 sm:px-3 outline-none cursor-pointer flex-1 sm:flex-none"
              >
                {COUNTRIES.map(c => <option key={c.code} value={c.code}>{c.name}</option>)}
              </select>
              <div className="w-[1px] h-4 bg-slate-200" />
              <select 
                value={state}
                onChange={(e) => setState(e.target.value)}
                className="bg-transparent text-[10px] sm:text-xs font-black text-slate-700 py-2 px-2 sm:px-3 outline-none cursor-pointer flex-1 sm:flex-none"
                disabled={!STATES[country]}
              >
                <option value="">Select State</option>
                {STATES[country]?.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto p-4 md:p-8 space-y-12">
        {activeTab === 'discover' && (
          <>
            <section className="space-y-8">
              <div className="flex flex-wrap justify-between items-center gap-4">
                <h2 className="text-2xl sm:text-3xl font-black text-emerald-900 flex items-center gap-3">
                  <span className="bg-emerald-100 p-2 sm:p-3 rounded-2xl text-lg sm:text-xl">🥦</span> Your Fridge
                </h2>
                <div className="flex items-center gap-2">
                  {ingredients.length > 0 && (
                    <button onClick={() => setIngredients([])} className="text-xs sm:text-sm text-red-500 font-bold hover:underline mr-2">Clear Fridge</button>
                  )}
                  {/* Favorites (Stash) button moved from header */}
                  <button 
                    onClick={() => setIsFavIngredientsOpen(true)}
                    className="p-3 bg-red-50 text-red-500 rounded-xl hover:bg-red-100 transition shadow-sm relative flex justify-center"
                    title="Ingredient Stash"
                  >
                    <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="currentColor" viewBox="0 0 24 24"><path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/></svg>
                    {favIngredients.length > 0 && (
                      <span className="absolute -top-1 -right-1 bg-red-600 text-white text-[10px] w-5 h-5 flex items-center justify-center rounded-full border-2 border-white font-black">{favIngredients.length}</span>
                    )}
                  </button>
                  {/* Scan button moved from header */}
                  <button 
                    onClick={() => fileInputRef.current?.click()}
                    className="bg-emerald-600 text-white px-4 sm:px-6 py-3 rounded-xl font-bold hover:bg-emerald-700 transition flex items-center justify-center gap-2 shadow-lg text-[10px] sm:text-xs"
                    title="Scan Ingredients"
                  >
                    <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                    Scan
                  </button>
                  <input type="file" ref={fileInputRef} onChange={handleFileChange} className="hidden" accept="image/*" />
                </div>
              </div>
              
              <div className="relative">
                <input 
                  onKeyDown={(e) => { if(e.key === 'Enter') { addIngredientByText(e.currentTarget.value); e.currentTarget.value = ''; } }}
                  type="text" 
                  placeholder="Type an ingredient (e.g. banana, spinach, paneer)" 
                  className="w-full px-6 sm:px-10 py-5 sm:py-6 rounded-[24px] sm:rounded-[32px] border-2 border-emerald-100 bg-white text-slate-800 placeholder:text-slate-400 focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 outline-none shadow-xl transition-all text-base sm:text-xl font-bold"
                />
                <div className="absolute right-8 top-1/2 -translate-y-1/2 text-emerald-300 font-black text-[10px] uppercase tracking-widest hidden md:block">Press Enter</div>
              </div>
              
              {isLoading && <div className="text-center py-20 flex flex-col items-center gap-4">
                <div className="w-12 h-12 border-4 border-emerald-100 border-t-emerald-600 rounded-full animate-spin" />
                <p className="font-black text-emerald-800 animate-pulse text-lg">Curating Nutrition Data...</p>
              </div>}

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 sm:gap-8">
                {ingredients.map(ing => (
                  <IngredientCard 
                    key={ing.id} 
                    ing={ing} 
                    isFavorite={favIngredients.some(f => f.name.toLowerCase() === ing.name.toLowerCase())}
                    onToggleFavorite={toggleFavIngredient}
                    buyLink={getBuyLink(ing.name)}
                    countryName={getCountryName()}
                  />
                ))}
              </div>

              {ingredients.length > 0 && !isLoading && (
                <div className="flex justify-center pt-8 sm:pt-12">
                  <button 
                    onClick={getSuggestions}
                    className="group relative flex items-center justify-center px-10 sm:px-20 py-6 sm:py-8 font-black text-xl sm:text-3xl text-white transition-all bg-emerald-950 rounded-[30px] sm:rounded-[40px] shadow-3xl hover:bg-black active:scale-95 w-full sm:w-auto"
                  >
                    🥗 Create Recipes
                  </button>
                </div>
              )}
            </section>

            {recipes.length > 0 && (
              <section className="space-y-10 pt-16 sm:pt-20 border-t border-emerald-100">
                <h2 className="text-2xl sm:text-3xl font-black text-emerald-900 flex items-center gap-3">
                  <span className="bg-emerald-100 p-2 sm:p-3 rounded-2xl text-lg sm:text-xl">👩‍🍳</span> AI Recommendations
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 sm:gap-12">
                  {recipes.map(recipe => {
                    const isFav = favRecipes.some(f => f.title.toLowerCase() === recipe.title.toLowerCase());
                    return (
                      <div key={recipe.id} className="bg-white rounded-[40px] sm:rounded-[56px] overflow-hidden border border-emerald-50 shadow-sm hover:shadow-2xl transition-all flex flex-col group relative">
                        <button 
                          onClick={() => toggleFavRecipe(recipe)}
                          className={`absolute top-6 sm:top-8 right-6 sm:right-8 z-20 p-4 sm:p-5 rounded-[20px] sm:rounded-[28px] backdrop-blur-md transition-all shadow-xl ${isFav ? 'bg-red-500 text-white' : 'bg-white/90 text-slate-300 hover:text-red-400'}`}
                        >
                          <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="currentColor" viewBox="0 0 24 24"><path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/></svg>
                        </button>
                        <div className="relative h-60 sm:h-72 overflow-hidden">
                          {recipe.imageUrl && <img src={recipe.imageUrl} alt={recipe.title} className="w-full h-full object-cover group-hover:scale-110 transition duration-1000" />}
                          <div className="absolute top-6 sm:top-8 left-6 sm:left-8">
                             <span className="text-[8px] sm:text-[10px] font-black uppercase tracking-widest text-emerald-700 bg-emerald-50/90 backdrop-blur-md px-3 sm:px-5 py-2 sm:py-3 rounded-full shadow-sm">{recipe.difficulty} • {recipe.totalTime}</span>
                          </div>
                        </div>
                        <div className="p-8 sm:p-10 flex-1 flex flex-col">
                          <h3 className="text-2xl sm:text-3xl font-black text-slate-900 mb-4 leading-tight">{recipe.title}</h3>
                          <p className="text-slate-500 text-sm sm:text-base mb-6 sm:mb-8 flex-1 italic leading-relaxed">"{recipe.description}"</p>
                          <button 
                            onClick={() => startRecipe(recipe)}
                            className="w-full bg-emerald-950 text-white py-4 sm:py-6 rounded-[24px] sm:rounded-[32px] font-black text-lg sm:text-xl hover:bg-black transition-all shadow-xl active:scale-95"
                          >
                            Start Cooking
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </section>
            )}
          </>
        )}

        {activeTab === 'explore' && (
          <section className="space-y-12 animate-in fade-in slide-in-from-bottom duration-700">
            <div className="max-w-4xl mx-auto text-center space-y-6">
              <h2 className="text-3xl sm:text-5xl font-serif font-black text-emerald-950">Dish Discovery</h2>
              <p className="text-slate-500 text-base sm:text-xl px-4">Enter any dish name to see every vegetarian ingredient needed to perfect it.</p>
              <div className="relative pt-6 px-4">
                <input 
                  onKeyDown={(e) => { if(e.key === 'Enter') runExplore(e.currentTarget.value); }}
                  type="text" 
                  placeholder="e.g. Mushroom Risotto, Paneer Tikka" 
                  className="w-full px-6 sm:px-10 py-6 sm:py-8 rounded-[30px] sm:rounded-[40px] border-2 border-emerald-100 bg-white text-slate-900 placeholder:text-slate-300 focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 outline-none shadow-2xl transition-all text-xl sm:text-2xl font-bold text-center"
                />
                <button 
                  onClick={(e) => {
                    const input = e.currentTarget.previousSibling as HTMLInputElement;
                    runExplore(input.value);
                  }}
                  className="mt-6 bg-emerald-950 text-white px-8 sm:px-12 py-4 sm:py-5 rounded-full font-black text-base sm:text-lg hover:bg-black transition-all shadow-xl active:scale-95"
                >
                  ✨ Discover Ingredients
                </button>
              </div>
            </div>

            {isLoading && (
              <div className="text-center py-24">
                <div className="inline-block w-16 h-16 border-4 border-emerald-100 border-t-emerald-600 rounded-full animate-spin mb-6" />
                <p className="text-xl sm:text-2xl font-black text-emerald-900 animate-pulse">Consulting the Master Chef...</p>
              </div>
            )}

            {!isLoading && exploreResults.length > 0 && (
              <div className="space-y-10">
                <div className="flex flex-col sm:flex-row justify-between items-center px-4 gap-4">
                  <h3 className="text-xl sm:text-2xl font-black text-emerald-900 uppercase tracking-widest text-center sm:text-left">Master Ingredients List</h3>
                  <button 
                    onClick={() => {
                      setIngredients(prev => [...prev, ...exploreResults.filter(er => !prev.find(p => p.name.toLowerCase() === er.name.toLowerCase()))]);
                      alert('All ingredients added to your fridge!');
                    }}
                    className="bg-emerald-100 text-emerald-800 px-6 sm:px-8 py-3 sm:py-4 rounded-full font-black text-xs sm:text-sm hover:bg-emerald-200 transition-all w-full sm:w-auto"
                  >
                    Add All to Fridge
                  </button>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 sm:gap-8">
                  {exploreResults.map(ing => (
                    <IngredientCard 
                      key={ing.id} 
                      ing={ing} 
                      isFavorite={favIngredients.some(f => f.name.toLowerCase() === ing.name.toLowerCase())}
                      onToggleFavorite={toggleFavIngredient}
                      onAddToFridge={addFromStashToFridge}
                      buyLink={getBuyLink(ing.name)}
                      countryName={getCountryName()}
                      isExplore 
                    />
                  ))}
                </div>
              </div>
            )}
          </section>
        )}

        {activeTab === 'create' && (
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
                <div className="col-span-full py-24 sm:py-32 text-center">
                  <div className="text-6xl sm:text-8xl mb-8 grayscale opacity-30">⭐</div>
                  <p className="text-slate-400 font-black uppercase tracking-[0.3em] text-[10px] sm:text-xs mb-8 px-4">No favorite recipes yet</p>
                  <button onClick={() => setActiveTab('discover')} className="bg-emerald-950 text-white px-8 sm:px-10 py-4 sm:py-5 rounded-full font-black hover:bg-black transition-all">Explore Suggestions</button>
                </div>
              ) : (
                favRecipes.map(recipe => (
                  <div key={recipe.id} className="bg-white rounded-[40px] sm:rounded-[56px] overflow-hidden border border-emerald-50 shadow-sm hover:shadow-2xl transition-all flex flex-col group relative">
                    <button onClick={() => toggleFavRecipe(recipe)} className="absolute top-6 sm:top-8 right-6 sm:right-8 z-20 p-4 sm:p-5 rounded-[20px] sm:rounded-[28px] bg-red-500 text-white shadow-xl">
                      <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="currentColor" viewBox="0 0 24 24"><path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/></svg>
                    </button>
                    <div className="h-60 sm:h-72 overflow-hidden relative">
                      {recipe.imageUrl && <img src={recipe.imageUrl} alt={recipe.title} className="w-full h-full object-cover group-hover:scale-110 transition duration-1000" />}
                    </div>
                    <div className="p-8 sm:p-10 flex-1 flex flex-col">
                      <h3 className="text-2xl sm:text-3xl font-black text-slate-900 mb-4 leading-tight">{recipe.title}</h3>
                      <p className="text-slate-500 text-sm sm:text-base mb-8 flex-1 leading-relaxed">"{recipe.description}"</p>
                      <button onClick={() => startRecipe(recipe)} className="w-full bg-emerald-950 text-white py-5 sm:py-6 rounded-[24px] sm:rounded-[32px] font-black text-lg sm:text-xl active:scale-95 shadow-xl transition-all">Cook Now</button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </section>
        )}

        {timers.length > 0 && (
          <section className="animate-in fade-in slide-in-from-bottom duration-500 border-t border-emerald-100 pt-16 sm:pt-20 px-4">
            <div className="flex justify-between items-center mb-10 px-2">
              <h2 className="text-2xl sm:text-3xl font-black text-emerald-900 flex items-center gap-3">
                <span className="bg-amber-100 p-2 sm:p-3 rounded-2xl text-lg sm:text-xl">⏱️</span> Kitchen Timers
              </h2>
              <button onClick={() => setTimers([])} className="text-[10px] sm:text-sm text-red-500 font-black hover:underline tracking-widest uppercase">Dismiss All</button>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 sm:gap-8">
              {timers.map(timer => (
                <TimerItem 
                  key={timer.id} 
                  timer={timer} 
                  onToggle={(id) => setTimers(prev => prev.map(t => t.id === id ? {...t, status: t.status === 'running' ? 'paused' : 'running'} : t))} 
                  onReset={(id) => setTimers(prev => prev.map(t => t.id === id ? {...t, remaining: t.duration, status: 'idle'} : t))} 
                  onDelete={(id) => setTimers(prev => prev.filter(t => t.id !== id))} 
                />
              ))}
            </div>
          </section>
        )}
      </main>

      {/* Favorited Ingredients Modal */}
      {isFavIngredientsOpen && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-xl">
          <div className="bg-white rounded-[40px] sm:rounded-[64px] w-full max-w-3xl shadow-3xl overflow-hidden flex flex-col max-h-[90vh] p-6 sm:p-12 animate-in zoom-in duration-300">
            <div className="flex justify-between items-center mb-6 sm:mb-10">
              <div className="space-y-1">
                <h2 className="text-2xl sm:text-4xl font-black text-emerald-950 leading-none">Ingredient Stash</h2>
                <p className="text-slate-400 font-bold text-[10px] uppercase tracking-widest">Your frequent flyer items</p>
              </div>
              <button onClick={() => setIsFavIngredientsOpen(false)} className="p-3 sm:p-4 bg-slate-100 rounded-full text-slate-400 hover:text-red-500 hover:bg-red-50 transition-all">
                <svg className="w-5 h-5 sm:w-7 sm:h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>
            <div className="overflow-y-auto space-y-4 sm:space-y-6 pr-2 sm:pr-4 custom-scrollbar flex-1">
              {favIngredients.length === 0 ? (
                <div className="py-24 text-center space-y-4">
                  <p className="text-5xl sm:text-6xl grayscale opacity-20">🍃</p>
                  <p className="text-slate-400 font-black uppercase text-[10px] tracking-widest">No stashed items yet</p>
                </div>
              ) : (
                favIngredients.map(ing => (
                  <div key={ing.id} className="bg-slate-50 p-4 sm:p-6 rounded-[30px] sm:rounded-[40px] flex flex-col sm:flex-row items-center justify-between gap-4 sm:gap-6 border border-slate-100 hover:bg-white hover:shadow-xl transition-all group">
                    <div className="flex items-center gap-4 sm:gap-6 w-full">
                      <div className="w-16 h-16 sm:w-24 sm:h-24 rounded-2xl sm:rounded-3xl bg-white overflow-hidden shadow-sm border border-slate-100 flex-shrink-0">
                        {ing.imageUrl && <img src={ing.imageUrl} className="w-full h-full object-cover" alt={ing.name} />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-black text-slate-900 text-lg sm:text-2xl mb-1 truncate">{ing.name}</p>
                        <p className="text-[8px] sm:text-xs text-slate-400 font-black uppercase tracking-widest">{ing.calories} kcal • {ing.protein} P</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 sm:gap-3 w-full sm:w-auto">
                      <button 
                        onClick={() => { addFromStashToFridge(ing); alert(`${ing.name} added to Fridge!`); }}
                        className="flex-1 sm:flex-none bg-emerald-600 text-white px-6 sm:px-8 py-3 sm:py-4 rounded-full font-black text-xs sm:text-sm hover:bg-black transition-all shadow-md active:scale-95"
                      >
                        Add
                      </button>
                      <button 
                        onClick={() => toggleFavIngredient(ing)}
                        className="p-3 sm:p-4 text-red-500 hover:bg-red-50 rounded-full transition-all"
                      >
                        <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="currentColor" viewBox="0 0 24 24"><path d="M19 13H5v-2h14v2z"/></svg>
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {activeRecipe && (
        <div className="fixed inset-0 z-[300] flex items-center justify-center p-2 sm:p-4 bg-slate-900/80 backdrop-blur-2xl">
          <div className="bg-white rounded-[40px] sm:rounded-[72px] w-full max-w-7xl shadow-3xl overflow-hidden flex flex-col h-[95vh] sm:h-[92vh] animate-in zoom-in duration-500">
            {!finishedImage ? (
              <div className="flex flex-col md:flex-row h-full overflow-hidden">
                <div className="w-full md:w-1/2 p-10 sm:p-20 flex flex-col items-center text-center overflow-y-auto bg-white custom-scrollbar">
                  <div className="mb-6 sm:mb-8 space-y-3 sm:space-y-4">
                    <h2 className="text-3xl sm:text-5xl font-serif font-black text-slate-900 leading-tight">{activeRecipe.title}</h2>
                    <div className="flex items-center justify-center gap-2 sm:gap-3">
                       <span className="bg-emerald-50 text-emerald-800 px-4 sm:px-5 py-2 rounded-full font-black text-[8px] sm:text-[10px] uppercase tracking-widest">Step {currentStepIdx + 1} of {activeRecipe.steps.length}</span>
                    </div>
                  </div>
                  <div className="my-8 sm:my-14 text-8xl sm:text-[160px] font-black text-emerald-600 tabular-nums leading-none tracking-tighter drop-shadow-sm">{formatTime(remainingTime)}</div>
                  <div className="mb-10 sm:mb-16 max-w-lg space-y-3 sm:space-y-4">
                    <h3 className="text-2xl sm:text-3xl font-black text-slate-800 tracking-tight">{activeRecipe.steps[currentStepIdx]?.label}</h3>
                    <p className="text-slate-400 text-base sm:text-xl font-medium leading-relaxed">"{activeRecipe.steps[currentStepIdx]?.instruction}"</p>
                  </div>
                  <div className="grid grid-cols-2 gap-4 sm:gap-6 w-full mt-auto">
                    <button 
                      onClick={() => setIsTimerRunning(!isTimerRunning)}
                      className={`py-6 sm:py-8 rounded-[30px] sm:rounded-[40px] font-black text-lg sm:text-2xl shadow-xl transition-all active:scale-95 ${isTimerRunning ? 'bg-slate-100 text-slate-700' : 'bg-emerald-700 text-white hover:bg-emerald-800'}`}
                    >
                      {isTimerRunning ? 'Pause' : 'Start'}
                    </button>
                    <button onClick={handleNextStep} className="py-6 sm:py-8 bg-black text-white rounded-[30px] sm:rounded-[40px] font-black text-lg sm:text-2xl hover:bg-slate-900 transition shadow-xl active:scale-95">Next</button>
                  </div>
                </div>
                <div className="w-full md:w-1/2 bg-slate-100 relative overflow-hidden group min-h-[300px] md:min-h-0">
                  {stepImages[currentStepIdx] ? (
                    <img src={stepImages[currentStepIdx]} className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-105" alt="Cooking Step" />
                  ) : (
                    <div className="w-full h-full flex flex-col items-center justify-center gap-4 sm:gap-6">
                      <div className="w-12 h-12 sm:w-16 sm:h-16 border-4 border-emerald-100 border-t-emerald-600 rounded-full animate-spin" />
                      <div className="text-emerald-300 font-black uppercase text-[8px] sm:text-xs tracking-[0.4em] animate-pulse">Visualizing Sequence...</div>
                    </div>
                  )}
                  <button onClick={closeRecipeOverlay} className="absolute top-6 sm:top-12 right-6 sm:right-12 p-4 sm:p-6 bg-white/30 hover:bg-white/50 backdrop-blur-xl rounded-full text-white shadow-2xl transition-all active:scale-90">
                    <svg className="w-6 h-6 sm:w-8 sm:h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
                  </button>
                </div>
              </div>
            ) : (
              <div className="h-full flex flex-col items-center justify-between p-10 sm:p-20 text-center animate-in zoom-in duration-1000 bg-white">
                <div className="space-y-4">
                  <h2 className="text-4xl sm:text-7xl font-serif font-black text-emerald-950">Bon Appétit!</h2>
                  <p className="text-slate-300 font-black uppercase tracking-[0.5em] text-[8px] sm:text-xs">A Culinary Masterpiece is Born</p>
                </div>

                <div className="flex-1 w-full max-w-5xl my-8 sm:my-12 relative rounded-[40px] sm:rounded-[80px] overflow-hidden shadow-3xl border-[12px] sm:border-[24px] border-emerald-50 group">
                  <img src={finishedImage} className="w-full h-full object-cover transition-transform duration-2000 group-hover:scale-110" alt="Finished Dish" />
                </div>

                <div className="w-full max-w-md">
                  <button 
                    onClick={closeRecipeOverlay}
                    className="w-full py-6 sm:py-9 bg-emerald-950 text-white rounded-[32px] sm:rounded-[48px] font-black text-xl sm:text-3xl hover:bg-black transition-all shadow-3xl active:scale-95"
                  >
                    Finish Session
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default App;
