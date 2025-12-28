
import React, { useState, useEffect, useRef } from 'react';
import { Ingredient, Recipe, CountryCode, MealReminder, Tab } from './types';
import { COUNTRIES, INITIAL_REMINDERS, TAB_BANNERS } from './constants';
import { RecipeOverlay } from './components/RecipeOverlay';
import { PantryArchiveModal } from './components/PantryArchiveModal';
import { MealRemindersTray } from './components/MealRemindersTray';
import { DiscoverTab } from './components/tabs/DiscoverTab';
import { ExploreTab } from './components/tabs/ExploreTab';
import { HealthTab } from './components/tabs/HealthTab';
import { RestaurantsTab } from './components/tabs/RestaurantsTab';
import { CustomLabTab } from './components/tabs/CustomLabTab';
import { FavoritesTab } from './components/tabs/FavoritesTab';
import { BlogTab } from './components/tabs/BlogTab';

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<Tab>('discover');
  const [ingredients, setIngredients] = useState<Ingredient[]>([]);
  const [manualRecipes, setManualRecipes] = useState<Recipe[]>([]);
  const [favIngredients, setFavIngredients] = useState<Ingredient[]>([]);
  const [favRecipes, setFavRecipes] = useState<Recipe[]>([]);
  const [country, setCountry] = useState<CountryCode>('US');
  const [state, setState] = useState<string>('');
  const [isGlobalLoading, setIsGlobalLoading] = useState(false);
  const [activeRecipe, setActiveRecipe] = useState<Recipe | null>(null);
  const [isFavArchiveOpen, setIsFavArchiveOpen] = useState(false);
  const [isRemindersTrayOpen, setIsRemindersTrayOpen] = useState(false);
  const [reminders, setReminders] = useState<MealReminder[]>(INITIAL_REMINDERS);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isMoreMenuOpen, setIsMoreMenuOpen] = useState(false);
  const moreMenuRef = useRef<HTMLDivElement>(null);

  // Persistence
  useEffect(() => {
    try {
      const savedManual = localStorage.getItem('basil_manual_recipes');
      if (savedManual) setManualRecipes(JSON.parse(savedManual));
      const savedFavIng = localStorage.getItem('basil_stash_ingredients');
      if (savedFavIng) setFavIngredients(JSON.parse(savedFavIng));
      const savedFavRec = localStorage.getItem('basil_stash_recipes');
      if (savedFavRec) setFavRecipes(JSON.parse(savedFavRec));
      const savedLoc = localStorage.getItem('basil_location');
      if (savedLoc) {
        const loc = JSON.parse(savedLoc);
        setCountry(loc.country);
        setState(loc.state);
      }
      const savedReminders = localStorage.getItem('basil_reminders');
      if (savedReminders) setReminders(JSON.parse(savedReminders));
    } catch (e) { console.error(e); }
  }, []);

  useEffect(() => localStorage.setItem('basil_manual_recipes', JSON.stringify(manualRecipes)), [manualRecipes]);
  useEffect(() => localStorage.setItem('basil_stash_ingredients', JSON.stringify(favIngredients)), [favIngredients]);
  useEffect(() => localStorage.setItem('basil_stash_recipes', JSON.stringify(favRecipes)), [favRecipes]);
  useEffect(() => localStorage.setItem('basil_reminders', JSON.stringify(reminders)), [reminders]);
  useEffect(() => localStorage.setItem('basil_location', JSON.stringify({ country, state })), [country, state]);

  // Click outside More Menu
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (moreMenuRef.current && !moreMenuRef.current.contains(e.target as Node)) setIsMoreMenuOpen(false);
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  // Notifications
  useEffect(() => {
    const interval = setInterval(() => {
      const now = new Date();
      const current = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
      reminders.forEach(r => {
        if (r.enabled && r.time === current && now.getSeconds() === 0) {
          if ('Notification' in window && Notification.permission === 'granted') {
            new Notification(`Basil: ${r.label} Time!`, { body: "Taste the harvest." });
          } else alert(`${r.label} Time! 🥗`);
        }
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [reminders]);

  const toggleFavIngredient = (ing: Ingredient) => {
    setFavIngredients(prev => {
      if (prev.find(f => f.name.toLowerCase() === ing.name.toLowerCase()))
        return prev.filter(f => f.name.toLowerCase() !== ing.name.toLowerCase());
      return [...prev, { ...ing, isFavorite: true }];
    });
  };

  const toggleFavRecipe = (rec: Recipe) => {
    setFavRecipes(prev => {
      if (prev.find(f => f.title.toLowerCase() === rec.title.toLowerCase()))
        return prev.filter(f => f.title.toLowerCase() !== rec.title.toLowerCase());
      return [...prev, { ...rec, isFavorite: true }];
    });
  };

  const getBuyLink = (name: string) => {
    const c = COUNTRIES.find(cnt => cnt.code === country);
    return `${c?.amazon || 'https://google.com/search?q='}${encodeURIComponent(name)}`;
  };

  return (
    <div className="min-h-screen bg-[#fdfbf7] text-[#1a1a1a] pb-32">
      <header className="bg-white border-b border-[#e5e1da] sticky top-0 z-[100] py-4 sm:py-6">
        <div className="max-w-7xl mx-auto px-6 flex items-center justify-between">
          <div className="text-left space-y-0.5 cursor-pointer" onClick={() => setActiveTab('discover')}>
            <h1 className="text-4xl sm:text-5xl font-serif tracking-tighter text-[#1a1a1a]">Basil</h1>
            <p className="text-[9px] sm:text-xs text-[#666] font-medium whitespace-nowrap">For Those With Taste</p>
          </div>
          <div className="flex items-center gap-4">
            <nav className="hidden lg:flex items-center gap-1">
              {['discover', 'explore', 'health', 'restaurants'].map((t) => (
                <button key={t} onClick={() => setActiveTab(t as Tab)} className={`px-4 py-2 text-[10px] tracking-[0.2em] uppercase transition-all ${activeTab === t ? 'text-[#1a1a1a] font-bold border-b border-[#1a1a1a]' : 'text-slate-400 hover:text-[#1a1a1a]'}`}>{t}</button>
              ))}
              <div className="relative ml-2" ref={moreMenuRef}>
                <button onClick={() => setIsMoreMenuOpen(!isMoreMenuOpen)} className={`px-4 py-2 text-[10px] tracking-[0.2em] uppercase transition-all flex items-center gap-1 ${['custom', 'favorites', 'blog'].includes(activeTab) ? 'text-[#1a1a1a] font-bold border-b border-[#1a1a1a]' : 'text-slate-400 hover:text-[#1a1a1a]'}`}>More <svg className={`w-3 h-3 transition-transform ${isMoreMenuOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" /></svg></button>
                {isMoreMenuOpen && (
                  <div className="absolute right-0 mt-2 w-48 bg-white border border-[#e5e1da] shadow-xl p-2 animate-luxe">
                    <button onClick={() => { setActiveTab('custom'); setIsMoreMenuOpen(false); }} className="w-full text-left px-4 py-3 text-[10px] tracking-widest uppercase hover:bg-[#fdfbf7]">Custom Lab</button>
                    <button onClick={() => { setActiveTab('favorites'); setIsMoreMenuOpen(false); }} className="w-full text-left px-4 py-3 text-[10px] tracking-widest uppercase hover:bg-[#fdfbf7]">Favorites</button>
                    <button onClick={() => { setActiveTab('blog'); setIsMoreMenuOpen(false); }} className="w-full text-left px-4 py-3 text-[10px] tracking-widest uppercase hover:bg-[#fdfbf7]">The Journal</button>
                  </div>
                )}
              </div>
            </nav>
            <div className="flex items-center gap-2 sm:gap-4">
              <button onClick={() => setIsRemindersTrayOpen(!isRemindersTrayOpen)} className="p-2 text-slate-400 hover:text-[#1a1a1a] transition-colors"><svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" /></svg></button>
              <button onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)} className="lg:hidden p-2 text-slate-400 hover:text-[#1a1a1a] transition-colors"><svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" /></svg></button>
            </div>
          </div>
        </div>
      </header>

      <section className="w-full h-48 sm:h-72 overflow-hidden relative">
        <img src={TAB_BANNERS[activeTab]} alt="banner" className="w-full h-full object-cover grayscale brightness-75 hover:grayscale-0 transition-all duration-[2s]" />
        <div className="absolute inset-0 bg-gradient-to-t from-[#fdfbf7] via-transparent to-transparent opacity-60"></div>
      </section>

      {isMobileMenuOpen && (
        <div className="fixed inset-0 z-[110] lg:hidden bg-white/95 backdrop-blur-md animate-luxe p-8 space-y-12">
          <div className="flex justify-between items-center border-b pb-8">
            <h1 className="text-5xl font-serif text-[#1a1a1a]">Basil</h1>
            <button onClick={() => setIsMobileMenuOpen(false)}><svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1" d="M6 18L18 6M6 6l12 12" /></svg></button>
          </div>
          <nav className="flex flex-col gap-10">
            {['discover', 'explore', 'health', 'restaurants', 'custom', 'favorites', 'blog'].map(t => (
              <button key={t} onClick={() => { setActiveTab(t as Tab); setIsMobileMenuOpen(false); }} className={`text-3xl font-serif text-left tracking-tight ${activeTab === t ? 'border-l-8 border-[#1a1a1a] pl-6' : 'text-slate-400'}`}>{t === 'blog' ? 'The Journal' : t.charAt(0).toUpperCase() + t.slice(1)}</button>
            ))}
          </nav>
        </div>
      )}

      {isRemindersTrayOpen && <MealRemindersTray reminders={reminders} onAdd={() => setReminders([...reminders, { id: Math.random().toString(36).substr(2, 9), label: 'CUSTOM', time: '12:00', enabled: true }])} onUpdate={(id, up) => setReminders(reminders.map(r => r.id === id ? {...r, ...up} : r))} onRequestPermission={() => Notification.requestPermission()} />}

      <main className="max-w-7xl mx-auto px-6 mt-16 space-y-32">
        {activeTab === 'discover' && <DiscoverTab ingredients={ingredients} setIngredients={setIngredients} favIngredients={favIngredients} toggleFavIngredient={toggleFavIngredient} getBuyLink={getBuyLink} getCountryName={() => COUNTRIES.find(c => c.code === country)?.name || 'STORE'} country={country} setCountry={setCountry} state={state} setState={setState} onOpenArchive={() => setIsFavArchiveOpen(true)} setRecipes={(r) => { /* logic to handle auto-recipes if needed */ }} setIsGlobalLoading={setIsGlobalLoading} />}
        {activeTab === 'explore' && <ExploreTab country={country} state={state} setIngredients={setIngredients} setIsGlobalLoading={setIsGlobalLoading} />}
        {activeTab === 'health' && <HealthTab onStartRecipe={setActiveRecipe} />}
        {activeTab === 'restaurants' && <RestaurantsTab country={country} state={state} />}
        {activeTab === 'custom' && <CustomLabTab manualRecipes={manualRecipes} setManualRecipes={setManualRecipes} onStartRecipe={setActiveRecipe} />}
        {activeTab === 'favorites' && <FavoritesTab favRecipes={favRecipes} toggleFavRecipe={toggleFavRecipe} onStartRecipe={setActiveRecipe} />}
        {activeTab === 'blog' && <BlogTab />}
      </main>

      {activeRecipe && <RecipeOverlay recipe={activeRecipe} onClose={() => setActiveRecipe(null)} />}
      {isFavArchiveOpen && <PantryArchiveModal favIngredients={favIngredients} onClose={() => setIsFavArchiveOpen(false)} onRestock={(ing) => { if(!ingredients.find(i => i.name === ing.name)) setIngredients([...ingredients, {...ing, id: Math.random().toString(36).substr(2,9)}]); }} />}
    </div>
  );
};

export default App;
