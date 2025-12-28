
import React, { useState, useRef } from 'react';
import { Ingredient, CountryCode, Recipe } from '../../types';
import { analyzeIngredients, generateIngredientImage, getRecipesForIngredients, generateRecipeImage } from '../../services/geminiService';
import { PANTRY_SUGGESTIONS, COUNTRIES, STATES } from '../../constants';
import { IngredientCard } from '../IngredientCard';

interface DiscoverTabProps {
  ingredients: Ingredient[];
  setIngredients: React.Dispatch<React.SetStateAction<Ingredient[]>>;
  favIngredients: Ingredient[];
  toggleFavIngredient: (ing: Ingredient) => void;
  getBuyLink: (name: string) => string;
  getCountryName: () => string;
  country: CountryCode;
  setCountry: (c: CountryCode) => void;
  state: string;
  setState: (s: string) => void;
  onOpenArchive: () => void;
  setIsGlobalLoading: (l: boolean) => void;
  onStartRecipe: (r: Recipe) => void;
  toggleFavRecipe: (r: Recipe) => void;
  favRecipes: Recipe[];
  onApiError: (err: any) => void;
}

export const DiscoverTab: React.FC<DiscoverTabProps> = ({
  ingredients, setIngredients, favIngredients, toggleFavIngredient,
  getBuyLink, getCountryName, country, setCountry, state, setState,
  onOpenArchive, setIsGlobalLoading, onStartRecipe, toggleFavRecipe, favRecipes,
  onApiError
}) => {
  const [pantrySearch, setPantrySearch] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [suggestedRecipes, setSuggestedRecipes] = useState<Recipe[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const filterRef = useRef<HTMLDivElement>(null);

  const addIngredientByText = async (text: string) => {
    if (!text) return;
    setIsLoading(true);
    setIsGlobalLoading(true);
    try {
      const newIngredients = await analyzeIngredients({ text });
      const ingsWithImages = await Promise.all(newIngredients.map(async ing => {
        const img = await generateIngredientImage(ing.name).catch(() => null);
        return { ...ing, imageUrl: img || undefined, id: Math.random().toString(36).substr(2, 9) };
      }));
      setIngredients(prev => [...prev, ...ingsWithImages]);
    } catch (e) {
      onApiError(e);
    } finally {
      setIsLoading(false);
      setIsGlobalLoading(false);
    }
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
          const img = await generateIngredientImage(ing.name).catch(() => null);
          return { ...ing, imageUrl: img || undefined, id: Math.random().toString(36).substr(2, 9) };
        }));
        setIngredients(prev => [...prev, ...ingsWithImages]);
      } catch (e) {
        onApiError(e);
      } finally {
        setIsLoading(false);
      }
    };
    reader.readAsDataURL(file);
  };

  const getSuggestions = async () => {
    if (ingredients.length === 0) return;
    setIsLoading(true);
    try {
      const sug = await getRecipesForIngredients(ingredients);
      const withImages = await Promise.all(sug.map(async r => {
        const img = await generateRecipeImage(r.title).catch(() => null);
        return { ...r, imageUrl: img || undefined };
      }));
      setSuggestedRecipes(withImages);
      setTimeout(() => {
        window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' });
      }, 100);
    } catch (e) {
      onApiError(e);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <section className="space-y-8">
      <div className="space-y-10">
        <div className="flex flex-row items-center justify-between gap-4">
          <div className="text-left space-y-1">
            <h2 className="text-2xl sm:text-3xl font-serif tracking-tight text-[#1a1a1a] whitespace-nowrap">Your Pantry</h2>
            <p className="hidden sm:block text-[10px] text-slate-400">Curate Your Ingredients List</p>
          </div>
          <div className="flex items-center gap-2 sm:gap-4 shrink-0">
            <div className="relative" ref={filterRef}>
              <button 
                onClick={() => setIsFilterOpen(!isFilterOpen)} 
                className={`p-3 border border-[#e5e1da] text-[#1a1a1a] hover:bg-[#1a1a1a] hover:text-white transition-all ${isFilterOpen ? 'bg-[#1a1a1a] text-white' : ''}`}
                title="Filter Region"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="1" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3 4.5h18l-7.5 9v5.25l-3-3v-2.25L3 4.5z" />
                </svg>
              </button>
              {isFilterOpen && (
                <div className="absolute right-0 mt-2 w-64 bg-white border border-[#e5e1da] shadow-xl p-6 z-[110] animate-luxe">
                  <div className="space-y-6">
                    <div className="space-y-2">
                      <label className="text-[9px] font-bold text-slate-400 tracking-widest uppercase">Country</label>
                      <select value={country} onChange={(e) => setCountry(e.target.value as CountryCode)} className="w-full bg-transparent border-b border-[#e5e1da] py-2 text-[10px] tracking-widest font-bold outline-none uppercase">
                        {COUNTRIES.map(c => <option key={c.code} value={c.code}>{c.name}</option>)}
                      </select>
                    </div>
                    <div className="space-y-2">
                      <label className="text-[9px] font-bold text-slate-400 tracking-widest uppercase">Region</label>
                      <select value={state} onChange={(e) => setState(e.target.value)} className="w-full bg-transparent border-b border-[#e5e1da] py-2 text-[10px] tracking-widest font-bold outline-none uppercase" disabled={!STATES[country]}>
                        <option value="">ALL REGIONS</option>
                        {STATES[country]?.map(s => <option key={s} value={s.toUpperCase()}>{s.toUpperCase()}</option>)}
                      </select>
                    </div>
                  </div>
                </div>
              )}
            </div>
            <button onClick={onOpenArchive} className="p-3 border border-[#e5e1da] text-[#1a1a1a] hover:bg-[#1a1a1a] hover:text-white transition-all" title="Archive">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" /></svg>
            </button>
            <button 
              onClick={() => fileInputRef.current?.click()} 
              className="p-3 bg-[#1a1a1a] text-white hover:bg-black transition-all shadow-sm"
              title="Scan Image"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.2" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.2" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </button>
            <input type="file" ref={fileInputRef} onChange={handleFileChange} className="hidden" accept="image/*" />
          </div>
        </div>
        <div className="space-y-6">
          <div className="flex items-center bg-[#fdfbf7]">
            <div className="flex-1 flex items-center bg-white border border-[#e5e1da] h-12 sm:h-14 shadow-sm overflow-hidden group focus-within:border-[#1a1a1a] transition-all">
              <input value={pantrySearch} onChange={(e) => setPantrySearch(e.target.value)} onKeyDown={(e) => { if(e.key === 'Enter') { addIngredientByText(pantrySearch); setPantrySearch(''); } }} type="text" placeholder="Type an ingredient name..." className="flex-1 h-full px-8 text-sm font-light outline-none bg-transparent placeholder:text-slate-400" />
              <button onClick={() => { addIngredientByText(pantrySearch); setPantrySearch(''); }} className="w-12 sm:w-14 h-full bg-[#1a1a1a] flex items-center justify-center text-white hover:bg-black transition-colors">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" /></svg>
              </button>
            </div>
          </div>
          <div className="space-y-4 px-2">
            <p className="text-[11px] tracking-widest text-slate-500 font-medium">Suggestions:</p>
            <div className="flex flex-wrap gap-2">
              {PANTRY_SUGGESTIONS.map(s => (
                <button key={s} onClick={() => addIngredientByText(s)} className="bg-[#f3f1ed] px-5 py-2.5 text-[10px] tracking-widest font-medium hover:bg-[#e5e1da] transition-colors uppercase">{s}</button>
              ))}
            </div>
          </div>
        </div>
      </div>
      {isLoading && <div className="text-center py-20 italic font-serif text-2xl text-slate-300 animate-pulse">Consulting the archives...</div>}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-x-8 gap-y-10">
        {ingredients.map(ing => (
          <IngredientCard key={ing.id} ing={ing} isFavorite={favIngredients.some(f => f.name.toLowerCase() === ing.name.toLowerCase())} onToggleFavorite={toggleFavIngredient} buyLink={getBuyLink(ing.name)} countryName={getCountryName()} />
        ))}
      </div>
      {ingredients.length > 0 && !isLoading && (
        <div className="flex justify-center pt-2 pb-6">
          <button 
            onClick={getSuggestions} 
            className="px-12 py-4 bg-[#1a1a1a] text-white text-[10px] tracking-[0.4em] font-bold hover:bg-black transition-all uppercase shadow-xl"
          >
            Compose Cuisine
          </button>
        </div>
      )}

      {/* Inline Suggested Compositions Section */}
      {suggestedRecipes.length > 0 && (
        <div className="pt-2 space-y-10 animate-luxe">
          <div className="text-left space-y-1">
            <h2 className="text-2xl sm:text-3xl font-serif tracking-tighter text-[#1a1a1a]">Suggested Compositions</h2>
            <p className="text-[10px] text-slate-400">Hand-selected for your pantry</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
            {suggestedRecipes.map(recipe => {
              const isFav = favRecipes.some(f => f.title.toLowerCase() === recipe.title.toLowerCase());
              return (
                <div key={recipe.id} className="group border border-[#e5e1da] bg-white flex flex-col relative animate-luxe">
                  <button 
                    onClick={() => toggleFavRecipe(recipe)} 
                    className={`absolute top-6 right-6 z-20 p-2 transition-all ${isFav ? 'text-[#1a1a1a]' : 'text-slate-300 hover:text-[#1a1a1a]'}`}
                  >
                    <svg className="w-5 h-5" fill={isFav ? 'currentColor' : 'none'} stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"/>
                    </svg>
                  </button>
                  <div className="aspect-square overflow-hidden border-b border-[#e5e1da]">
                    {recipe.imageUrl && <img src={recipe.imageUrl} alt={recipe.title} className="w-full h-full object-cover saturate-[1.1] transition duration-[3s] group-hover:scale-105 contrast-[1.05]" />}
                  </div>
                  <div className="p-10 text-left space-y-6 flex-1 flex flex-col justify-between">
                    <div className="space-y-2">
                      <h3 className="text-2xl font-serif tracking-tight leading-tight">{recipe.title}</h3>
                      <p className="text-[10px] tracking-widest text-slate-400 font-bold uppercase">{recipe.totalTime} • {recipe.difficulty}</p>
                    </div>
                    <button 
                      onClick={() => onStartRecipe(recipe)} 
                      className="w-full py-4 mt-6 text-[9px] tracking-[0.4em] font-bold border border-[#1a1a1a] hover:bg-[#1a1a1a] hover:text-white transition-all uppercase"
                    >
                      EXECUTE
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </section>
  );
};
