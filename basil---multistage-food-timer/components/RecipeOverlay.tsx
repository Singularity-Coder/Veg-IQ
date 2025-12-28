
import React, { useState, useEffect } from 'react';
import { Recipe } from '../types';
import { stopVoice, generateRecipeImage, generateStepImage, playInstructionVoice, getAI } from '../services/geminiService';
import { Type } from "@google/genai";

interface RecipeOverlayProps {
  recipe: Recipe;
  onClose: () => void;
  onApiError?: (err: any) => void;
}

export const RecipeOverlay: React.FC<RecipeOverlayProps> = ({ recipe, onClose, onApiError }) => {
  const [currentStepIdx, setCurrentStepIdx] = useState(0);
  const [remainingTime, setRemainingTime] = useState(recipe.steps[0].durationSeconds);
  const [isTimerRunning, setIsTimerRunning] = useState(false);
  const [finishedImage, setFinishedImage] = useState<string | null>(null);
  const [stepImages, setStepImages] = useState<Record<number, string>>({});
  const [isGenerating, setIsGenerating] = useState(false);
  const [howToEatSteps, setHowToEatSteps] = useState<{ step: string; instruction: string }[] | null>(null);
  const [isFetchingHowToEat, setIsFetchingHowToEat] = useState(false);

  useEffect(() => {
    fetchStepImage(0);
  }, []);

  useEffect(() => {
    let interval: any;
    if (isTimerRunning && remainingTime > 0) {
      interval = setInterval(() => setRemainingTime(prev => prev - 1), 1000);
    } else if (isTimerRunning && remainingTime === 0) {
      setIsTimerRunning(false);
      handleNextStep();
    }
    return () => clearInterval(interval);
  }, [isTimerRunning, remainingTime, currentStepIdx]);

  const fetchStepImage = async (idx: number) => {
    try {
      const url = await generateStepImage(recipe.title, recipe.steps[idx].label, recipe.steps[idx].instruction);
      if (url) {
        setStepImages(prev => ({ ...prev, [idx]: url }));
      } else {
        setStepImages(prev => ({ ...prev, [idx]: 'fallback' }));
      }
    } catch (e) {
      console.error("Failed to fetch step image", e);
      setStepImages(prev => ({ ...prev, [idx]: 'fallback' }));
      if (onApiError) onApiError(e);
    }
  };

  const handleNextStep = () => {
    if (isGenerating) return;
    
    const nextIdx = currentStepIdx + 1;
    stopVoice();
    if (nextIdx < recipe.steps.length) {
      setCurrentStepIdx(nextIdx);
      setRemainingTime(recipe.steps[nextIdx].durationSeconds);
      setIsTimerRunning(false);
      fetchStepImage(nextIdx);
    } else {
      handleFinish();
    }
  };

  const handleFinish = async () => {
    setIsGenerating(true);
    try {
      const img = await generateRecipeImage(recipe.title);
      setFinishedImage(img || 'fallback'); 
      playInstructionVoice("Bon Appétit! Your cooking sequence is complete.");
    } catch (e) {
      console.error("Finishing failed", e);
      setFinishedImage('fallback');
      if (onApiError) onApiError(e);
    } finally {
      setIsGenerating(false);
    }
  };

  const fetchHowToEat = async () => {
    if (isFetchingHowToEat) return;
    setIsFetchingHowToEat(true);

    // Provide dummy data if API is off
    if (localStorage.getItem('basil_api_enabled') !== 'true') {
      setTimeout(() => {
        setHowToEatSteps([
          { step: 'THE PALATE CLEANSER', instruction: 'Sip a crisp sparkling mineral water with a twist of Meyer lemon to neutralize previous flavors and prepare the tongue.' },
          { step: 'ENGAGE THE AROMA', instruction: 'Hover over the dish and inhale deeply to identify the subtle herbaceous notes before committing to the first bite.' },
          { step: 'THE PERFECT MOUTHFUL', instruction: 'Ensure a balanced ratio of the creamy base and the textured elements for a complete, high-fidelity sensory profile.' }
        ]);
        setIsFetchingHowToEat(false);
      }, 800);
      return;
    }

    try {
      const ai = getAI();
      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: `Provide sensory instructions on how to eat: ${recipe.title}.`,
        config: {
          systemInstruction: "You are a sensory dining expert. Provide exactly 3 steps for the best experience of this dish. Step 1 must be a unique palate cleanser recommendation tailored to the flavors of this dish. Steps 2 and 3 should describe how to engage the senses and the ideal technique for the perfect mouthful. Return ONLY valid JSON as an array of objects with 'step' and 'instruction' keys.",
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                step: { type: Type.STRING },
                instruction: { type: Type.STRING }
              },
              required: ["step", "instruction"]
            }
          }
        }
      });
      const text = response.text || '[]';
      const data = JSON.parse(text);
      setHowToEatSteps(data);
    } catch (e) {
      console.error("How to eat failed", e);
      if (onApiError) onApiError(e);
    } finally {
      setIsFetchingHowToEat(false);
    }
  };

  const formatTime = (s: number) => {
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `${m}:${sec.toString().padStart(2, '0')}`;
  };

  if (isGenerating && !finishedImage) {
    return (
      <div className="fixed inset-0 z-[300] flex items-center justify-center p-0 bg-white/95 backdrop-blur-md">
        <div className="flex flex-col items-center gap-8 animate-luxe">
          <div className="w-16 h-[1px] bg-[#1a1a1a] animate-pulse"></div>
          <h2 className="text-3xl font-serif tracking-tighter uppercase">Perfecting the Composition</h2>
          <p className="text-[10px] tracking-[0.4em] text-slate-400 font-bold uppercase">Rendering Final Visuals</p>
        </div>
      </div>
    );
  }

  const currentStepImageUrl = stepImages[currentStepIdx];

  return (
    <div className="fixed inset-0 z-[300] flex items-center justify-center p-0 bg-white/95 backdrop-blur-md">
      <div className="w-full h-full flex flex-col animate-luxe overflow-hidden">
        {!finishedImage ? (
          <div className="flex flex-col md:flex-row h-full">
            <div className="w-full md:w-[45%] p-12 md:p-24 flex flex-col justify-center space-y-12 bg-white">
              <div className="space-y-2">
                <h2 className="text-5xl md:text-7xl font-serif tracking-tighter leading-none">{recipe.title}</h2>
                <p className="text-[10px] tracking-[0.4em] text-slate-400 uppercase font-bold">MOVEMENT {currentStepIdx + 1} OF {recipe.steps.length}</p>
              </div>
              <div className="space-y-4">
                <div className="text-[120px] md:text-[200px] font-serif font-light leading-none tracking-tighter text-[#1a1a1a]">{formatTime(remainingTime)}</div>
                <div className="w-24 h-[2px] bg-[#1a1a1a]"></div>
              </div>
              <div className="space-y-4 max-w-md">
                <h3 className="text-xs tracking-[0.3em] font-bold uppercase">{recipe.steps[currentStepIdx]?.label}</h3>
                <p className="text-xl md:text-2xl font-serif italic text-slate-500 leading-relaxed">"{recipe.steps[currentStepIdx]?.instruction}"</p>
              </div>
              <div className="flex gap-6 w-full pt-12">
                <button 
                  onClick={() => setIsTimerRunning(!isTimerRunning)} 
                  className={`flex-1 py-5 text-[10px] tracking-[0.4em] font-bold border border-[#1a1a1a] transition-all duration-500 ${isTimerRunning ? 'bg-transparent text-[#1a1a1a]' : 'bg-[#1a1a1a] text-white'}`}
                >
                  {isTimerRunning ? 'PAUSE SEQUENCE' : 'COMMENCE'}
                </button>
                <button 
                  onClick={handleNextStep} 
                  disabled={isGenerating}
                  className="flex-1 py-5 text-[10px] tracking-[0.4em] font-bold text-white bg-black hover:bg-zinc-800 transition-all disabled:opacity-50"
                >
                  {currentStepIdx === recipe.steps.length - 1 ? 'FINISH' : 'NEXT PHASE'}
                </button>
              </div>
            </div>
            <div className="flex-1 bg-[#fdfbf7] relative overflow-hidden flex items-center justify-center p-12">
              {currentStepImageUrl && currentStepImageUrl !== 'fallback' ? (
                <img src={currentStepImageUrl} className="w-full h-full object-contain mix-blend-multiply opacity-95 transition duration-[5s] hover:scale-105 saturate-[1.1]" alt="Sequence Visual" />
              ) : currentStepImageUrl === 'fallback' ? (
                <div className="flex flex-col items-center gap-4">
                  <div className="w-8 h-[1px] bg-[#d1cfc7]"></div>
                  <p className="text-xl font-serif text-slate-300 italic">Visual composition unavailable.</p>
                </div>
              ) : (
                <div className="flex flex-col items-center gap-4">
                  <div className="w-8 h-[1px] bg-[#1a1a1a] animate-luxe" style={{animationIterationCount: 'infinite'}}></div>
                  <div className="text-[8px] tracking-[0.5em] text-slate-300 font-bold uppercase">RENDERING VISUALS</div>
                </div>
              )}
              <button onClick={onClose} className="absolute top-12 right-12 p-2 text-[#1a1a1a] hover:rotate-90 transition-transform duration-700">
                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1" d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>
          </div>
        ) : (
          <div className="h-full flex flex-col items-center justify-center py-20 px-8 text-center bg-[#fdfbf7] animate-luxe overflow-y-auto">
            <div className="max-w-5xl w-full flex flex-col items-center space-y-8">
              <div className="space-y-4">
                <h2 className="text-5xl md:text-6xl font-serif tracking-tighter leading-none text-[#1a1a1a]">Bon Appétit</h2>
                <p className="text-[10px] md:text-xs tracking-[0.6em] text-slate-400 font-bold uppercase">A NEW MASTERPIECE IS BORN</p>
              </div>

              {howToEatSteps ? (
                <div className="w-full max-w-2xl text-left space-y-10 animate-luxe py-8 border-t border-[#e5e1da]">
                  <h3 className="text-xs tracking-[0.4em] font-bold text-[#1a1a1a] uppercase text-center mb-12">The Sensory Protocol</h3>
                  {howToEatSteps.map((s, i) => (
                    <div key={i} className="flex gap-10 group">
                      <span className="font-serif text-5xl text-[#e5e1da] leading-none shrink-0">{(i + 1).toString().padStart(2, '0')}</span>
                      <div className="space-y-3">
                        <h4 className="text-[11px] tracking-[0.2em] font-bold uppercase text-slate-400">{s.step}</h4>
                        <p className="text-xl font-serif italic text-slate-600 leading-relaxed">"{s.instruction}"</p>
                      </div>
                    </div>
                  ))}
                  <div className="flex justify-center pt-12">
                    <button onClick={() => setHowToEatSteps(null)} className="text-[9px] tracking-[0.5em] font-bold text-slate-300 hover:text-[#1a1a1a] uppercase border-b border-transparent hover:border-[#1a1a1a] transition-all pb-1">Return to Gallery</button>
                  </div>
                </div>
              ) : (
                <>
                  <div className="w-full max-w-3xl aspect-square sm:aspect-video overflow-hidden border border-[#e5e1da] shadow-2xl bg-white flex items-center justify-center">
                    {finishedImage && finishedImage !== 'fallback' ? (
                      <img src={finishedImage} className="w-full h-full object-cover saturate-[1.15] contrast-[1.05] transition-all duration-[4s]" alt="Final Creation" />
                    ) : (
                      <div className="flex flex-col items-center gap-4 p-12 text-center">
                        <div className="w-8 h-[1px] bg-[#d1cfc7]"></div>
                        <p className="text-xl font-serif text-slate-300 italic">Culinary sequence concluded.</p>
                      </div>
                    )}
                  </div>

                  <div className="flex flex-col sm:flex-row gap-8 pt-4">
                    <button 
                      onClick={onClose} 
                      className="px-10 h-14 border border-[#1a1a1a] text-[10px] tracking-[0.5em] font-bold hover:bg-[#1a1a1a] hover:text-white transition-all uppercase"
                    >
                      EXIT GALLERY
                    </button>
                    <button 
                      onClick={fetchHowToEat}
                      disabled={isFetchingHowToEat}
                      className="px-10 h-14 bg-[#1a1a1a] text-white text-[10px] tracking-[0.5em] font-bold hover:bg-black transition-all uppercase shadow-lg disabled:opacity-50"
                    >
                      {isFetchingHowToEat ? 'CONSULTING EXPERTS...' : 'HOW TO EAT'}
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
