
import React, { useState } from 'react';
import { TAB_BANNERS } from '../constants';

interface WelcomeCarouselProps {
  onComplete: () => void;
}

export const WelcomeCarousel: React.FC<WelcomeCarouselProps> = ({ onComplete }) => {
  const [currentSlide, setCurrentSlide] = useState(0);

  const slides = [
    {
      title: "Welcome to Basil",
      description: "For those with taste. Basil is your digital conductor for the culinary arts, blending precision timing with global inspiration.",
      image: TAB_BANNERS.discover,
      label: "THE PREFACE"
    },
    {
      title: "The Discover Tab",
      description: "Scan your pantry ingredients via camera or text. Our AI consults the archives to compose bespoke recipes for your specific inventory.",
      image: TAB_BANNERS.discover,
      label: "CURATE YOUR PANTRY"
    },
    {
      title: "Global Exploration",
      description: "Navigate regional vegetarian masterpieces from around the world. Source ingredients directly and begin your global culinary journey.",
      image: TAB_BANNERS.explore,
      label: "THE ARCHIVES"
    },
    {
      title: "The Custom Lab",
      description: "Draft your own culinary scores. Create multi-stage cooking movements with integrated timers, voice guidance, and precise reordering.",
      image: TAB_BANNERS.custom,
      label: "DRAFT MOVEMENTS"
    },
    {
      title: "The Apothecary",
      description: "Consult nature's chemistry. Find herbal tonics and nutritional recipes tailored to specific wellness concerns and biological vitality.",
      image: TAB_BANNERS.health,
      label: "VITALITY & WELLNESS"
    },
    {
      title: "The Dining Room",
      description: "Locate the most refined vegetarian and vegan establishments in your current region, complete with search-grounded details.",
      image: TAB_BANNERS.restaurants,
      label: "FINE ESTABLISHMENTS"
    },
    {
      title: "Your Private Vault",
      description: "Archive your favorite compositions and return to the Journal for scientific perspectives on nutrition and longevity.",
      image: TAB_BANNERS.favorites,
      label: "THE FINAL SCORE"
    }
  ];

  const nextSlide = () => {
    if (currentSlide < slides.length - 1) {
      setCurrentSlide(currentSlide + 1);
    } else {
      onComplete();
    }
  };

  return (
    <div className="fixed inset-0 z-[1000] bg-[#fdfbf7] flex flex-col overflow-hidden animate-luxe">
      <div className="flex-1 flex flex-col md:flex-row">
        {/* Visual Section */}
        <div className="w-full md:w-1/2 h-1/2 md:h-full relative overflow-hidden bg-[#1a1a1a]">
          <img 
            key={currentSlide}
            src={slides[currentSlide].image} 
            alt={slides[currentSlide].title} 
            className="w-full h-full object-cover saturate-[1.1] contrast-[1.05] animate-luxe"
            style={{ animationDuration: '2s' }}
          />
          <div className="absolute inset-0 bg-gradient-to-t md:bg-gradient-to-r from-black/40 to-transparent"></div>
        </div>

        {/* Text Section */}
        <div className="w-full md:w-1/2 h-1/2 md:h-full flex flex-col justify-center p-12 md:p-24 space-y-10 bg-white">
          <div className="space-y-4">
            <p className="text-[10px] tracking-[0.5em] text-slate-400 font-bold uppercase animate-luxe">
              {slides[currentSlide].label}
            </p>
            <h2 className="text-4xl md:text-6xl font-serif tracking-tighter text-[#1a1a1a] animate-luxe">
              {slides[currentSlide].title}
            </h2>
          </div>
          
          <p className="text-lg md:text-xl font-serif italic text-slate-500 leading-relaxed max-w-md animate-luxe">
            "{slides[currentSlide].description}"
          </p>

          <div className="flex flex-col gap-8 pt-6">
            <div className="flex gap-2">
              {slides.map((_, i) => (
                <div 
                  key={i} 
                  className={`h-1 transition-all duration-700 ${i === currentSlide ? 'w-12 bg-[#1a1a1a]' : 'w-4 bg-[#e5e1da]'}`}
                />
              ))}
            </div>
            
            <button 
              onClick={nextSlide}
              className="w-full md:w-64 py-5 bg-[#1a1a1a] text-white text-[10px] tracking-[0.5em] font-bold hover:bg-black transition-all uppercase shadow-2xl"
            >
              {currentSlide === slides.length - 1 ? 'BEGIN THE JOURNEY' : 'CONTINUE'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
