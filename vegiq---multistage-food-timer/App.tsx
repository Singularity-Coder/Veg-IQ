
import React, { useState, useEffect, useRef } from 'react';
import { Ingredient, Recipe, Timer, RecipeStep } from './types';
import { 
  analyzeIngredients, 
  getRecipesForIngredients, 
  playInstructionVoice, 
  stopVoice, 
  generateRecipeImage,
  generateStepImage
} from './services/geminiService';
import { AIModal } from './components/AIModal';
import { TimerItem } from './components/TimerItem';

const App: React.FC = () => {
  const [ingredients, setIngredients] = useState<Ingredient[]>([]);
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [timers, setTimers] = useState<Timer[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [activeRecipe, setActiveRecipe] = useState<Recipe | null>(null);
  const [currentStepIdx, setCurrentStepIdx] = useState(-1);
  const [remainingTime, setRemainingTime] = useState(0);
  const [isTimerRunning, setIsTimerRunning] = useState(false);
  const [finishedImage, setFinishedImage] = useState<string | null>(null);
  const [isGeneratingImage, setIsGeneratingImage] = useState(false);
  const [isAIModalOpen, setIsAIModalOpen] = useState(false);
  const [stepImages, setStepImages] = useState<Record<number, string>>({});
  const [isGeneratingStepImage, setIsGeneratingStepImage] = useState(false);
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Manual Timers Logic
  useEffect(() => {
    const interval = setInterval(() => {
      setTimers(prev => prev.map(timer => {
        if (timer.status === 'running' && timer.remaining > 0) {
          const nextRemaining = timer.remaining - 1;
          if (nextRemaining === 0) {
            playInstructionVoice(`Time is up for ${timer.label}`);
            return { ...timer, remaining: 0, status: 'finished' };
          }
          return { ...timer, remaining: nextRemaining };
        }
        return timer;
      }));
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  // Recipe Timer Logic
  useEffect(() => {
    let interval: any;
    if (isTimerRunning && remainingTime > 0) {
      interval = setInterval(() => {
        setRemainingTime(prev => prev - 1);
      }, 1000);
    } else if (isTimerRunning && remainingTime === 0) {
      setIsTimerRunning(false);
      handleNextStep();
    }
    return () => clearInterval(interval);
  }, [isTimerRunning, remainingTime]);

  const fetchStepImage = async (idx: number) => {
    if (!activeRecipe || stepImages[idx]) return;
    setIsGeneratingStepImage(true);
    try {
      const step = activeRecipe.steps[idx];
      const url = await generateStepImage(activeRecipe.title, step.label, step.instruction);
      if (url) {
        setStepImages(prev => ({ ...prev, [idx]: url }));
      }
    } catch (e) {
      console.error("Step image generation failed", e);
    } finally {
      setIsGeneratingStepImage(false);
    }
  };

  const announceStep = (idx: number) => {
    if (activeRecipe && idx >= 0) {
      const step = activeRecipe.steps[idx];
      const announcement = `Step ${idx + 1}: ${step.label}. ${step.instruction}`;
      playInstructionVoice(announcement);
    }
  };

  const handleNextStep = () => {
    if (!activeRecipe) return;
    const nextIdx = currentStepIdx + 1;
    
    stopVoice();

    if (nextIdx < activeRecipe.steps.length) {
      const nextStep = activeRecipe.steps[nextIdx];
      setCurrentStepIdx(nextIdx);
      setRemainingTime(nextStep.durationSeconds);
      setIsTimerRunning(false); 
      announceStep(nextIdx);
      fetchStepImage(nextIdx);
    } else {
      playInstructionVoice("Cooking complete! Let's see how your masterpiece looks.");
      handleFinishRecipe();
    }
  };

  const handleFinishRecipe = async () => {
    if (!activeRecipe) return;
    setIsGeneratingImage(true);
    try {
      const imageUrl = await generateRecipeImage(activeRecipe.title);
      setFinishedImage(imageUrl);
    } catch (e) {
      console.error("Failed to generate image", e);
    } finally {
      setIsGeneratingImage(false);
    }
  };

  const startRecipe = (recipe: Recipe) => {
    setFinishedImage(null);
    setStepImages({});
    setActiveRecipe(recipe);
    setCurrentStepIdx(0);
    const firstStep = recipe.steps[0];
    setRemainingTime(firstStep.durationSeconds);
    setIsTimerRunning(false);
    fetchStepImage(0); 
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    setIsLoading(true);
    const reader = new FileReader();
    reader.onloadend = async () => {
      const base64 = (reader.result as string).split(',')[1];
      const newIngredients = await analyzeIngredients({ imageBase64: base64 });
      setIngredients(prev => [...prev, ...newIngredients]);
      setIsLoading(false);
    };
    reader.readAsDataURL(file);
  };

  const addIngredientByText = async (text: string) => {
    if (!text) return;
    setIsLoading(true);
    const newIngredients = await analyzeIngredients({ text });
    setIngredients(prev => [...prev, ...newIngredients]);
    setIsLoading(false);
  };

  const addManualTimer = (label: string, seconds: number, category: any) => {
    const newTimer: Timer = {
      id: Math.random().toString(36).substr(2, 9),
      label,
      duration: seconds,
      remaining: seconds,
      status: 'idle',
      category,
      createdAt: Date.now()
    };
    setTimers(prev => [newTimer, ...prev]);
  };

  const toggleTimer = (id: string) => {
    setTimers(prev => prev.map(t => {
      if (t.id === id) {
        if (t.status === 'running') return { ...t, status: 'paused' };
        if (t.status === 'paused' || t.status === 'idle') return { ...t, status: 'running' };
      }
      return t;
    }));
  };

  const resetTimer = (id: string) => {
    setTimers(prev => prev.map(t => t.id === id ? { ...t, remaining: t.duration, status: 'idle' } : t));
  };

  const deleteTimer = (id: string) => {
    setTimers(prev => prev.filter(t => t.id !== id));
  };

  const formatTime = (s: number) => {
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `${m}:${sec.toString().padStart(2, '0')}`;
  };

  const closeRecipeOverlay = () => {
    setActiveRecipe(null);
    setCurrentStepIdx(-1);
    setFinishedImage(null);
    setIsTimerRunning(false);
    setStepImages({});
    stopVoice();
  };

  const getSuggestions = async () => {
    if (ingredients.length === 0) return;
    setIsLoading(true);
    const sug = await getRecipesForIngredients(ingredients);
    setRecipes(sug);
    setIsLoading(false);
  };

  const getRecipeTimerButtonLabel = () => {
    if (isTimerRunning) return 'Pause';
    if (!activeRecipe) return 'Start';
    const currentStep = activeRecipe.steps[currentStepIdx];
    if (remainingTime === currentStep?.durationSeconds) return 'Start';
    return 'Resume';
  };

  const handleRecipeTimerToggle = () => {
    const newState = !isTimerRunning;
    setIsTimerRunning(newState);
    
    if (newState && activeRecipe && currentStepIdx >= 0) {
        const currentStep = activeRecipe.steps[currentStepIdx];
        if (remainingTime === currentStep?.durationSeconds) {
            announceStep(currentStepIdx);
        }
    }
  };

  return (
    <div className="min-h-screen bg-emerald-50 text-slate-900 pb-20 font-sans">
      <header className="bg-white border-b border-emerald-100 p-6 sticky top-0 z-10 shadow-sm">
        <div className="max-w-4xl mx-auto flex justify-between items-center">
          <h1 className="text-3xl font-serif font-bold text-emerald-800">VegIQ</h1>
          <div className="flex gap-2">
            <button 
              onClick={() => setIsAIModalOpen(true)}
              className="bg-indigo-600 text-white px-4 py-2 rounded-xl font-bold hover:bg-indigo-700 transition flex items-center gap-2 shadow-lg"
            >
              <span className="text-lg">✨</span> Ask AI
            </button>
             <button 
              onClick={() => fileInputRef.current?.click()}
              className="bg-emerald-600 text-white px-4 py-2 rounded-xl font-bold hover:bg-emerald-700 transition flex items-center gap-2 shadow-lg"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
              Scan
            </button>
            <input type="file" ref={fileInputRef} onChange={handleFileChange} className="hidden" accept="image/*" />
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto p-4 md:p-8 space-y-16">
        {/* Step 1: Fridge */}
        <section>
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold text-emerald-900 flex items-center gap-3">
              <span className="bg-emerald-100 p-2 rounded-lg text-lg">🥦</span> Your Fridge
            </h2>
            {ingredients.length > 0 && (
              <button onClick={() => setIngredients([])} className="text-sm text-red-500 font-bold hover:underline">Clear All</button>
            )}
          </div>
          
          <div className="flex gap-2 mb-6">
            <input 
              onKeyDown={(e) => { if(e.key === 'Enter') { addIngredientByText(e.currentTarget.value); e.currentTarget.value = ''; } }}
              type="text" 
              placeholder="Type an ingredient (e.g. spinach, paneer)" 
              className="flex-1 px-6 py-4 rounded-2xl border border-emerald-100 bg-white text-slate-800 placeholder:text-slate-400 focus:ring-2 focus:ring-emerald-500 outline-none shadow-sm transition-all text-lg"
            />
          </div>

          {isLoading && <div className="text-center py-10"><div className="w-12 h-12 border-4 border-emerald-100 border-t-emerald-600 rounded-full animate-spin mx-auto mb-3"></div><p className="text-emerald-800 font-bold tracking-tight">AI Chef is exploring your fridge...</p></div>}

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {ingredients.map(ing => (
              <div key={ing.id} className="bg-white p-5 rounded-3xl border border-emerald-50 shadow-sm hover:shadow-xl hover:-translate-y-1 transition duration-300">
                <div className="flex justify-between items-start mb-3">
                  <h3 className="font-bold text-emerald-950 text-xl">{ing.name}</h3>
                  <span className="text-xs bg-emerald-50 text-emerald-800 px-3 py-1 rounded-full font-bold border border-emerald-100">{ing.calories} kcal</span>
                </div>
                <div className="grid grid-cols-3 gap-2 text-[10px] uppercase font-black text-slate-400 mb-4 tracking-tighter">
                  <div className="bg-slate-50 p-1 rounded-md text-center">P: {ing.protein}</div>
                  <div className="bg-slate-50 p-1 rounded-md text-center">C: {ing.carbs}</div>
                  <div className="bg-slate-50 p-1 rounded-md text-center">F: {ing.fat}</div>
                </div>
                <p className="text-xs text-slate-500 leading-relaxed font-medium">{ing.properties}</p>
              </div>
            ))}
          </div>

          {ingredients.length > 0 && !isLoading && (
            <button 
              onClick={getSuggestions}
              className="w-full mt-10 py-6 bg-emerald-900 text-white rounded-3xl font-black text-2xl hover:bg-emerald-950 transition-all shadow-xl shadow-emerald-200 flex items-center justify-center gap-3"
            >
              🥗 Get Recipe Suggestions
            </button>
          )}
        </section>

        {/* Step 2: Recipes */}
        {recipes.length > 0 && (
          <section className="animate-in fade-in slide-in-from-bottom duration-700">
            <h2 className="text-2xl font-bold text-emerald-900 mb-8 flex items-center gap-3">
              <span className="bg-emerald-100 p-2 rounded-lg text-lg">👨‍🍳</span> Recipe Recommendations
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {recipes.map(recipe => (
                <div key={recipe.id} className="bg-white rounded-[40px] overflow-hidden border border-emerald-50 shadow-md hover:shadow-2xl transition duration-500 flex flex-col group">
                  <div className="p-8 flex-1">
                    <div className="flex justify-between items-center mb-4">
                      <span className="text-[10px] font-black uppercase tracking-[0.2em] text-emerald-600 bg-emerald-50 px-3 py-1 rounded-full">{recipe.difficulty} • {recipe.totalTime}</span>
                    </div>
                    <h3 className="text-2xl font-black text-slate-900 mb-3 group-hover:text-emerald-700 transition">{recipe.title}</h3>
                    <p className="text-slate-500 text-sm mb-6 leading-relaxed line-clamp-3">{recipe.description}</p>
                    <div className="space-y-3">
                      <p className="text-[10px] font-black text-slate-300 uppercase tracking-widest">Recipe Preview</p>
                      {recipe.steps.slice(0, 3).map((s, i) => (
                        <div key={i} className="flex gap-3 text-sm text-slate-600 font-medium">
                          <span className="font-black text-emerald-500">{i+1}</span> {s.label}
                        </div>
                      ))}
                    </div>
                  </div>
                  <button 
                    onClick={() => startRecipe(recipe)}
                    className="w-full bg-emerald-900 text-white py-6 font-black text-xl hover:bg-emerald-950 transition border-t border-emerald-100 shadow-inner group-hover:py-8"
                  >
                    Start Cook-Along
                  </button>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Quick Timers Section */}
        {timers.length > 0 && (
          <section className="animate-in fade-in slide-in-from-bottom duration-500">
            <div className="flex justify-between items-center mb-8">
              <h2 className="text-2xl font-bold text-emerald-900 flex items-center gap-3">
                <span className="bg-amber-100 p-2 rounded-lg text-lg">⏱️</span> Quick Timers
              </h2>
              <button onClick={() => setTimers([])} className="text-sm text-red-500 font-bold hover:underline">Remove All</button>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {timers.map(timer => (
                <TimerItem 
                  key={timer.id} 
                  timer={timer} 
                  onToggle={toggleTimer} 
                  onReset={resetTimer} 
                  onDelete={deleteTimer} 
                />
              ))}
            </div>
          </section>
        )}
      </main>

      {/* Recipe Modal */}
      {activeRecipe && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md animate-in fade-in duration-300">
          <div className="bg-white rounded-[48px] w-full max-w-6xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh] animate-in zoom-in duration-300">
            {!finishedImage && !isGeneratingImage ? (
              <div className="flex flex-col md:flex-row h-full overflow-hidden">
                {/* Left Side: Controls and Timer */}
                <div className="w-full md:w-1/2 p-10 md:p-14 overflow-y-auto flex flex-col items-center text-center relative custom-scrollbar">
                  {/* Close button for left panel */}
                  <div className="absolute top-8 left-8 md:hidden">
                    <button onClick={closeRecipeOverlay} className="p-3 bg-slate-100 rounded-full text-slate-400 hover:text-red-500 transition-colors">
                      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
                    </button>
                  </div>

                  <div className="mb-6 space-y-2 mt-4 md:mt-0">
                    <h2 className="text-3xl font-black text-slate-900 leading-tight">{activeRecipe.title}</h2>
                    <p className="text-emerald-500 font-black uppercase tracking-[0.2em] text-xs">
                      STEP {currentStepIdx + 1} OF {activeRecipe.steps.length}
                    </p>
                  </div>

                  <div className="mb-10">
                    <div className="text-[100px] md:text-[140px] font-bold text-emerald-600 leading-none tracking-tighter tabular-nums drop-shadow-sm select-none">
                      {formatTime(remainingTime)}
                    </div>
                  </div>

                  <div className="space-y-4 max-w-lg mb-10 flex-1 flex flex-col justify-center">
                    <h3 className="text-2xl font-black text-slate-800">{activeRecipe.steps[currentStepIdx]?.label}</h3>
                    <p className="text-slate-500 text-lg font-medium leading-relaxed italic">
                      "{activeRecipe.steps[currentStepIdx]?.instruction}"
                    </p>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 w-full max-w-md mt-auto">
                    <button 
                      onClick={handleRecipeTimerToggle}
                      className="group relative overflow-hidden py-5 bg-emerald-700 text-white rounded-[32px] font-black text-xl shadow-lg transition-all active:scale-95 flex items-center justify-center"
                    >
                      <span className="absolute left-6 right-6 h-[4px] bg-emerald-800/50 rounded-full"></span>
                      <span className="relative z-10">{getRecipeTimerButtonLabel()}</span>
                    </button>
                    <button 
                      onClick={handleNextStep}
                      className="group relative overflow-hidden py-5 bg-amber-600 text-white rounded-[32px] font-black text-xl hover:bg-amber-700 transition shadow-lg active:scale-95 flex items-center justify-center"
                    >
                      <span className="absolute left-6 right-6 h-[4px] bg-amber-800/50 rounded-full"></span>
                      <span className="relative z-10">Next Step</span>
                    </button>
                  </div>
                </div>

                {/* Right Side: Step Image */}
                <div className="w-full md:w-1/2 relative bg-slate-100 overflow-hidden min-h-[300px] md:min-h-0 border-l border-emerald-50">
                  {stepImages[currentStepIdx] ? (
                    <img 
                      src={stepImages[currentStepIdx]} 
                      alt={activeRecipe.steps[currentStepIdx].label}
                      className="w-full h-full object-cover animate-in fade-in duration-700"
                    />
                  ) : (
                    <div className="w-full h-full flex flex-col items-center justify-center gap-4 text-emerald-200">
                      <div className="w-12 h-12 border-4 border-emerald-50 border-t-emerald-300 rounded-full animate-spin"></div>
                      <span className="text-xs font-black uppercase tracking-widest text-emerald-400">Visualizing Step...</span>
                    </div>
                  )}
                  {/* Close button for right panel on desktop */}
                  <div className="hidden md:block absolute top-8 right-8 z-20">
                    <button onClick={closeRecipeOverlay} className="p-3 bg-white/20 hover:bg-white/40 backdrop-blur-md rounded-full text-white transition-all shadow-lg">
                      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
                    </button>
                  </div>
                </div>
              </div>
            ) : isGeneratingImage ? (
              <div className="flex flex-col items-center justify-center py-24 gap-6 min-h-[500px]">
                <div className="w-20 h-20 border-8 border-emerald-100 border-t-emerald-600 rounded-full animate-spin"></div>
                <h2 className="text-3xl font-black text-emerald-900">Plating your dish...</h2>
                <p className="text-slate-500 text-center max-w-xs font-medium italic">AI Chef is generating a preview of your masterpiece!</p>
              </div>
            ) : (
              <div className="flex flex-col items-center animate-in zoom-in duration-1000 p-10 md:p-20 overflow-y-auto">
                <div className="w-full flex justify-end mb-4">
                  <button onClick={closeRecipeOverlay} className="p-2 bg-slate-100 rounded-full text-slate-400 hover:text-red-500 transition-colors">
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
                  </button>
                </div>
                <div className="text-center mb-10">
                  <h2 className="text-5xl font-black text-emerald-950 mb-2">Bon Appétit!</h2>
                  <p className="text-slate-500 font-bold uppercase tracking-widest">Cooking Sequence Complete</p>
                </div>
                
                {finishedImage && (
                  <div className="relative group mb-10 w-full max-w-lg">
                    <img 
                      src={finishedImage} 
                      alt="Finished Dish" 
                      className="w-full aspect-square object-cover rounded-[64px] shadow-2xl border-8 border-white"
                    />
                  </div>
                )}

                <button 
                  onClick={closeRecipeOverlay}
                  className="w-full max-w-md py-6 bg-slate-900 text-white rounded-[32px] font-black text-2xl hover:bg-black transition-all shadow-xl active:scale-95"
                >
                  Finish Session
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* AI Assistant Modal */}
      <AIModal 
        isOpen={isAIModalOpen} 
        onClose={() => setIsAIModalOpen(false)} 
        onAddTimer={addManualTimer} 
      />
    </div>
  );
};

export default App;
