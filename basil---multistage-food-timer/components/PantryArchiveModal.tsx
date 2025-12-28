
import React from 'react';
import { Ingredient } from '../types';

interface PantryArchiveModalProps {
  favIngredients: Ingredient[];
  onClose: () => void;
  onRestock: (ing: Ingredient) => void;
}

export const PantryArchiveModal: React.FC<PantryArchiveModalProps> = ({ favIngredients, onClose, onRestock }) => (
  <div className="fixed inset-0 z-[200] flex items-center justify-center p-6 bg-white/90 backdrop-blur-sm">
    <div className="bg-[#fdfbf7] border border-[#e5e1da] w-full max-w-4xl h-[80vh] flex flex-col p-16 animate-luxe shadow-2xl">
      <div className="flex justify-between items-center mb-16 border-b border-[#e5e1da] pb-8">
        <div className="space-y-1">
          <h2 className="text-3xl font-serif tracking-tighter">The Pantry Archive</h2>
          <p className="text-[9px] tracking-[0.4em] text-slate-400 font-bold uppercase">RECURRING INGREDIENTS</p>
        </div>
        <button onClick={onClose} className="p-2 text-slate-300 hover:text-[#1a1a1a] transition-colors"><svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1" d="M6 18L18 6M6 6l12 12" /></svg></button>
      </div>
      <div className="overflow-y-auto space-y-12 pr-6 flex-1">
        {favIngredients.map(ing => (
          <div key={ing.id} className="flex items-center justify-between pb-8 border-b border-[#f3f1ed] group transition-all">
            <div className="flex items-center gap-12">
              <div className="w-32 aspect-square bg-white border border-[#e5e1da] overflow-hidden saturate-[1.1] transition-all duration-700">{ing.imageUrl && <img src={ing.imageUrl} className="w-full h-full object-cover" alt={ing.name} />}</div>
              <div className="space-y-1"><p className="font-serif text-3xl tracking-tight">{ing.name}</p><p className="text-[9px] text-slate-400 font-bold uppercase tracking-widest">{ing.calories} CALORIES / UNIT</p></div>
            </div>
            <button onClick={() => { onRestock(ing); alert('Composition Updated.'); }} className="px-10 py-3 border border-[#1a1a1a] text-[9px] font-bold tracking-[0.3em] hover:bg-[#1a1a1a] hover:text-white transition-all uppercase">RESTOCK</button>
          </div>
        ))}
      </div>
    </div>
  </div>
);
