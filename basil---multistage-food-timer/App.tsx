
import React, { useState, useEffect, useRef } from 'react';
import { Ingredient, Recipe, Timer, CountryCode, MealReminder, Restaurant, BlogPost } from './types';
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
  getVegRestaurants
} from './services/geminiService';
import { COUNTRIES, STATES, AILMENTS, INITIAL_REMINDERS, PANTRY_SUGGESTIONS, DISH_SUGGESTIONS, TAB_BANNERS, BLOG_POSTS } from './constants';
import { Tab } from './types'

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
  <div className="bg-white border border-[#e5e1da] flex flex-col overflow-hidden relative group animate-luxe">
    <button 
      onClick={() => onToggleFavorite(ing)}
      className={`absolute top-4 right-4 z-10 p-2 transition-all ${isFavorite ? 'text-[#1a1a1a]' : 'text-slate-300 hover:text-[#1a1a1a]'}`}
    >
      <svg className="w-5 h-5" fill={isFavorite ? 'currentColor' : 'none'} stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"/></svg>
    </button>
    
    <div className="aspect-[4/5] bg-[#fdfbf7] overflow-hidden relative border-b border-[#e5e1da]">
      {ing.imageUrl ? (
        <img src={ing.imageUrl} alt={ing.name} className="w-full h-full object-cover group-hover:scale-105 transition duration-[2s] ease-out" />
      ) : (
        <div className="w-full h-full flex items-center justify-center text-[#d1cfc7] font-serif italic">The Harvest...</div>
      )}
    </div>

    <div className="p-6 flex-1 flex flex-col">
      <div className="mb-4">
        <h3 className="font-serif text-2xl text-[#1a1a1a] mb-1 tracking-tight">{ing.name}</h3>
        <span className="text-[10px] text-slate-400 font-medium tracking-widest">{ing.calories} CALORIES / 100G</span>
      </div>

      <div className="flex-1">
        <p className="text-[#666] text-xs leading-relaxed mb-6 font-light">
          <span className="text-[#1a1a1a] font-semibold text-[9px] tracking-widest block mb-2">NOTES</span>
          {ing.properties}
        </p>
      </div>

      <div className="space-y-2 mt-auto">
        <a 
          href={buyLink}
          target="_blank"
          rel="noopener noreferrer"
          className="w-full block border border-[#1a1a1a] text-[#1a1a1a] py-3 text-[10px] tracking-widest text-center hover:bg-[#1a1a1a] hover:text-white transition-all duration-500 uppercase"
        >
          Sourcing in {countryName}
        </a>
        {isExplore && onAddToFridge && (
          <button 
            onClick={() => onAddToFridge(ing)}
            className="w-full bg-[#1a1a1a] text-white py-3 text-[10px] tracking-widest hover:bg-black transition-all duration-500 uppercase"
          >
            Add to Pantry
          </button>
        )}
      </div>
    </div>
  </div>
);

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<Tab>('discover');
  const [activeBlogPost, setActiveBlogPost] = useState<BlogPost | null>(null);
  const [ingredients, setIngredients] = useState<Ingredient[]>([]);
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [manualRecipes, setManualRecipes] = useState<Recipe[]>([]);
  const [favIngredients, setFavIngredients] = useState<Ingredient[]>([]);
  const [favRecipes, setFavRecipes] = useState<Recipe[]>([]);
  
  const [country, setCountry] = useState<CountryCode>('US');
  const [state, setState] = useState<string>('');

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
  const [pantrySearch, setPantrySearch] = useState('');

  // Header & Mobile Nav state
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isMoreMenuOpen, setIsMoreMenuOpen] = useState(false);
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [isRemindersTrayOpen, setIsRemindersTrayOpen] = useState(false);

  // New features state
  const [selectedAilment, setSelectedAilment] = useState(AILMENTS[0].id);
  const [herbalRecipes, setHerbalRecipes] = useState<Recipe[]>([]);
  const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
  const [reminders, setReminders] = useState<MealReminder[]>(INITIAL_REMINDERS);

  const [newRecipe, setNewRecipe] = useState<Partial<Recipe>>({
    title: '',
    description: '',
    difficulty: 'Easy',
    totalTime: '',
    steps: [{ label: '', instruction: '', durationSeconds: 60 }]
  });

  const fileInputRef = useRef<HTMLInputElement>(null);
  const moreMenuRef = useRef<HTMLDivElement>(null);
  const filterRef = useRef<HTMLDivElement>(null);

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
      const savedManual = localStorage.getItem('basil_manual_recipes');
      if (savedManual) setManualRecipes(JSON.parse(savedManual));

      const savedFavIngredients = localStorage.getItem('basil_stash_ingredients');
      if (savedFavIngredients) setFavIngredients(JSON.parse(savedFavIngredients));

      const savedFavRecipes = localStorage.getItem('basil_stash_recipes');
      if (savedFavRecipes) setFavRecipes(JSON.parse(savedFavRecipes));

      const savedLocation = localStorage.getItem('basil_location');
      if (savedLocation) {
        const loc = JSON.parse(savedLocation);
        setCountry(loc.country);
        setState(loc.state);
      }

      const savedReminders = localStorage.getItem('basil_reminders');
      if (savedLocation) {
        // Fallback for earlier save format
      }
      const savedRemindersData = localStorage.getItem('basil_reminders');
      if (savedRemindersData) setReminders(JSON.parse(savedRemindersData));
    } catch (e) {
      console.error('Failed to load from local storage:', e);
    }
  }, []);

  useEffect(() => safeSave('basil_manual_recipes', manualRecipes), [manualRecipes]);
  useEffect(() => safeSave('basil_stash_ingredients', favIngredients), [favIngredients]);
  useEffect(() => safeSave('basil_stash_recipes', favRecipes), [favRecipes]);
  useEffect(() => safeSave('basil_location', { country, state }), [country, state]);
  useEffect(() => safeSave('basil_reminders', reminders), [reminders]);

  // Close menus when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (moreMenuRef.current && !moreMenuRef.current.contains(event.target as Node)) {
        setIsMoreMenuOpen(false);
      }
      if (filterRef.current && !filterRef.current.contains(event.target as Node)) {
        setIsFilterOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Triggers
  useEffect(() => {
    if (activeTab === 'explore') fetchRegionalDishes();
    if (activeTab === 'health') fetchHerbalRecipes(selectedAilment);
    if (activeTab === 'restaurants') fetchRestaurants();
    if (activeTab !== 'blog') setActiveBlogPost(null);
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

  const updateReminder = (id: string, updates: Partial<MealReminder>) => {
    setReminders(prev => prev.map(r => r.id === id ? { ...r, ...updates } : r));
  };

  const addReminder = () => {
    const newR: MealReminder = {
      id: Math.random().toString(36).substr(2, 9),
      label: 'CUSTOM MEAL',
      time: '12:00',
      enabled: true
    };
    setReminders([...reminders, newR]);
  };

  useEffect(() => {
    const checkInterval = setInterval(() => {
      const now = new Date();
      const currentTime = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
      
      reminders.forEach(r => {
        if (r.enabled && r.time === currentTime && now.getSeconds() === 0) {
          if ('Notification' in window && Notification.permission === 'granted') {
            new Notification(`Basil: Time for ${r.label}!`, {
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
      setRecipes([]); // clear previous auto-suggestions if any
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
    alert('Composition Saved.');
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

  const getCountryName = () => COUNTRIES.find(c => c.code === country)?.name || 'STORE';

  return (
    <div className="min-h-screen bg-[#fdfbf7] text-[#1a1a1a] pb-32">
      {/* Header - Aligned Left with More Menu */}
      <header className="bg-white border-b border-[#e5e1da] sticky top-0 z-[100] py-4 sm:py-6">
        <div className="max-w-7xl mx-auto px-6 flex items-center justify-between">
          <div className="text-left space-y-0.5" onClick={() => setActiveTab('discover')} style={{ cursor: 'pointer' }}>
            <h1 className="text-4xl sm:text-5xl font-serif tracking-tighter text-[#1a1a1a]">Basil</h1>
            <p className="text-[9px] sm:text-xs tracking-[0.4em] uppercase text-[#666] font-medium whitespace-nowrap">For those with taste</p>
          </div>
          
          <div className="flex items-center gap-4">
            {/* Desktop Navigation */}
            <nav className="hidden lg:flex items-center gap-1">
              {['discover', 'explore', 'health', 'restaurants'].map((t) => (
                <button 
                  key={t}
                  onClick={() => setActiveTab(t as Tab)}
                  className={`px-4 py-2 text-[10px] tracking-[0.2em] uppercase transition-all duration-300 ${activeTab === t ? 'text-[#1a1a1a] font-bold border-b border-[#1a1a1a]' : 'text-slate-400 hover:text-[#1a1a1a]'}`}
                >
                  {t}
                </button>
              ))}
              
              {/* More Dropdown */}
              <div className="relative ml-2" ref={moreMenuRef}>
                <button 
                  onClick={() => setIsMoreMenuOpen(!isMoreMenuOpen)}
                  className={`px-4 py-2 text-[10px] tracking-[0.2em] uppercase transition-all duration-300 flex items-center gap-1 ${['custom', 'favorites', 'blog'].includes(activeTab) ? 'text-[#1a1a1a] font-bold border-b border-[#1a1a1a]' : 'text-slate-400 hover:text-[#1a1a1a]'}`}
                >
                  More
                  <svg className={`w-3 h-3 transition-transform ${isMoreMenuOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" /></svg>
                </button>
                
                {isMoreMenuOpen && (
                  <div className="absolute right-0 mt-2 w-48 bg-white border border-[#e5e1da] shadow-xl p-2 animate-luxe">
                    <button onClick={() => { setActiveTab('custom'); setIsMoreMenuOpen(false); }} className={`w-full text-left px-4 py-3 text-[10px] tracking-widest uppercase hover:bg-[#fdfbf7] ${activeTab === 'custom' ? 'font-bold bg-[#fdfbf7]' : ''}`}>Custom Lab</button>
                    <button onClick={() => { setActiveTab('favorites'); setIsMoreMenuOpen(false); }} className={`w-full text-left px-4 py-3 text-[10px] tracking-widest uppercase hover:bg-[#fdfbf7] ${activeTab === 'favorites' ? 'font-bold bg-[#fdfbf7]' : ''}`}>Favorites</button>
                    <button onClick={() => { setActiveTab('blog'); setIsMoreMenuOpen(false); }} className={`w-full text-left px-4 py-3 text-[10px] tracking-widest uppercase hover:bg-[#fdfbf7] ${activeTab === 'blog' ? 'font-bold bg-[#fdfbf7]' : ''}`}>The Journal</button>
                  </div>
                )}
              </div>
            </nav>

            <div className="flex items-center gap-2 sm:gap-4">
              <button 
                onClick={() => setIsRemindersTrayOpen(!isRemindersTrayOpen)}
                className="p-2 text-slate-400 hover:text-[#1a1a1a] transition-colors"
                title="Meal Alerts"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="1" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" /></svg>
              </button>

              {/* Mobile Menu Trigger */}
              <button 
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                className="lg:hidden p-2 text-slate-400 hover:text-[#1a1a1a] transition-colors"
                title="Menu"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" /></svg>
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Static Banner Area */}
      <section className="w-full h-48 sm:h-72 overflow-hidden relative">
        <img 
          src={TAB_BANNERS[activeTab]} 
          alt={`${activeTab} banner`} 
          className="w-full h-full object-cover grayscale brightness-75 hover:grayscale-0 hover:brightness-100 transition-all duration-[2s] ease-out"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[#fdfbf7] via-transparent to-transparent opacity-60"></div>
      </section>

      {/* Mobile Menu Overlay */}
      {isMobileMenuOpen && (
        <div className="fixed inset-0 z-[110] lg:hidden bg-white/95 backdrop-blur-md animate-luxe overflow-y-auto">
          <div className="p-8 space-y-12">
            <div className="flex justify-between items-center border-b border-[#e5e1da] pb-8">
              <div className="text-left space-y-1">
                <h1 className="text-5xl font-serif tracking-tighter text-[#1a1a1a]">Basil</h1>
                <p className="text-[10px] tracking-[0.4em] uppercase text-[#666] font-medium">Navigation</p>
              </div>
              <button onClick={() => setIsMobileMenuOpen(false)} className="p-2 text-[#1a1a1a]">
                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1" d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>
            
            <nav className="flex flex-col gap-10">
              {['discover', 'explore', 'health', 'restaurants', 'custom', 'favorites', 'blog'].map((t) => (
                <button 
                  key={t}
                  onClick={() => { setActiveTab(t as Tab); setIsMobileMenuOpen(false); }}
                  className={`text-3xl font-serif text-left tracking-tight transition-all duration-300 ${activeTab === t ? 'text-[#1a1a1a] border-l-8 border-[#1a1a1a] pl-6' : 'text-slate-400 hover:text-[#1a1a1a]'}`}
                >
                  <span className="uppercase text-[10px] tracking-[0.3em] block mb-1 opacity-50">{t}</span>
                  {t === 'blog' ? 'The Journal' : t.charAt(0).toUpperCase() + t.slice(1)}
                </button>
              ))}
            </nav>
          </div>
        </div>
      )}

      {/* Reminders Tray UI */}
      {isRemindersTrayOpen && (
        <div className="fixed top-24 sm:top-32 right-6 sm:right-10 z-[150] w-[calc(100vw-3rem)] max-w-sm animate-luxe">
          <div className="bg-white shadow-2xl border border-[#e5e1da] p-6 sm:p-10 space-y-8 sm:space-y-10">
            <div className="flex justify-between items-center border-b border-[#e5e1da] pb-4">
              <h3 className="text-xs tracking-[0.3em] font-bold text-[#1a1a1a]">MEAL ALERTS</h3>
              <button onClick={requestNotificationPermission} className="text-[9px] font-bold text-slate-400 hover:text-[#1a1a1a] tracking-widest uppercase">BROWSER ACCESS</button>
            </div>
            <div className="space-y-6">
              {reminders.map(r => (
                <div key={r.id} className="flex items-center justify-between pb-4 border-b border-[#f3f1ed]">
                  <div className="flex-1 space-y-1">
                    <input 
                      type="text" 
                      value={r.label}
                      onChange={(e) => updateReminder(r.id, { label: e.target.value.toUpperCase() })}
                      className="text-[11px] font-bold tracking-[0.2em] text-[#1a1a1a] bg-transparent outline-none w-full"
                    />
                    <input 
                      type="time" 
                      value={r.time} 
                      onChange={(e) => updateReminder(r.id, { time: e.target.value })}
                      className="text-xs font-light text-slate-400 bg-transparent outline-none"
                    />
                  </div>
                  <button 
                    onClick={() => updateReminder(r.id, { enabled: !r.enabled })}
                    className={`w-10 h-5 border border-[#1a1a1a] p-0.5 transition-all ${r.enabled ? 'bg-[#1a1a1a]' : 'bg-transparent'}`}
                  >
                    <div className={`h-full aspect-square transition-all ${r.enabled ? 'translate-x-5 bg-white' : 'translate-x-0 bg-[#1a1a1a]'}`}></div>
                  </button>
                </div>
              ))}
            </div>
            
            <button 
              onClick={addReminder}
              className="w-full py-4 text-[9px] tracking-[0.3em] font-bold text-[#1a1a1a] border border-[#1a1a1a] hover:bg-[#1a1a1a] hover:text-white transition-all"
            >
              + ADD NEW ALERT
            </button>
          </div>
        </div>
      )}

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-6 mt-16 space-y-32">
        {activeTab === 'discover' && (
          <section className="space-y-16">
            <div className="space-y-12">
              <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-8">
                <div className="text-left space-y-1">
                  <h2 className="text-2xl sm:text-3xl font-serif tracking-tight text-[#1a1a1a]">Your Pantry</h2>
                  <p className="text-[10px] tracking-[0.4em] uppercase text-slate-400">Curate your ingredients list</p>
                </div>
                
                <div className="flex items-center justify-start gap-4">
                  {/* Filter Popup */}
                  <div className="relative" ref={filterRef}>
                    <button 
                      onClick={() => setIsFilterOpen(!isFilterOpen)}
                      className={`p-3 border border-[#e5e1da] text-[#1a1a1a] hover:bg-[#1a1a1a] hover:text-white transition-all ${isFilterOpen ? 'bg-[#1a1a1a] text-white' : ''}`}
                      title="Filter by Region"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="1" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M12 3c2.755 0 5.455.232 8.083.678.533.09.917.556.917 1.096v1.044a2.25 2.25 0 01-.659 1.591l-5.432 5.432a2.25 2.25 0 00-.659 1.591v2.927a2.25 2.25 0 01-1.244 2.013L9.75 21v-6.568a2.25 2.25 0 00-.659-1.591L3.659 7.409A2.25 2.25 0 013 5.818V4.774c0-.54.384-1.006.917-1.096A48.32 48.32 0 0112 3z" /></svg>
                    </button>
                    
                    {isFilterOpen && (
                      <div className="absolute right-0 mt-2 w-64 bg-white border border-[#e5e1da] shadow-xl p-6 z-[110] animate-luxe">
                        <div className="space-y-6">
                          <div className="space-y-2">
                            <label className="text-[9px] font-bold text-slate-400 tracking-widest uppercase">Country</label>
                            <select 
                              value={country} 
                              onChange={(e) => { setCountry(e.target.value as CountryCode); setState(''); }} 
                              className="w-full bg-transparent border-b border-[#e5e1da] py-2 text-[10px] tracking-widest font-bold outline-none focus:border-[#1a1a1a] uppercase"
                            >
                              {COUNTRIES.map(c => <option key={c.code} value={c.code}>{c.name}</option>)}
                            </select>
                          </div>
                          <div className="space-y-2">
                            <label className="text-[9px] font-bold text-slate-400 tracking-widest uppercase">Region</label>
                            <select 
                              value={state} 
                              onChange={(e) => setState(e.target.value)} 
                              className="w-full bg-transparent border-b border-[#e5e1da] py-2 text-[10px] tracking-widest font-bold outline-none focus:border-[#1a1a1a] uppercase"
                              disabled={!STATES[country]}
                            >
                              <option value="">ALL REGIONS</option>
                              {STATES[country]?.map(s => <option key={s} value={s.toUpperCase()}>{s.toUpperCase()}</option>)}
                            </select>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>

                  <button onClick={() => setIsFavIngredientsOpen(true)} className="p-3 border border-[#e5e1da] text-[#1a1a1a] hover:bg-[#1a1a1a] hover:text-white transition-all" title="Archive">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" /></svg>
                  </button>
                  <button onClick={() => fileInputRef.current?.click()} className="flex items-center gap-3 px-6 py-3 bg-[#1a1a1a] text-white text-[10px] tracking-[0.2em] font-bold hover:bg-black transition-all">
                    SCAN IMAGE
                  </button>
                  <input type="file" ref={fileInputRef} onChange={handleFileChange} className="hidden" accept="image/*" />
                </div>
              </div>
              
              <div className="space-y-8">
                <div className="flex items-center bg-[#fdfbf7]">
                  <div className="flex-1 flex items-center bg-white border border-[#e5e1da] h-12 sm:h-14 shadow-sm overflow-hidden group focus-within:border-[#1a1a1a] transition-all">
                    <input 
                      value={pantrySearch}
                      onChange={(e) => setPantrySearch(e.target.value)}
                      onKeyDown={(e) => { if(e.key === 'Enter') { addIngredientByText(pantrySearch); setPantrySearch(''); } }} 
                      type="text" 
                      placeholder="Type an ingredient name..." 
                      className="flex-1 h-full px-8 text-sm font-light outline-none bg-transparent placeholder:text-slate-400" 
                    />
                    <button onClick={() => { addIngredientByText(pantrySearch); setPantrySearch(''); }} className="w-12 sm:w-14 h-full bg-[#1a1a1a] flex items-center justify-center text-white hover:bg-black transition-colors">
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" /></svg>
                    </button>
                  </div>
                </div>

                <div className="space-y-4 px-2">
                  <p className="text-[11px] tracking-widest text-slate-500 font-medium">Suggestions:</p>
                  <div className="flex flex-wrap gap-2">
                    {PANTRY_SUGGESTIONS.map(s => (
                      <button 
                        key={s} 
                        onClick={() => { addIngredientByText(s); }}
                        className="bg-[#f3f1ed] px-5 py-2.5 text-[10px] tracking-widest font-medium hover:bg-[#e5e1da] transition-colors uppercase"
                      >
                        {s}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
            
            {isLoading && <div className="text-center py-24 italic font-serif text-2xl text-slate-300 animate-pulse">Consulting the archives...</div>}

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-x-8 gap-y-16">
              {ingredients.map(ing => <IngredientCard key={ing.id} ing={ing} isFavorite={favIngredients.some(f => f.name.toLowerCase() === ing.name.toLowerCase())} onToggleFavorite={toggleFavIngredient} buyLink={getBuyLink(ing.name)} countryName={getCountryName()} />)}
            </div>

            {ingredients.length > 0 && !isLoading && (
              <div className="flex justify-center pt-16">
                <button onClick={getSuggestions} className="group relative flex flex-col items-center gap-4">
                  <span className="text-[10px] tracking-[0.4em] text-slate-400 group-hover:text-[#1a1a1a] transition-all">COMPOSE CUISINE</span>
                  <div className="w-12 h-[1px] bg-[#e5e1da] group-hover:w-24 transition-all duration-700"></div>
                </button>
              </div>
            )}
          </section>
        )}

        {activeTab === 'explore' && (
          <section className="space-y-32 animate-luxe">
            <div className="space-y-12">
              <div className="text-left space-y-1">
                <h2 className="text-2xl sm:text-3xl font-serif tracking-tighter">The Discovery</h2>
                <p className="text-[10px] tracking-[0.4em] text-slate-400 uppercase">Consult the global archives</p>
              </div>

              <div className="space-y-8">
                <div className="flex items-center bg-[#fdfbf7]">
                  <div className="flex-1 flex items-center bg-white border border-[#e5e1da] h-12 sm:h-14 shadow-sm overflow-hidden group focus-within:border-[#1a1a1a] transition-all">
                    <input 
                      value={exploreSearch}
                      onChange={(e) => setExploreSearch(e.target.value)}
                      onKeyDown={(e) => { if(e.key === 'Enter') runExplore(exploreSearch); }} 
                      type="text" 
                      placeholder="Search for a dish to explore..." 
                      className="flex-1 h-full px-8 text-sm font-light outline-none bg-transparent placeholder:text-slate-400" 
                    />
                    <button onClick={() => runExplore(exploreSearch)} className="w-12 sm:w-14 h-full bg-[#1a1a1a] flex items-center justify-center text-white hover:bg-black transition-colors">
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" /></svg>
                    </button>
                  </div>
                </div>

                <div className="space-y-4 px-2">
                  <p className="text-[11px] tracking-widest text-slate-500 font-medium">Suggestions:</p>
                  <div className="flex flex-wrap gap-2">
                    {DISH_SUGGESTIONS.map(s => (
                      <button 
                        key={s} 
                        onClick={() => runExplore(s)}
                        className="bg-[#f3f1ed] px-5 py-2.5 text-[10px] tracking-widest font-medium hover:bg-[#e5e1da] transition-colors uppercase"
                      >
                        {s}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            <div className="space-y-16">
              <h3 className="text-xs tracking-[0.5em] text-left text-slate-400 px-2 uppercase">REGIONAL CURIOSITIES</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
                {regionalDishes.map((dish, idx) => (
                  <div key={idx} className="group cursor-pointer space-y-6" onClick={() => runExplore(dish.name)}>
                    <div className="aspect-square bg-slate-50 overflow-hidden border border-[#e5e1da]">
                      {dish.imageUrl && <img src={dish.imageUrl} alt={dish.name} className="w-full h-full object-cover grayscale group-hover:grayscale-0 group-hover:scale-105 transition duration-[2s] ease-out" />}
                    </div>
                    <div className="text-left">
                      <h4 className="text-2xl font-serif mb-2">{dish.name}</h4>
                      <p className="text-[10px] text-slate-400 font-light leading-relaxed">"{dish.description}"</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </section>
        )}

        {activeTab === 'restaurants' && (
          <section className="space-y-24 animate-luxe">
            <div className="text-left space-y-1">
              <h2 className="text-2xl sm:text-3xl font-serif tracking-tighter">The Dining Room</h2>
              <p className="text-[10px] tracking-[0.4em] text-slate-400 uppercase">Refined Establishments in {state || country}</p>
            </div>

            {isRestaurantsLoading ? (
              <div className="text-center py-24 italic font-serif text-slate-300">Searching for the finest greens...</div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
                {restaurants.map(rest => (
                  <div key={rest.id} className="group border border-[#e5e1da] bg-white">
                    <div className="aspect-[4/3] overflow-hidden grayscale hover:grayscale-0 transition-all duration-1000 border-b border-[#e5e1da]">
                      {rest.imageUrl ? (
                        <img src={rest.imageUrl} alt={rest.name} className="w-full h-full object-cover group-hover:scale-105 transition duration-[2s]" />
                      ) : (
                        <div className="w-full h-full bg-[#fdfbf7] flex items-center justify-center font-serif text-[#d1cfc7]">Establishment</div>
                      )}
                    </div>
                    <div className="p-8 text-left space-y-6">
                      <div className="space-y-1">
                        <h3 className="text-2xl font-serif tracking-tight">{rest.name}</h3>
                        <div className="flex justify-start gap-3 text-[9px] tracking-widest text-slate-400 font-bold">
                          <span>{rest.priceLevel}</span>
                          <span>•</span>
                          <span>{rest.rating} STARS</span>
                        </div>
                      </div>
                      <p className="text-xs text-[#666] leading-relaxed px-1">"{rest.description}"</p>
                      <button className="w-full py-4 text-[10px] tracking-[0.3em] border border-[#1a1a1a] hover:bg-[#1a1a1a] hover:text-white transition-all uppercase font-bold">Inquire & Order</button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>
        )}

        {activeTab === 'health' && (
          <section className="space-y-24 animate-luxe">
            <div className="text-left space-y-8">
              <div className="space-y-1">
                <h2 className="text-2xl sm:text-3xl font-serif tracking-tighter">The Apothecary</h2>
                <p className="text-[10px] tracking-[0.4em] text-slate-400 uppercase">Natural Remedies & Vitality</p>
              </div>
              <div className="flex flex-wrap justify-start gap-1">
                {AILMENTS.map((a) => (
                  <button key={a.id} onClick={() => setSelectedAilment(a.id)} className={`px-8 py-3 text-[10px] tracking-[0.3em] transition-all duration-500 border ${selectedAilment === a.id ? 'bg-[#1a1a1a] text-white border-[#1a1a1a]' : 'text-slate-400 border-transparent hover:border-[#e5e1da]'}`}>
                    {a.label}
                  </button>
                ))}
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
              {herbalRecipes.map(recipe => (
                <div key={recipe.id} className="group border border-[#e5e1da] bg-white">
                  <div className="aspect-[4/5] overflow-hidden border-b border-[#e5e1da]">
                    {recipe.imageUrl && <img src={recipe.imageUrl} alt={recipe.title} className="w-full h-full object-cover transition duration-[3s] group-hover:scale-105" />}
                  </div>
                  <div className="p-10 text-left space-y-8">
                    <h3 className="text-2xl font-serif tracking-tight">{recipe.title}</h3>
                    <p className="text-xs text-[#666] leading-relaxed">"{recipe.description}"</p>
                    <button onClick={() => startRecipe(recipe)} className="text-[10px] tracking-[0.4em] font-bold border-b border-[#1a1a1a] pb-1 hover:pb-3 transition-all uppercase">BEGIN PREPARATION</button>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {activeTab === 'custom' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-24 animate-luxe">
            <section className="lg:col-span-8 space-y-12">
              <div className="text-left space-y-1">
                <h2 className="text-2xl sm:text-3xl font-serif tracking-tighter">Composition Lab</h2>
                <p className="text-[10px] tracking-[0.4em] text-slate-400 uppercase">DRAFTING YOUR UNIQUE SEQUENCES</p>
              </div>
              <div className="space-y-12 max-w-2xl">
                <div className="space-y-4">
                  <label className="text-[9px] font-bold text-slate-400 tracking-[0.4em] uppercase">Composition Title</label>
                  <input 
                    type="text" 
                    value={newRecipe.title} 
                    onChange={e => setNewRecipe(prev => ({...prev, title: e.target.value.toUpperCase()}))}
                    placeholder="E.G. MIDNIGHT GARDEN RISOTTO" 
                    className="w-full py-4 text-2xl font-serif border-b border-[#e5e1da] bg-transparent outline-none focus:border-[#1a1a1a] transition-all"
                  />
                </div>
                {/* Manual recipe form starts here... */}
                <div className="space-y-4">
                  <label className="text-[9px] font-bold text-slate-400 tracking-[0.4em] uppercase">Manifesto</label>
                  <textarea 
                    value={newRecipe.description}
                    onChange={e => setNewRecipe(prev => ({...prev, description: e.target.value}))}
                    placeholder="The story behind this flavor..." 
                    className="w-full h-32 py-4 text-sm font-light italic border-b border-[#e5e1da] bg-transparent outline-none focus:border-[#1a1a1a] transition-all resize-none"
                  />
                </div>
                <div className="flex justify-between items-center pt-8">
                  <h3 className="text-xs tracking-[0.4em] font-bold">PREPARATION STEPS</h3>
                  <button 
                    onClick={() => setNewRecipe(p => ({...p, steps: [...(p.steps||[]), {label:'', instruction:'', durationSeconds:60}]}))} 
                    className="text-[9px] tracking-[0.2em] font-bold border border-[#1a1a1a] px-4 py-2 hover:bg-[#1a1a1a] hover:text-white transition-all uppercase"
                  >
                    + ADD MOVEMENT
                  </button>
                </div>
                <div className="space-y-12">
                  {newRecipe.steps?.map((s, i) => (
                    <div key={i} className="space-y-8 pb-12 border-b border-[#f3f1ed] relative group">
                      <div className="absolute -left-12 top-0 text-serif text-4xl text-[#e5e1da] font-light">{(i+1).toString().padStart(2, '0')}</div>
                      <input type="text" placeholder="MOVEMENT NAME (E.G. INFUSION)" value={s.label} onChange={e => {
                        const ns = [...(newRecipe.steps||[])]; ns[i].label = e.target.value.toUpperCase(); setNewRecipe(p=>({...p, steps:ns}));
                      }} className="w-full bg-transparent text-sm tracking-[0.2em] font-bold outline-none border-none placeholder:text-[#d1cfc7]" />
                      <textarea placeholder="Instructional detail..." value={s.instruction} onChange={e => {
                        const ns = [...(newRecipe.steps||[])]; ns[i].instruction = e.target.value; setNewRecipe(p=>({...p, steps:ns}));
                      }} className="w-full bg-transparent text-xs font-light italic leading-relaxed outline-none border-none h-20 placeholder:text-[#d1cfc7]" />
                      <div className="flex items-center gap-4">
                        <span className="text-[8px] font-bold text-slate-400 tracking-widest uppercase">SECONDS</span>
                        <input type="number" value={s.durationSeconds} onChange={e => {
                          const ns = [...(newRecipe.steps||[])]; ns[i].durationSeconds = parseInt(e.target.value); setNewRecipe(p=>({...p, steps:ns}));
                        }} className="w-20 bg-[#fdfbf7] border-b border-[#e5e1da] py-1 text-xs font-bold text-center outline-none focus:border-[#1a1a1a]" />
                      </div>
                    </div>
                  ))}
                </div>
                <button onClick={saveManualRecipe} className="w-full py-6 bg-[#1a1a1a] text-white text-[10px] tracking-[0.4em] font-bold hover:bg-black transition-all uppercase shadow-2xl">ARCHIVE COMPOSITION</button>
              </div>
            </section>
            <section className="lg:col-span-4 space-y-12">
              <h2 className="text-xs tracking-[0.4em] font-bold text-slate-400 uppercase">Personal Library</h2>
              <div className="space-y-12">
                {manualRecipes.length === 0 ? (
                  <div className="py-24 text-center border border-[#e5e1da] border-dashed italic text-slate-300 font-serif">No personal archives found.</div>
                ) : (
                  manualRecipes.map(r => (
                    <div key={r.id} className="border border-[#e5e1da] p-10 bg-white group hover:border-[#1a1a1a] transition-all space-y-6">
                      <h3 className="text-xl font-serif tracking-tight">{r.title}</h3>
                      <p className="text-[10px] text-slate-400 leading-relaxed line-clamp-2">"{r.description}"</p>
                      <button onClick={() => startRecipe(r)} className="w-full py-3 text-[9px] tracking-[0.3em] font-bold border border-[#1a1a1a] group-hover:bg-[#1a1a1a] group-hover:text-white transition-all uppercase">EXECUTE</button>
                    </div>
                  ))
                )}
              </div>
            </section>
          </div>
        )}

        {activeTab === 'favorites' && (
          <section className="space-y-24 animate-luxe">
            <div className="text-left space-y-1">
              <h2 className="text-2xl sm:text-3xl font-serif tracking-tighter">The Vault</h2>
              <p className="text-[10px] tracking-[0.4em] text-slate-400 uppercase">YOUR CURATED SELECTION</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
              {favRecipes.length === 0 ? (
                <div className="col-span-full py-48 text-center border border-[#e5e1da] border-dashed italic text-slate-300 font-serif text-3xl">The vault is currently empty.</div>
              ) : (
                favRecipes.map(recipe => (
                  <div key={recipe.id} className="group border border-[#e5e1da] bg-white flex flex-col">
                    <button onClick={() => toggleFavRecipe(recipe)} className="absolute top-6 right-6 z-20 p-2 text-[#1a1a1a]"><svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/></svg></button>
                    <div className="aspect-square overflow-hidden border-b border-[#e5e1da]">
                      {recipe.imageUrl && <img src={recipe.imageUrl} alt={recipe.title} className="w-full h-full object-cover grayscale transition duration-[3s] group-hover:grayscale-0 group-hover:scale-105" />}
                    </div>
                    <div className="p-10 text-left space-y-6">
                      <h3 className="text-2xl font-serif tracking-tight">{recipe.title}</h3>
                      <button onClick={() => startRecipe(recipe)} className="w-full py-4 text-[9px] tracking-[0.4em] font-bold border border-[#1a1a1a] hover:bg-[#1a1a1a] hover:text-white transition-all uppercase">RE-EXECUTE</button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </section>
        )}

        {activeTab === 'blog' && (
          <section className="animate-luxe space-y-24">
            {!activeBlogPost ? (
              <div className="space-y-24">
                <div className="text-left space-y-1">
                  <h2 className="text-2xl sm:text-3xl font-serif tracking-tighter">The Journal</h2>
                  <p className="text-[10px] tracking-[0.4em] text-slate-400 uppercase">SCIENTIFIC PERSPECTIVES ON VITALITY</p>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-16">
                  {BLOG_POSTS.map(post => (
                    <article key={post.id} className="group cursor-pointer space-y-8" onClick={() => setActiveBlogPost(post)}>
                      <div className="aspect-[3/2] overflow-hidden border border-[#e5e1da]">
                        <img src={post.imageUrl} className="w-full h-full object-cover grayscale group-hover:grayscale-0 transition-all duration-1000 group-hover:scale-105" alt={post.title} />
                      </div>
                      <div className="space-y-4">
                        <div className="flex gap-4 text-[8px] tracking-[0.3em] font-bold text-slate-400 uppercase">
                          <span>{post.date}</span>
                          <span>•</span>
                          <span>{post.author}</span>
                        </div>
                        <h3 className="text-2xl font-serif leading-tight group-hover:text-slate-600 transition-colors">{post.title}</h3>
                        <p className="text-xs text-slate-500 leading-relaxed font-light italic">{post.excerpt}</p>
                        <button className="text-[9px] tracking-[0.4em] font-bold border-b border-[#1a1a1a] pb-1 uppercase">Read Movement</button>
                      </div>
                    </article>
                  ))}
                </div>
              </div>
            ) : (
              <div className="max-w-4xl mx-auto space-y-16 py-8">
                <button onClick={() => setActiveBlogPost(null)} className="flex items-center gap-4 group text-[10px] tracking-[0.4em] font-bold uppercase text-slate-400 hover:text-[#1a1a1a] transition-colors">
                  <svg className="w-5 h-5 group-hover:-translate-x-2 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1" d="M15 19l-7-7 7-7" /></svg>
                  BACK TO ARCHIVES
                </button>
                
                <div className="space-y-12">
                  <div className="space-y-6">
                    <div className="flex flex-wrap gap-3">
                      {activeBlogPost.tags.map(tag => (
                        <span key={tag} className="px-3 py-1 bg-[#f3f1ed] text-[8px] tracking-[0.2em] font-bold text-slate-500 uppercase">{tag}</span>
                      ))}
                    </div>
                    <h1 className="text-5xl sm:text-7xl font-serif tracking-tighter leading-none">{activeBlogPost.title}</h1>
                    <div className="flex justify-between items-center py-6 border-y border-[#e5e1da]">
                      <span className="text-[10px] tracking-[0.3em] font-bold uppercase">{activeBlogPost.author}</span>
                      <span className="text-[10px] tracking-[0.3em] font-bold text-slate-400">{activeBlogPost.date}</span>
                    </div>
                  </div>

                  <div className="aspect-video overflow-hidden border border-[#e5e1da]">
                    <img src={activeBlogPost.imageUrl} className="w-full h-full object-cover" alt={activeBlogPost.title} />
                  </div>

                  <div className="space-y-8 text-lg leading-relaxed font-light text-slate-700">
                    {activeBlogPost.content.split('\n\n').map((para, i) => (
                      <p key={i} className="first-letter:text-5xl first-letter:font-serif first-letter:float-left first-letter:mr-3 first-letter:mt-1">{para}</p>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </section>
        )}
      </main>

      {/* Overlay Step-by-Step */}
      {activeRecipe && (
        <div className="fixed inset-0 z-[300] flex items-center justify-center p-0 bg-white/95 backdrop-blur-md">
          <div className="w-full h-full flex flex-col animate-luxe overflow-hidden">
            {!finishedImage ? (
              <div className="flex flex-col md:flex-row h-full">
                <div className="w-full md:w-[45%] p-12 md:p-24 flex flex-col justify-center space-y-12 bg-white">
                  <div className="space-y-2">
                    <h2 className="text-5xl md:text-7xl font-serif tracking-tighter leading-none">{activeRecipe.title}</h2>
                    <p className="text-[10px] tracking-[0.4em] text-slate-400 uppercase font-bold">MOVEMENT {currentStepIdx + 1} OF {activeRecipe.steps.length}</p>
                  </div>
                  
                  <div className="space-y-4">
                    <div className="text-[120px] md:text-[200px] font-serif font-light leading-none tracking-tighter text-[#1a1a1a]">{formatTime(remainingTime)}</div>
                    <div className="w-24 h-[2px] bg-[#1a1a1a]"></div>
                  </div>

                  <div className="space-y-4 max-w-md">
                    <h3 className="text-xs tracking-[0.3em] font-bold uppercase">{activeRecipe.steps[currentStepIdx]?.label}</h3>
                    <p className="text-xl md:text-2xl font-serif italic text-slate-500 leading-relaxed">"{activeRecipe.steps[currentStepIdx]?.instruction}"</p>
                  </div>

                  <div className="flex gap-6 w-full pt-12">
                    <button onClick={() => setIsTimerRunning(!isTimerRunning)} className={`flex-1 py-5 text-[10px] tracking-[0.4em] font-bold border border-[#1a1a1a] transition-all duration-500 ${isTimerRunning ? 'bg-transparent text-[#1a1a1a]' : 'bg-[#1a1a1a] text-white'}`}>{isTimerRunning ? 'PAUSE SEQUENCE' : 'COMMENCE'}</button>
                    <button onClick={handleNextStep} className="flex-1 py-5 text-[10px] tracking-[0.4em] font-bold text-white bg-black hover:bg-zinc-800 transition-all">NEXT PHASE</button>
                  </div>
                </div>

                <div className="flex-1 bg-[#fdfbf7] relative overflow-hidden flex items-center justify-center p-12">
                  {stepImages[currentStepIdx] ? (
                    <img src={stepImages[currentStepIdx]} className="w-full h-full object-contain mix-blend-multiply opacity-90 transition duration-[5s] hover:scale-105" alt="Sequence Visual" />
                  ) : (
                    <div className="flex flex-col items-center gap-4">
                      <div className="w-8 h-[1px] bg-[#1a1a1a] animate-luxe" style={{animationIterationCount: 'infinite'}}></div>
                      <div className="text-[8px] tracking-[0.5em] text-slate-300 font-bold uppercase">RENDERING VISUALS</div>
                    </div>
                  )}
                  <button onClick={closeRecipeOverlay} className="absolute top-12 right-12 p-2 text-[#1a1a1a] hover:rotate-90 transition-transform duration-700">
                    <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1" d="M6 18L18 6M6 6l12 12" /></svg>
                  </button>
                </div>
              </div>
            ) : (
              <div className="h-full flex flex-col items-center justify-center p-24 text-center space-y-16 animate-luxe">
                <div className="space-y-4">
                  <h2 className="text-8xl font-serif tracking-tighter">Finis</h2>
                  <p className="text-xs tracking-[0.6em] text-slate-400 font-bold">A MASTERPIECE IS BORN</p>
                </div>
                <div className="max-w-4xl w-full aspect-square md:aspect-video overflow-hidden border border-[#e5e1da]">
                  <img src={finishedImage} className="w-full h-full object-cover grayscale transition duration-[5s] hover:grayscale-0" alt="Final Creation" />
                </div>
                <button onClick={closeRecipeOverlay} className="px-16 py-6 border border-[#1a1a1a] text-[10px] tracking-[0.5em] font-bold hover:bg-[#1a1a1a] hover:text-white transition-all uppercase">EXIT GALLERY</button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Ingredient Stash Modal */}
      {isFavIngredientsOpen && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-6 bg-white/90 backdrop-blur-sm">
          <div className="bg-[#fdfbf7] border border-[#e5e1da] w-full max-w-4xl h-[80vh] flex flex-col p-16 animate-luxe shadow-2xl">
            <div className="flex justify-between items-center mb-16 border-b border-[#e5e1da] pb-8">
              <div className="space-y-1">
                <h2 className="text-3xl font-serif tracking-tighter">The Pantry Archive</h2>
                <p className="text-[9px] tracking-[0.4em] text-slate-400 font-bold uppercase">RECURRING INGREDIENTS</p>
              </div>
              <button onClick={() => setIsFavIngredientsOpen(false)} className="p-2 text-slate-300 hover:text-[#1a1a1a] transition-colors"><svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1" d="M6 18L18 6M6 6l12 12" /></svg></button>
            </div>
            <div className="overflow-y-auto space-y-12 pr-6 custom-scrollbar flex-1">
              {favIngredients.map(ing => (
                <div key={ing.id} className="flex items-center justify-between pb-8 border-b border-[#f3f1ed] group transition-all">
                  <div className="flex items-center gap-12">
                    <div className="w-32 aspect-square bg-white border border-[#e5e1da] overflow-hidden grayscale group-hover:grayscale-0 transition-all duration-700">{ing.imageUrl && <img src={ing.imageUrl} className="w-full h-full object-cover" alt={ing.name} />}</div>
                    <div className="space-y-1">
                      <p className="font-serif text-3xl tracking-tight">{ing.name}</p>
                      <p className="text-[9px] text-slate-400 font-bold uppercase tracking-widest">{ing.calories} CALORIES / UNIT</p>
                    </div>
                  </div>
                  <button onClick={() => { addFromStashToFridge(ing); alert('Composition Updated.'); }} className="px-10 py-3 border border-[#1a1a1a] text-[9px] font-bold tracking-[0.3em] hover:bg-[#1a1a1a] hover:text-white transition-all uppercase">RESTOCK</button>
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
