
import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { CountryCode, Ingredient, Recipe } from '../../types';
import { getDishesByLocation, generateRecipeImage, getExploreIngredients, generateIngredientImage, getDishRecipe } from '../../services/geminiService';
import { DISH_SUGGESTIONS } from '../../constants';

interface ExploreTabProps {
  country: CountryCode;
  state: string;
  setIngredients: React.Dispatch<React.SetStateAction<Ingredient[]>>;
  setIsGlobalLoading: (l: boolean) => void;
  onStartRecipe: (r: Recipe) => void;
  // Add onApiError to props to fix TS error in App.tsx
  onApiError?: (err: any) => void;
}

const CATEGORY_FILTERS = ['Palate Cleansers'];
const TEXTURE_FILTERS = ['Chewable', 'Suckable', 'Lickable', 'Drinkable'];

export const ExploreTab: React.FC<ExploreTabProps> = ({ country, state, setIngredients, setIsGlobalLoading, onStartRecipe, onApiError }) => {
  const [exploreSearch, setExploreSearch] = useState('');
  const [regionalDishes, setRegionalDishes] = useState<{ name: string, description: string, imageUrl?: string }[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isFilterMenuOpen, setIsFilterMenuOpen] = useState(false);
  const [selectedFilters, setSelectedFilters] = useState<string[]>([]);
  const [previewDish, setPreviewDish] = useState<{ name: string, description: string, imageUrl?: string } | null>(null);
  const [previewIngredients, setPreviewIngredients] = useState<Ingredient[]>([]);
  const [isFetchingPreview, setIsFetchingPreview] = useState(false);
  
  const filterMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchRegionalDishes();
  }, [country, state, selectedFilters]);

  // Click outside filter menu
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (filterMenuRef.current && !filterMenuRef.current.contains(e.target as Node)) {
        setIsFilterMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  const fetchRegionalDishes = async (query?: string) => {
    setIsLoading(true);
    // Wrap in try-catch to handle potential API errors from getDishesByLocation or generateRecipeImage
    try {
      const locationStr = query || (state ? `${state}, ${country}` : country);
      const dishes = await getDishesByLocation(locationStr, "", selectedFilters);
      const withImages = await Promise.all(dishes.map(async d => {
        const img = await generateRecipeImage(d.name);
        return { ...d, imageUrl: img || undefined };
      }));
      setRegionalDishes(withImages);
    } catch (e) {
      console.error("fetchRegionalDishes failed", e);
      if (onApiError) onApiError(e);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSearch = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!exploreSearch.trim()) {
      fetchRegionalDishes();
      return;
    }
    fetchRegionalDishes(exploreSearch);
  };

  const openPreview = async (dish: { name: string, description: string, imageUrl?: string }) => {
    setPreviewDish(dish);
    setPreviewIngredients([]);
    setIsFetchingPreview(true);
    try {
      const res = await getExploreIngredients(dish.name);
      const withImages = await Promise.all(res.map(async ing => {
        const img = await generateIngredientImage(ing.name);
        return { ...ing, imageUrl: img || undefined, id: Math.random().toString(36).substr(2, 9) };
      }));
      setPreviewIngredients(withImages);
    } catch (e) {
      console.error("Failed to fetch preview ingredients", e);
      // Notify parent of API error
      if (onApiError) onApiError(e);
    } finally {
      setIsFetchingPreview(false);
    }
  };

  const handleStartPrep = async () => {
    if (!previewDish) return;
    setIsGlobalLoading(true);
    try {
      const recipeRes = await getDishRecipe(previewDish.name);
      // Also add these ingredients to the main pantry for future use
      setIngredients(prev => {
        const uniqueNew = previewIngredients.filter(pi => !prev.some(p => p.name.toLowerCase() === pi.name.toLowerCase()));
        return [...prev, ...uniqueNew];
      });
      onStartRecipe({ ...recipeRes, imageUrl: previewDish.imageUrl });
      setPreviewDish(null);
    } catch (e) {
      console.error("Preparation failed", e);
      // Notify parent of API error
      if (onApiError) onApiError(e);
    } finally {
      setIsGlobalLoading(false);
    }
  };

  const toggleFilter = (filter: string) => {
    setSelectedFilters(prev => 
      prev.includes(filter) 
        ? prev.filter(f => f !== filter) 
        : [...prev, filter]
    );
  };

  return (
    <section className="space-y-10 animate-luxe">
      <div className="space-y-8">
        <div className="flex items-center justify-between">
          <div className="text-left space-y-1">
            <h2 className="text-2xl sm:text-3xl font-serif tracking-tighter text-[#1a1a1a]">The Exploration</h2>
            <p className="text-[10px] text-slate-400">Consult the Global Archives</p>
          </div>
          <div className="relative" ref={filterMenuRef}>
            <button 
              onClick={() => setIsFilterMenuOpen(!isFilterMenuOpen)}
              className={`p-3 border transition-all duration-300 ${isFilterMenuOpen ? 'bg-[#1a1a1a] text-white border-[#1a1a1a]' : 'border-[#e5e1da] text-[#1a1a1a] hover:bg-[#1a1a1a] hover:text-white'}`}
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="1" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 4.5h18l-7.5 9v5.25l-3-3v-2.25L3 4.5z" />
              </svg>
            </button>
            {isFilterMenuOpen && (
              <div className="absolute right-0 mt-4 w-64 bg-white border border-[#e5e1da] shadow-2xl z-[120] animate-luxe overflow-hidden">
                <div className="p-6 space-y-8">
                  <div className="space-y-4">
                    <h4 className="text-[9px] font-bold text-slate-400 tracking-[0.3em] uppercase">Categories</h4>
                    <div className="space-y-2">
                      {CATEGORY_FILTERS.map(f => (
                        <label key={f} className="flex items-center gap-3 cursor-pointer group">
                          <div 
                            onClick={() => toggleFilter(f)}
                            className={`w-4 h-4 border border-[#e5e1da] flex items-center justify-center transition-colors ${selectedFilters.includes(f) ? 'bg-[#1a1a1a] border-[#1a1a1a]' : 'bg-transparent'}`}
                          >
                            {selectedFilters.includes(f) && <div className="w-1.5 h-1.5 bg-white"></div>}
                          </div>
                          <span className={`text-[10px] tracking-widest uppercase transition-colors ${selectedFilters.includes(f) ? 'text-[#1a1a1a] font-bold' : 'text-slate-400 group-hover:text-[#1a1a1a]'}`}>{f}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                  <div className="space-y-4">
                    <h4 className="text-[9px] font-bold text-slate-400 tracking-[0.3em] uppercase">Food Types</h4>
                    <div className="space-y-2">
                      {TEXTURE_FILTERS.map(f => (
                        <label key={f} className="flex items-center gap-3 cursor-pointer group">
                          <div 
                            onClick={() => toggleFilter(f)}
                            className={`w-4 h-4 border border-[#e5e1da] flex items-center justify-center transition-colors ${selectedFilters.includes(f) ? 'bg-[#1a1a1a] border-[#1a1a1a]' : 'bg-transparent'}`}
                          >
                            {selectedFilters.includes(f) && <div className="w-1.5 h-1.5 bg-white"></div>}
                          </div>
                          <span className={`text-[10px] tracking-widest uppercase transition-colors ${selectedFilters.includes(f) ? 'text-[#1a1a1a] font-bold' : 'text-slate-400 group-hover:text-[#1a1a1a]'}`}>{f}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                  {selectedFilters.length > 0 && (
                    <button 
                      onClick={() => setSelectedFilters([])}
                      className="w-full pt-4 border-t border-[#f3f1ed] text-[8px] tracking-[0.4em] font-bold text-slate-300 hover:text-red-800 transition-colors uppercase"
                    >
                      Clear Selection
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
        <form onSubmit={handleSearch} className="space-y-6">
          <div className="flex items-center bg-[#fdfbf7]">
            <div className="flex-1 flex items-center bg-white border border-[#e5e1da] h-12 sm:h-14 shadow-sm overflow-hidden group focus-within:border-[#1a1a1a] transition-all">
              <input value={exploreSearch} onChange={(e) => setExploreSearch(e.target.value)} type="text" placeholder="Search for a cuisine or dish..." className="flex-1 h-full px-8 text-sm font-light outline-none bg-transparent placeholder:text-slate-400" />
              <button type="submit" className="w-12 sm:w-14 h-full bg-[#1a1a1a] flex items-center justify-center text-white hover:bg-black transition-colors">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" /></svg>
              </button>
            </div>
          </div>
          <div className="space-y-4 px-2">
            <p className="text-[11px] tracking-widest text-slate-500 font-medium uppercase">SUGGESTIONS</p>
            <div className="flex flex-wrap gap-2">
              {DISH_SUGGESTIONS.map(s => <button key={s} type="button" onClick={() => { setExploreSearch(s); fetchRegionalDishes(s); }} className="bg-[#f3f1ed] px-5 py-2.5 text-[10px] tracking-widest font-medium hover:bg-[#e5e1da] transition-colors uppercase">{s}</button>)}
            </div>
          </div>
        </form>
      </div>
      <div className="space-y-4">
        <h3 className="text-xs tracking-[0.5em] text-left text-slate-400 px-2 uppercase">DISCOVERED OPTIONS</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
          {isLoading ? (
            <div className="col-span-full py-24 text-center">
              <div className="flex flex-col items-center gap-4">
                <div className="w-12 h-[1px] bg-[#1a1a1a] animate-pulse"></div>
                <span className="text-[10px] tracking-[0.5em] font-bold text-slate-300 uppercase">Consulting the archives</span>
              </div>
            </div>
          ) : regionalDishes.length === 0 ? (
            <div className="col-span-full py-24 text-center border border-[#e5e1da] border-dashed font-serif text-slate-300 italic">No compositions found for this query.</div>
          ) : regionalDishes.map((dish, idx) => (
            <div key={idx} className="group cursor-pointer space-y-6 animate-luxe" onClick={() => openPreview(dish)}>
              <div className="aspect-square bg-slate-50 overflow-hidden border border-[#e5e1da]">
                {dish.imageUrl && <img src={dish.imageUrl} alt={dish.name} className="w-full h-full object-cover saturate-[1.15] contrast-[1.05] group-hover:scale-105 transition duration-[2s] ease-out" />}
              </div>
              <div className="text-left"><h4 className="text-2xl font-serif mb-2 group-hover:text-slate-600 transition-colors">{dish.name}</h4><p className="text-[10px] text-slate-400 font-light leading-relaxed">"{dish.description}"</p></div>
            </div>
          ))}
        </div>
      </div>

      {/* Dish Ingredient Preview Modal */}
      {previewDish && createPortal(
        <div className="fixed inset-0 z-[1000] bg-[#fdfbf7] flex flex-col overflow-hidden animate-luxe">
          <header className="w-full px-8 py-5 sm:py-8 bg-white border-b border-[#e5e1da] flex justify-center items-center shrink-0">
            <div className="max-w-7xl w-full px-6 flex justify-between items-center">
              <div className="space-y-1">
                <h2 className="text-2xl sm:text-3xl font-serif tracking-tight text-[#1a1a1a]">{previewDish.name}</h2>
                <p className="text-[9px] tracking-[0.4em] text-slate-400 uppercase font-bold">PREPARATORY INVENTORY</p>
              </div>
              <button 
                onClick={() => setPreviewDish(null)}
                className="p-2 text-slate-400 hover:text-[#1a1a1a] transition-all"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </header>

          <main className="flex-1 overflow-y-auto custom-scroll bg-[#fdfbf7] pb-32">
            <div className="max-w-7xl mx-auto px-6 py-12">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-start">
                <div className="space-y-10">
                   <div className="aspect-[4/3] bg-white border border-[#e5e1da] overflow-hidden shadow-2xl">
                     {previewDish.imageUrl && <img src={previewDish.imageUrl} className="w-full h-full object-cover saturate-[1.1]" alt={previewDish.name} />}
                   </div>
                   <div className="space-y-6">
                      <h3 className="text-[11px] tracking-[0.5em] font-bold text-slate-400 uppercase">THE MANIFESTO</h3>
                      <p className="text-xl font-serif italic text-slate-600 leading-relaxed">"{previewDish.description}"</p>
                   </div>
                </div>

                <div className="space-y-12">
                  <div className="space-y-4">
                    <h3 className="text-[11px] tracking-[0.5em] font-bold text-[#1a1a1a] uppercase pb-4 border-b border-[#e5e1da]">REQUIRED ELEMENTS</h3>
                    
                    {isFetchingPreview ? (
                      <div className="py-24 flex flex-col items-center gap-4">
                         <div className="w-12 h-[1px] bg-[#1a1a1a] animate-pulse"></div>
                         <span className="text-[9px] tracking-[0.4em] font-bold text-slate-300 uppercase">Collating Nutrients</span>
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 gap-6">
                        {previewIngredients.map((ing, i) => (
                          <div key={i} className="flex gap-8 group pb-6 border-b border-[#f3f1ed] last:border-0">
                            <div className="w-24 h-24 bg-white border border-[#e5e1da] overflow-hidden shrink-0">
                               {ing.imageUrl && <img src={ing.imageUrl} className="w-full h-full object-cover saturate-[1.1]" alt={ing.name} />}
                            </div>
                            <div className="space-y-2">
                              <h4 className="text-xl font-serif tracking-tight">{ing.name}</h4>
                              <div className="flex gap-3 text-[8px] tracking-widest font-bold text-slate-400 uppercase">
                                 <span>{ing.calories} CAL</span>
                                 <span>•</span>
                                 <span>P: {ing.protein}</span>
                                 <span>•</span>
                                 <span>C: {ing.carbs}</span>
                              </div>
                              <p className="text-[10px] text-slate-500 font-light leading-relaxed line-clamp-2 italic">"{ing.properties}"</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </main>

          <footer className="fixed bottom-0 left-0 w-full bg-white border-t border-[#e5e1da] py-8 px-6 flex justify-center items-center z-50">
             <div className="max-w-7xl w-full flex justify-end gap-8 items-center">
                <p className="hidden md:block text-[10px] tracking-[0.4em] text-slate-400 font-bold uppercase">Ready to begin the composition?</p>
                <button 
                  onClick={handleStartPrep}
                  disabled={isFetchingPreview}
                  className="px-16 py-5 bg-[#1a1a1a] text-white text-[10px] tracking-[0.5em] font-bold hover:bg-black transition-all uppercase shadow-2xl disabled:opacity-50"
                >
                  START PREPARATION
                </button>
             </div>
          </footer>
          
          <style>{`
            .custom-scroll::-webkit-scrollbar { width: 3px; }
            .custom-scroll::-webkit-scrollbar-thumb { background: #e5e1da; }
          `}</style>
        </div>,
        document.body
      )}
    </section>
  );
};
