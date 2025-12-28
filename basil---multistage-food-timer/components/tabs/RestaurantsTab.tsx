
import React, { useState, useEffect } from 'react';
import { Restaurant, CountryCode } from '../../types';
import { getVegRestaurants, generateRecipeImage } from '../../services/geminiService';

interface RestaurantsTabProps {
  country: CountryCode;
  state: string;
}

export const RestaurantsTab: React.FC<RestaurantsTabProps> = ({ country, state }) => {
  const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    fetchRestaurants();
  }, [country, state]);

  const fetchRestaurants = async () => {
    setIsLoading(true);
    const res = await getVegRestaurants(country, state);
    const withImages = await Promise.all(res.map(async r => {
      const img = await generateRecipeImage(`${r.name} restaurant exterior`);
      return { ...r, imageUrl: img || undefined };
    }));
    setRestaurants(withImages);
    setIsLoading(false);
  };

  return (
    <section className="space-y-24 animate-luxe">
      <div className="text-left space-y-1">
        <h2 className="text-2xl sm:text-3xl font-serif tracking-tighter">The Dining Room</h2>
        <p className="text-[10px] text-slate-400">Refined Establishments in {state || country}</p>
      </div>
      {isLoading ? <div className="text-center py-24 italic font-serif text-slate-300">Searching for the finest greens...</div> : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
          {restaurants.map(rest => (
            <div key={rest.id} className="group border border-[#e5e1da] bg-white">
              <div className="aspect-[4/3] overflow-hidden transition-all duration-1000 border-b border-[#e5e1da]">
                {rest.imageUrl ? <img src={rest.imageUrl} alt={rest.name} className="w-full h-full object-cover saturate-[1.1] group-hover:scale-105 transition duration-[2s] contrast-[1.02]" /> : <div className="w-full h-full bg-[#fdfbf7] flex items-center justify-center font-serif text-[#d1cfc7]">Establishment</div>}
              </div>
              <div className="p-8 text-left space-y-6">
                <div className="space-y-1">
                  <h3 className="text-2xl font-serif tracking-tight">{rest.name}</h3>
                  <div className="flex justify-start gap-3 text-[9px] tracking-widest text-slate-400 font-bold uppercase"><span>{rest.priceLevel}</span><span>•</span><span>{rest.rating} STARS</span></div>
                </div>
                <p className="text-xs text-[#666] leading-relaxed px-1">"{rest.description}"</p>
                <button className="w-full py-4 text-[10px] tracking-[0.3em] border border-[#1a1a1a] hover:bg-[#1a1a1a] hover:text-white transition-all uppercase font-bold">Inquire & Order</button>
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  );
};
