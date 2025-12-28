
import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { Recipe, RecipeStep } from '../../types';

interface CustomLabTabProps {
  manualRecipes: Recipe[];
  setManualRecipes: React.Dispatch<React.SetStateAction<Recipe[]>>;
  onStartRecipe: (r: Recipe) => void;
}

export const CustomLabTab: React.FC<CustomLabTabProps> = ({ manualRecipes, setManualRecipes, onStartRecipe }) => {
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [editingRecipe, setEditingRecipe] = useState<Recipe | null>(null);
  
  const [formData, setFormData] = useState<Partial<Recipe>>({
    title: '', 
    description: '', 
    difficulty: 'Easy', 
    steps: [{ label: '', instruction: '', durationSeconds: 60 }]
  });

  const openCreateMode = () => {
    setEditingRecipe(null);
    setFormData({
      title: '', 
      description: '', 
      difficulty: 'Easy', 
      steps: [{ label: '', instruction: '', durationSeconds: 60 }]
    });
    setIsEditorOpen(true);
    document.body.style.overflow = 'hidden';
  };

  const openEditMode = (recipe: Recipe) => {
    setEditingRecipe(recipe);
    setFormData({ ...recipe });
    setIsEditorOpen(true);
    document.body.style.overflow = 'hidden';
  };

  const closeEditor = () => {
    setIsEditorOpen(false);
    document.body.style.overflow = 'auto';
  };

  const deleteRecipe = (id: string) => {
    if (confirm('Are you sure you wish to remove this composition from your library?')) {
      setManualRecipes(prev => prev.filter(r => r.id !== id));
    }
  };

  const saveRecipe = () => {
    if (!formData.title || !formData.steps?.length) {
      alert("Please provide a title and at least one movement.");
      return;
    }
    
    const totalSeconds = formData.steps.reduce((acc, s) => acc + s.durationSeconds, 0);
    const finalRecipe: Recipe = {
      ...(formData as Recipe),
      id: editingRecipe?.id || Math.random().toString(36).substr(2, 9),
      totalTime: `${Math.ceil(totalSeconds / 60)} mins`
    };

    if (editingRecipe) {
      setManualRecipes(prev => prev.map(r => r.id === editingRecipe.id ? finalRecipe : r));
    } else {
      setManualRecipes(prev => [finalRecipe, ...prev]);
    }

    closeEditor();
  };

  const handleStepUpdate = (index: number, field: keyof RecipeStep, value: string | number) => {
    const updatedSteps = [...(formData.steps || [])];
    updatedSteps[index] = { ...updatedSteps[index], [field]: value };
    setFormData({ ...formData, steps: updatedSteps });
  };

  const inputClasses = "w-full h-12 sm:h-14 px-8 bg-white border border-[#e5e1da] text-sm font-light outline-none focus:border-[#1a1a1a] transition-all placeholder:text-slate-500 shadow-sm";
  const labelClasses = "text-[10px] font-bold text-slate-500 tracking-[0.2em] uppercase mb-3 block";

  return (
    <div className="space-y-16 animate-luxe">
      {/* Library View Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-8">
        <div className="text-left space-y-1">
          <h2 className="text-2xl sm:text-3xl font-serif tracking-tight text-[#1a1a1a]">Composition Library</h2>
          <p className="text-[10px] text-slate-400 tracking-widest">Your Private Culinary Scores</p>
        </div>
        <button 
          onClick={openCreateMode}
          className="px-10 py-3 bg-[#1a1a1a] text-white text-[10px] tracking-[0.3em] font-bold hover:bg-black transition-all uppercase flex items-center gap-3 shadow-sm"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M12 4v16m8-8H4" />
          </svg>
          New Composition
        </button>
      </div>

      {/* Grid Library View */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-12">
        {manualRecipes.length === 0 ? (
          <div className="col-span-full py-32 text-center border border-[#e5e1da] border-dashed flex flex-col items-center justify-center gap-6">
            <span className="text-2xl sm:text-3xl font-serif text-[#e5e1da]">The archive is silent.</span>
            <button 
              onClick={openCreateMode}
              className="text-[10px] tracking-[0.4em] font-bold text-slate-400 border-b border-[#e5e1da] pb-1 hover:text-[#1a1a1a] hover:border-[#1a1a1a] transition-all uppercase"
            >
              Compose your first movement
            </button>
          </div>
        ) : (
          manualRecipes.map(r => (
            <div key={r.id} className="group border border-[#e5e1da] bg-white p-10 flex flex-col justify-between space-y-8 hover:shadow-2xl hover:-translate-y-1 transition-all duration-500">
              <div className="space-y-4">
                <div className="flex justify-between items-start">
                  <span className="text-[9px] tracking-[0.3em] font-bold text-slate-300 uppercase">{r.totalTime}</span>
                  <div className="flex gap-4 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button onClick={() => openEditMode(r)} className="text-slate-400 hover:text-[#1a1a1a] transition-colors" title="Edit">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>
                    </button>
                    <button onClick={() => deleteRecipe(r.id)} className="text-slate-400 hover:text-red-800 transition-colors" title="Delete">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.2" d="M19 7l-.867 12.142A2 2.032 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                    </button>
                  </div>
                </div>
                <h3 className="text-2xl font-serif tracking-tight text-[#1a1a1a] leading-tight">{r.title}</h3>
                <p className="text-xs text-slate-500 leading-relaxed font-light line-clamp-3">"{r.description}"</p>
              </div>
              <button 
                onClick={() => onStartRecipe(r)}
                className="w-full py-4 text-[10px] tracking-[0.5em] font-bold border border-[#1a1a1a] hover:bg-[#1a1a1a] hover:text-white transition-all uppercase"
              >
                Execute
              </button>
            </div>
          ))
        )}
      </div>

      {/* EDITOR PORTAL */}
      {isEditorOpen && createPortal(
        <div className="fixed inset-0 z-[1000] bg-[#fdfbf7] flex flex-col overflow-hidden animate-luxe">
          <header className="w-full px-8 py-5 sm:py-8 bg-white border-b border-[#e5e1da] flex justify-center items-center shrink-0">
            <div className="max-w-7xl w-full px-6 flex justify-between items-center">
              <h2 className="text-2xl sm:text-3xl font-serif tracking-tight text-[#1a1a1a]">
                {editingRecipe ? 'Refine Composition' : 'Draft New Composition'}
              </h2>
              <button 
                onClick={closeEditor}
                className="p-2 text-slate-400 hover:text-[#1a1a1a] transition-all"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </header>

          <main className="flex-1 overflow-y-auto custom-scroll bg-[#fdfbf7]">
            <div className="max-w-7xl mx-auto px-6 pb-32">
              
              {/* Identity Section */}
              <div className="py-12 space-y-12">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-10 items-start">
                  <div className="space-y-8">
                    <div className="space-y-0">
                      <label className={labelClasses}>Composition Title</label>
                      <input 
                        autoFocus
                        type="text" 
                        value={formData.title} 
                        onChange={e => setFormData({ ...formData, title: e.target.value.toUpperCase() })} 
                        placeholder="E.G. MIDNIGHT GARDEN RISOTTO" 
                        className={inputClasses}
                      />
                    </div>
                    <div className="space-y-0">
                      <label className={labelClasses}>Difficulty Level</label>
                      <select 
                        value={formData.difficulty} 
                        onChange={e => setFormData({ ...formData, difficulty: e.target.value as any })}
                        className={inputClasses + " cursor-pointer font-bold tracking-widest uppercase"}
                      >
                        <option value="Easy">EASY</option>
                        <option value="Medium">MEDIUM</option>
                        <option value="Hard">HARD</option>
                      </select>
                    </div>
                  </div>
                  <div className="space-y-0">
                    <label className={labelClasses}>Manifesto</label>
                    <textarea 
                      value={formData.description} 
                      onChange={e => setFormData({ ...formData, description: e.target.value })} 
                      placeholder="Describe the soul of this culinary creation..." 
                      className="w-full h-[11.5rem] p-8 bg-white border border-[#e5e1da] text-sm font-light outline-none focus:border-[#1a1a1a] transition-all resize-none placeholder:text-slate-500 leading-relaxed shadow-sm" 
                    />
                  </div>
                </div>
              </div>

              {/* Movements Header Section */}
              <div className="flex justify-between items-end pb-8 border-b border-[#e5e1da] mb-12">
                <div className="space-y-1">
                  <h3 className="text-[12px] tracking-[0.5em] font-bold uppercase text-[#1a1a1a]">MOVEMENTS</h3>
                  <p className="text-[9px] text-slate-400 uppercase tracking-[0.3em] font-medium">The sequence of execution</p>
                </div>
                <button 
                  onClick={() => setFormData({ ...formData, steps: [...(formData.steps || []), { label: '', instruction: '', durationSeconds: 60 }] })} 
                  className="px-6 py-2.5 text-[9px] tracking-[0.3em] font-bold border border-[#1a1a1a] hover:bg-[#1a1a1a] hover:text-white transition-all uppercase"
                >
                  + Add Step
                </button>
              </div>

              {/* Movements List */}
              <div className="space-y-12">
                {formData.steps?.map((s, i) => (
                  <div key={i} className="group animate-luxe space-y-8 pb-12 border-b border-[#e5e1da] last:border-0 last:pb-0">
                    <div className="flex justify-between items-center">
                      <span className="font-serif text-4xl text-[#e5e1da] leading-none">{(i + 1).toString().padStart(2, '0')}</span>
                      {formData.steps && formData.steps.length > 1 && (
                        <button 
                          onClick={() => {
                            const ns = [...(formData.steps || [])];
                            ns.splice(i, 1);
                            setFormData({ ...formData, steps: ns });
                          }}
                          className="text-[9px] text-slate-400 hover:text-red-800 tracking-[0.2em] uppercase font-bold transition-colors"
                        >
                          Remove
                        </button>
                      )}
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-8">
                      <div className="space-y-0">
                         <label className={labelClasses.replace('text-slate-500', 'text-slate-400')}>Phase Identity</label>
                         <input 
                          type="text" 
                          placeholder="E.G. THE INFUSION" 
                          value={s.label} 
                          onChange={e => handleStepUpdate(i, 'label', e.target.value.toUpperCase())} 
                          className={inputClasses}
                        />
                      </div>
                      <div className="space-y-0">
                        <label className={labelClasses.replace('text-slate-500', 'text-slate-400')}>Duration (Seconds)</label>
                        <input 
                          type="number" 
                          value={s.durationSeconds} 
                          onChange={e => handleStepUpdate(i, 'durationSeconds', parseInt(e.target.value) || 0)} 
                          className={inputClasses}
                        />
                      </div>
                    </div>

                    <div className="space-y-0">
                      <label className={labelClasses.replace('text-slate-500', 'text-slate-400')}>Execution Details</label>
                      <textarea 
                        placeholder="Detail the technical method..." 
                        value={s.instruction} 
                        onChange={e => handleStepUpdate(i, 'instruction', e.target.value)} 
                        className="w-full bg-white border border-[#e5e1da] p-8 text-sm font-light outline-none resize-none h-32 focus:border-[#1a1a1a] transition-all placeholder:text-slate-500 leading-relaxed shadow-sm" 
                      />
                    </div>
                  </div>
                ))}
              </div>

              {/* Bottom Actions - Aligned Right, Matched heights */}
              <div className="mt-12 flex flex-col sm:flex-row items-center justify-end gap-6">
                <button 
                  onClick={closeEditor}
                  className="px-8 h-12 flex items-center text-[10px] tracking-[0.4em] font-bold text-slate-400 hover:text-[#1a1a1a] transition-all uppercase"
                >
                  Discard Changes
                </button>
                <button 
                  onClick={saveRecipe}
                  className="w-full sm:w-auto px-12 h-14 bg-[#1a1a1a] text-white text-[10px] tracking-[0.4em] font-bold hover:bg-black transition-all uppercase shadow-xl"
                >
                  Archive Composition
                </button>
              </div>
            </div>
          </main>
          
          <style>{`
            .custom-scroll::-webkit-scrollbar {
              width: 3px;
            }
            .custom-scroll::-webkit-scrollbar-thumb {
              background: #e5e1da;
            }
          `}</style>
        </div>,
        document.body
      )}
    </div>
  );
};
