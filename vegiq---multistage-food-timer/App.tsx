
import React, { useState, useEffect, useRef } from 'react';
import { Ingredient, Recipe, Timer } from './types';
import { analyzeIngredients, getRecipesForIngredients, playInstructionVoice, generateRecipeImage } from './services/geminiService';
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

  const handleNextStep = async () => {
    if (!activeRecipe) return;
    const nextIdx = currentStepIdx + 1;
    if (nextIdx < activeRecipe.steps.length) {
      const nextStep = activeRecipe.steps[nextIdx];
      setCurrentStepIdx(nextIdx);
      setRemainingTime(nextStep.durationSeconds);
      
      const announcement = `Next step: ${nextStep.label}. ${nextStep.instruction}`;
      await playInstructionVoice(announcement);
      setIsTimerRunning(true);
    } else {
      await playInstructionVoice("Cooking complete! Let's see how your masterpiece looks.");
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

  const startRecipe = async (recipe: Recipe) => {
    setFinishedImage(null);
    setActiveRecipe(recipe);
    setCurrentStepIdx(-1);
    await playInstructionVoice(`Starting ${recipe.title}. Get ready.`);
    handleNextStep();
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
  };

  const getSuggestions = async () => {
    if (ingredients.length === 0) return;
    setIsLoading(true);
    const sug = await getRecipesForIngredients(ingredients);
    setRecipes(sug);
    setIsLoading(false);
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
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-md animate-in fade-in duration-300">
          <div className="bg-white rounded-[48px] w-full max-w-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
            <div className="p-8 md:p-12 overflow-y-auto flex-1 custom-scrollbar">
              {!finishedImage && !isGeneratingImage ? (
                <>
                  <div className="flex justify-between items-start mb-8">
                    <div>
                      <h2 className="text-3xl font-black text-slate-900">{activeRecipe.title}</h2>
                      <p className="text-emerald-600 font-black uppercase tracking-widest text-sm mt-1">
                        Step {currentStepIdx + 1} of {activeRecipe.steps.length}
                      </p>
                    </div>
                    <button onClick={closeRecipeOverlay} className="p-3 bg-slate-100 rounded-full text-slate-400 hover:text-red-500 transition-colors">
                       <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
                    </button>
                  </div>

                  <div className="flex flex-col items-center gap-8 mb-10">
                    <div className="relative">
                      <div className="text-8xl md:text-9xl font-mono font-black text-emerald-600 drop-shadow-sm select-none">
                        {formatTime(remainingTime)}
                      </div>
                    </div>
                    <div className="text-center space-y-4 max-w-md">
                      <h3 className="text-3xl font-black text-slate-800">{activeRecipe.steps[currentStepIdx]?.label}</h3>
                      <p className="text-slate-500 text-xl font-medium leading-relaxed">{activeRecipe.steps[currentStepIdx]?.instruction}</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-6">
                    <button 
                      onClick={() => setIsTimerRunning(!isTimerRunning)}
                      className={`py-6 rounded-[32px] font-black text-2xl shadow-lg transition-all active:scale-95 ${isTimerRunning ? 'bg-slate-100 text-slate-700' : 'bg-emerald-600 text-white hover:bg-emerald-700'}`}
                    >
                      {isTimerRunning ? 'Pause' : 'Resume'}
                    </button>
                    <button 
                      onClick={handleNextStep}
                      className="py-6 bg-amber-500 text-white rounded-[32px] font-black text-2xl hover:bg-amber-600 transition shadow-lg active:scale-95"
                    >
                      Skip Step
                    </button>
                  </div>
                </>
              ) : isGeneratingImage ? (
                <div className="flex flex-col items-center justify-center py-24 gap-6">
                  <div className="w-20 h-20 border-8 border-emerald-100 border-t-emerald-600 rounded-full animate-spin"></div>
                  <h2 className="text-3xl font-black text-emerald-900">Plating your dish...</h2>
                  <p className="text-slate-500 text-center max-w-xs font-medium italic">AI Chef is generating a preview of your masterpiece!</p>
                </div>
              ) : (
                <div className="flex flex-col items-center animate-in zoom-in duration-1000">
                  <div className="text-center mb-10">
                    <h2 className="text-5xl font-black text-emerald-950 mb-2">Bon Appétit!</h2>
                    <p className="text-slate-500 font-bold uppercase tracking-widest">Cooking Sequence Complete</p>
                  </div>
                  
                  {finishedImage && (
                    <div className="relative group mb-10">
                      <img 
                        src={finishedImage} 
                        alt="Finished Dish" 
                        className="w-full aspect-square object-cover rounded-[64px] shadow-2xl border-8 border-white"
                      />
                    </div>
                  )}

                  <button 
                    onClick={closeRecipeOverlay}
                    className="w-full py-6 bg-slate-900 text-white rounded-[32px] font-black text-2xl hover:bg-black transition-all shadow-xl active:scale-95"
                  >
                    Finish Session
                  </button>
                </div>
              )}
            </div>
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
