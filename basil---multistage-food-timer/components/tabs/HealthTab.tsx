
import React, { useState, useEffect } from 'react';
import { Recipe } from '../../types';
import { AILMENTS } from '../../constants';
import { getHerbalRecipes, generateRecipeImage } from '../../services/geminiService';

interface HealthTabProps {
  onStartRecipe: (r: Recipe) => void;
}

export const HealthTab: React.FC<HealthTabProps> = ({ onStartRecipe }) => {
  const [selectedAilment, setSelectedAilment] = useState(AILMENTS[0].id);
  const [herbalRecipes, setHerbalRecipes] = useState<Recipe[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    fetchRemedies();
  }, [selectedAilment]);

  const fetchRemedies = async () => {
    setIsLoading(true);
    const ailmentLabel = AILMENTS.find(a => a.id === selectedAilment)?.label || selectedAilment;
    const res = await getHerbalRecipes(ailmentLabel);
    const withImages = await Promise.all(res.map(async r => {
      const img = await generateRecipeImage(r.title);
      return { ...r, imageUrl: img || undefined };
    }));
    setHerbalRecipes(withImages);
    setIsLoading(false);
  };

  return (
    <section className="space-y-24 animate-luxe">
      <div className="text-left space-y-8">
        <div className="space-y-1">
          <h2 className="text-2xl sm:text-3xl font-serif tracking-tighter">The Apothecary</h2>
          <p className="text-[10px] text-slate-400">Natural Remedies & Vitality</p>
        </div>
        <div className="flex flex-wrap justify-start gap-1">
          {AILMENTS.map((a) => (
            <button key={a.id} onClick={() => setSelectedAilment(a.id)} className={`px-8 py-3 text-[10px] tracking-[0.3em] transition-all duration-500 border ${selectedAilment === a.id ? 'bg-[#1a1a1a] text-white border-[#1a1a1a]' : 'text-slate-400 border-transparent hover:border-[#e5e1da]'}`}>
              {a.label}
            </button>
          ))}
        </div>
      </div>
      {isLoading ? <div className="text-center py-24 italic font-serif text-slate-300">Consulting herbal texts...</div> : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
          {herbalRecipes.map(recipe => (
            <div key={recipe.id} className="group border border-[#e5e1da] bg-white">
              <div className="aspect-[4/5] overflow-hidden border-b border-[#e5e1da]">
                {recipe.imageUrl && <img src={recipe.imageUrl} alt={recipe.title} className="w-full h-full object-cover transition duration-[3s] group-hover:scale-105" />}
              </div>
              <div className="p-10 text-left space-y-8">
                <h3 className="text-2xl font-serif tracking-tight">{recipe.title}</h3>
                <p className="text-xs text-[#666] leading-relaxed">"{recipe.description}"</p>
                <button onClick={() => onStartRecipe(recipe)} className="text-[10px] tracking-[0.4em] font-bold border-b border-[#1a1a1a] pb-1 hover:pb-3 transition-all uppercase">BEGIN PREPARATION</button>
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  );
};
