
import React from 'react';
import { Ingredient } from '../types';

interface IngredientCardProps {
  ing: Ingredient;
  isFavorite: boolean;
  onToggleFavorite: (ing: Ingredient) => void;
  onAddToFridge?: (ing: Ingredient) => void;
  buyLink: string;
  countryName: string;
  isExplore?: boolean;
}

export const IngredientCard: React.FC<IngredientCardProps> = ({ 
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
