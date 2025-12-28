
import React, { useState, useEffect } from 'react';
import { Recipe } from '../types';
import { stopVoice, generateRecipeImage, generateStepImage, playInstructionVoice } from '../services/geminiService';

interface RecipeOverlayProps {
  recipe: Recipe;
  onClose: () => void;
}

export const RecipeOverlay: React.FC<RecipeOverlayProps> = ({ recipe, onClose }) => {
  const [currentStepIdx, setCurrentStepIdx] = useState(0);
  const [remainingTime, setRemainingTime] = useState(recipe.steps[0].durationSeconds);
  const [isTimerRunning, setIsTimerRunning] = useState(false);
  const [finishedImage, setFinishedImage] = useState<string | null>(null);
  const [stepImages, setStepImages] = useState<Record<number, string>>({});
  const [isGenerating, setIsGenerating] = useState(false);

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
  }, [isTimerRunning, remainingTime]);

  const fetchStepImage = async (idx: number) => {
    const url = await generateStepImage(recipe.title, recipe.steps[idx].label, recipe.steps[idx].instruction);
    if (url) setStepImages(prev => ({ ...prev, [idx]: url }));
  };

  const handleNextStep = () => {
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
    const img = await generateRecipeImage(recipe.title);
    setFinishedImage(img);
    playInstructionVoice("Bon Appétit! Your cooking sequence is complete.");
    setIsGenerating(false);
  };

  const formatTime = (s: number) => {
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `${m}:${sec.toString().padStart(2, '0')}`;
  };

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
                <button onClick={() => setIsTimerRunning(!isTimerRunning)} className={`flex-1 py-5 text-[10px] tracking-[0.4em] font-bold border border-[#1a1a1a] transition-all duration-500 ${isTimerRunning ? 'bg-transparent text-[#1a1a1a]' : 'bg-[#1a1a1a] text-white'}`}>{isTimerRunning ? 'PAUSE SEQUENCE' : 'COMMENCE'}</button>
                <button onClick={handleNextStep} className="flex-1 py-5 text-[10px] tracking-[0.4em] font-bold text-white bg-black hover:bg-zinc-800 transition-all">NEXT PHASE</button>
              </div>
            </div>
            <div className="flex-1 bg-[#fdfbf7] relative overflow-hidden flex items-center justify-center p-12">
              {stepImages[currentStepIdx] ? (
                <img src={stepImages[currentStepIdx]} className="w-full h-full object-contain mix-blend-multiply opacity-90 transition duration-[5s] hover:scale-105" alt="Sequence Visual" />
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
          <div className="h-full flex flex-col items-center justify-center p-24 text-center space-y-16 animate-luxe">
            <div className="space-y-4">
              <h2 className="text-8xl font-serif tracking-tighter">Finis</h2>
              <p className="text-xs tracking-[0.6em] text-slate-400 font-bold">A MASTERPIECE IS BORN</p>
            </div>
            <div className="max-w-4xl w-full aspect-square md:aspect-video overflow-hidden border border-[#e5e1da]">
              <img src={finishedImage} className="w-full h-full object-cover grayscale transition duration-[5s] hover:grayscale-0" alt="Final Creation" />
            </div>
            <button onClick={onClose} className="px-16 py-6 border border-[#1a1a1a] text-[10px] tracking-[0.5em] font-bold hover:bg-[#1a1a1a] hover:text-white transition-all uppercase">EXIT GALLERY</button>
          </div>
        )}
      </div>
    </div>
  );
};
