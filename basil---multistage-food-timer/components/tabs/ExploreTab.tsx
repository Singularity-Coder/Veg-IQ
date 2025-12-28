
import React, { useState, useEffect, useRef } from 'react';
import { CountryCode, Ingredient } from '../../types';
import { getDishesByLocation, generateRecipeImage, getExploreIngredients, generateIngredientImage } from '../../services/geminiService';
import { DISH_SUGGESTIONS } from '../../constants';

interface ExploreTabProps {
  country: CountryCode;
  state: string;
  setIngredients: React.Dispatch<React.SetStateAction<Ingredient[]>>;
  setIsGlobalLoading: (l: boolean) => void;
}

const CATEGORY_FILTERS = ['Palate Cleansers'];
const TEXTURE_FILTERS = ['Chewable', 'Suckable', 'Lickable', 'Drinkable'];

export const ExploreTab: React.FC<ExploreTabProps> = ({ country, state, setIngredients, setIsGlobalLoading }) => {
  const [exploreSearch, setExploreSearch] = useState('');
  const [regionalDishes, setRegionalDishes] = useState<{ name: string, description: string, imageUrl?: string }[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isFilterMenuOpen, setIsFilterMenuOpen] = useState(false);
  const [selectedFilters, setSelectedFilters] = useState<string[]>([]);
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

  const fetchRegionalDishes = async () => {
    setIsLoading(true);
    const dishes = await getDishesByLocation(country, state, selectedFilters);
    const withImages = await Promise.all(dishes.map(async d => {
      const img = await generateRecipeImage(d.name);
      return { ...d, imageUrl: img || undefined };
    }));
    setRegionalDishes(withImages);
    setIsLoading(false);
  };

  const runExplore = async (dish: string) => {
    setExploreSearch(dish);
    setIsGlobalLoading(true);
    const res = await getExploreIngredients(dish);
    const withImages = await Promise.all(res.map(async ing => {
      const img = await generateIngredientImage(ing.name);
      return { ...ing, imageUrl: img || undefined, id: Math.random().toString(36).substr(2, 9) };
    }));
    setIngredients(prev => [...prev, ...withImages]);
    setIsGlobalLoading(false);
  };

  const toggleFilter = (filter: string) => {
    setSelectedFilters(prev => 
      prev.includes(filter) 
        ? prev.filter(f => f !== filter) 
        : [...prev, filter]
    );
  };

  return (
    <section className="space-y-32 animate-luxe">
      <div className="space-y-12">
        <div className="flex items-center justify-between">
          <div className="text-left space-y-1">
            <h2 className="text-2xl sm:text-3xl font-serif tracking-tighter text-[#1a1a1a]">The Discovery</h2>
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
        <div className="space-y-8">
          <div className="flex items-center bg-[#fdfbf7]">
            <div className="flex-1 flex items-center bg-white border border-[#e5e1da] h-12 sm:h-14 shadow-sm overflow-hidden group focus-within:border-[#1a1a1a] transition-all">
              <input value={exploreSearch} onChange={(e) => setExploreSearch(e.target.value)} onKeyDown={(e) => { if(e.key === 'Enter') runExplore(exploreSearch); }} type="text" placeholder="Search for a dish to explore..." className="flex-1 h-full px-8 text-sm font-light outline-none bg-transparent placeholder:text-slate-400" />
              <button onClick={() => runExplore(exploreSearch)} className="w-12 sm:w-14 h-full bg-[#1a1a1a] flex items-center justify-center text-white hover:bg-black transition-colors">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" /></svg>
              </button>
            </div>
          </div>
          <div className="space-y-4 px-2">
            <p className="text-[11px] tracking-widest text-slate-500 font-medium">Suggestions:</p>
            <div className="flex flex-wrap gap-2">
              {DISH_SUGGESTIONS.map(s => <button key={s} onClick={() => runExplore(s)} className="bg-[#f3f1ed] px-5 py-2.5 text-[10px] tracking-widest font-medium hover:bg-[#e5e1da] transition-colors uppercase">{s}</button>)}
            </div>
          </div>
        </div>
      </div>
      <div className="space-y-16">
        <h3 className="text-xs tracking-[0.5em] text-left text-slate-400 px-2 uppercase">REGIONAL CURIOSITIES</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
          {isLoading ? (
            <div className="col-span-full py-24 text-center">
              <div className="flex flex-col items-center gap-4">
                <div className="w-12 h-[1px] bg-[#1a1a1a] animate-pulse"></div>
                <span className="text-[10px] tracking-[0.5em] font-bold text-slate-300 uppercase">Searching the archives</span>
              </div>
            </div>
          ) : regionalDishes.map((dish, idx) => (
            <div key={idx} className="group cursor-pointer space-y-6" onClick={() => runExplore(dish.name)}>
              <div className="aspect-square bg-slate-50 overflow-hidden border border-[#e5e1da]">
                {dish.imageUrl && <img src={dish.imageUrl} alt={dish.name} className="w-full h-full object-cover saturate-[1.15] contrast-[1.05] group-hover:scale-105 transition duration-[2s] ease-out" />}
              </div>
              <div className="text-left"><h4 className="text-2xl font-serif mb-2">{dish.name}</h4><p className="text-[10px] text-slate-400 font-light leading-relaxed">"{dish.description}"</p></div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};
