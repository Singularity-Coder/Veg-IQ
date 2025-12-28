
import React from 'react';
import { Recipe } from '../../types';

interface FavoritesTabProps {
  favRecipes: Recipe[];
  toggleFavRecipe: (r: Recipe) => void;
  onStartRecipe: (r: Recipe) => void;
}

export const FavoritesTab: React.FC<FavoritesTabProps> = ({ favRecipes, toggleFavRecipe, onStartRecipe }) => (
  <section className="space-y-24 animate-luxe">
    <div className="text-left space-y-1">
      <h2 className="text-2xl sm:text-3xl font-serif tracking-tighter">The Vault</h2>
      <p className="text-[10px] text-slate-400">Your Curated Selection</p>
    </div>
    <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
      {favRecipes.length === 0 ? (
        <div className="col-span-full py-48 text-center border border-[#e5e1da] border-dashed italic text-slate-300 font-serif text-3xl">The vault is currently empty.</div>
      ) : favRecipes.map(recipe => (
        <div key={recipe.id} className="group border border-[#e5e1da] bg-white flex flex-col relative">
          <button onClick={() => toggleFavRecipe(recipe)} className="absolute top-6 right-6 z-20 p-2 text-[#1a1a1a]"><svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/></svg></button>
          <div className="aspect-square overflow-hidden border-b border-[#e5e1da]">
            {recipe.imageUrl && <img src={recipe.imageUrl} alt={recipe.title} className="w-full h-full object-cover saturate-[1.1] transition duration-[3s] group-hover:scale-105 contrast-[1.05]" />}
          </div>
          <div className="p-10 text-left space-y-6">
            <h3 className="text-2xl font-serif tracking-tight">{recipe.title}</h3>
            <button onClick={() => onStartRecipe(recipe)} className="w-full py-4 text-[9px] tracking-[0.4em] font-bold border border-[#1a1a1a] hover:bg-[#1a1a1a] hover:text-white transition-all uppercase">RE-EXECUTE</button>
          </div>
        </div>
      ))}
    </div>
  </section>
);
