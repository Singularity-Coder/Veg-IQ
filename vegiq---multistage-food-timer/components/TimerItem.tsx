
import React, { useMemo } from 'react';
import { Timer, TimerStatus } from '../types';
import { CATEGORY_COLORS } from '../constants';

interface TimerItemProps {
  timer: Timer;
  onToggle: (id: string) => void;
  onReset: (id: string) => void;
  onDelete: (id: string) => void;
}

const formatTime = (seconds: number): string => {
  const hrs = Math.floor(seconds / 3600);
  const mins = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;
  return `${hrs > 0 ? hrs + ':' : ''}${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
};

export const TimerItem: React.FC<TimerItemProps> = ({ timer, onToggle, onReset, onDelete }) => {
  const progress = useMemo(() => {
    return ((timer.duration - timer.remaining) / timer.duration) * 100;
  }, [timer.duration, timer.remaining]);

  const isFinished = timer.status === 'finished';
  const isRunning = timer.status === 'running';

  return (
    <div className={`relative overflow-hidden bg-white border rounded-2xl p-5 shadow-sm transition-all duration-300 ${isFinished ? 'ring-2 ring-orange-500 animate-ring shadow-lg' : 'hover:shadow-md'}`}>
      {/* Background Progress Bar */}
      <div 
        className="absolute bottom-0 left-0 h-1 bg-orange-500 transition-all duration-1000"
        style={{ width: `${progress}%` }}
      />

      <div className="flex justify-between items-start mb-4">
        <div>
          <span className={`text-xs font-bold uppercase tracking-wider px-2 py-1 rounded-md border ${CATEGORY_COLORS[timer.category]}`}>
            {timer.category}
          </span>
          <h3 className="text-xl font-bold text-slate-800 mt-2 line-clamp-1">{timer.label}</h3>
        </div>
        <button 
          onClick={() => onDelete(timer.id)}
          className="text-slate-400 hover:text-red-500 transition-colors p-1"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
        </button>
      </div>

      <div className="flex flex-col items-center py-4">
        <div className={`text-5xl font-mono font-bold tracking-tighter ${isFinished ? 'text-orange-600' : 'text-slate-800'}`}>
          {formatTime(timer.remaining)}
        </div>
        {isFinished && <p className="text-orange-500 font-bold mt-2 animate-pulse">Time's Up! 👨‍🍳</p>}
      </div>

      <div className="grid grid-cols-2 gap-3 mt-4">
        <button
          onClick={() => onToggle(timer.id)}
          disabled={isFinished}
          className={`flex items-center justify-center gap-2 py-3 rounded-xl font-semibold transition-all ${
            isRunning 
              ? 'bg-slate-100 text-slate-700 hover:bg-slate-200' 
              : 'bg-orange-500 text-white hover:bg-orange-600'
          } ${isFinished ? 'opacity-50 cursor-not-allowed' : ''}`}
        >
          {isRunning ? (
            <><svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zM7 8a1 1 0 012 0v4a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v4a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" /></svg> Pause</>
          ) : (
            <><svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" /></svg> Start</>
          )}
        </button>
        <button
          onClick={() => onReset(timer.id)}
          className="flex items-center justify-center gap-2 py-3 rounded-xl border border-slate-200 font-semibold text-slate-600 hover:bg-slate-50 transition-all"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg> Reset
        </button>
      </div>
    </div>
  );
};
