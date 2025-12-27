
import React, { useState } from 'react';
import { getCookingSuggestion } from '../services/geminiService';
import { AIRecipeResponse } from '../types';

interface AIModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddTimer: (label: string, seconds: number, category: 'ai') => void;
}

export const AIModal: React.FC<AIModalProps> = ({ isOpen, onClose, onAddTimer }) => {
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<AIRecipeResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;
    
    setLoading(true);
    setError(null);
    try {
      const suggestion = await getCookingSuggestion(query);
      setResult(suggestion);
    } catch (err) {
      setError('Failed to get suggestion. Please try again.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
      <div className="bg-white rounded-3xl w-full max-w-lg shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-300">
        <div className="p-6 border-b flex justify-between items-center bg-slate-50">
          <h2 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
            <span className="text-purple-600 text-3xl">✨</span> AI Chef Assistant
          </h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 transition-colors">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>

        <div className="p-6">
          {!result ? (
            <form onSubmit={handleSearch} className="space-y-4">
              <p className="text-slate-600 mb-2">Describe what you're cooking, and I'll find the perfect time for you.</p>
              <div className="relative">
                <input
                  autoFocus
                  type="text"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="e.g., Medium-well ribeye steak 1.5 inch thick"
                  className="w-full px-5 py-4 bg-slate-100 border-none rounded-2xl text-slate-800 placeholder:text-slate-400 focus:ring-2 focus:ring-purple-500 transition-all outline-none"
                />
              </div>
              <button
                type="submit"
                disabled={loading || !query.trim()}
                className="w-full py-4 bg-purple-600 text-white font-bold rounded-2xl hover:bg-purple-700 disabled:opacity-50 transition-all flex items-center justify-center gap-2"
              >
                {loading ? (
                  <><div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Thinking...</>
                ) : (
                  'Ask AI'
                )}
              </button>
              {error && <p className="text-red-500 text-center text-sm">{error}</p>}
            </form>
          ) : (
            <div className="space-y-6">
              <div className="bg-purple-50 border border-purple-100 rounded-2xl p-5">
                <h3 className="text-xl font-bold text-purple-900 mb-1">{result.foodName}</h3>
                <p className="text-purple-700 text-sm mb-4 font-medium flex items-center gap-2">
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" /></svg>
                  {result.cookingMethod} • {Math.floor(result.suggestedTimeInSeconds / 60)} mins {result.suggestedTimeInSeconds % 60 > 0 ? `${result.suggestedTimeInSeconds % 60}s` : ''}
                  {result.temperature && ` • ${result.temperature}`}
                </p>
                
                <div className="space-y-2">
                  <p className="text-slate-800 font-bold text-sm uppercase">Pro Tips:</p>
                  <ul className="space-y-1">
                    {result.tips.map((tip, idx) => (
                      <li key={idx} className="text-slate-600 text-sm flex gap-2">
                        <span className="text-purple-500">•</span> {tip}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => {
                    onAddTimer(result.foodName, result.suggestedTimeInSeconds, 'ai');
                    onClose();
                  }}
                  className="flex-1 py-4 bg-orange-500 text-white font-bold rounded-2xl hover:bg-orange-600 transition-all shadow-lg shadow-orange-200"
                >
                  Create Timer
                </button>
                <button
                  onClick={() => setResult(null)}
                  className="px-6 py-4 bg-slate-100 text-slate-600 font-bold rounded-2xl hover:bg-slate-200 transition-all"
                >
                  Try Another
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
