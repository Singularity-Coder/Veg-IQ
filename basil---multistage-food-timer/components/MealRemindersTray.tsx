
import React from 'react';
import { MealReminder } from '../types';

interface MealRemindersTrayProps {
  reminders: MealReminder[];
  onUpdate: (id: string, updates: Partial<MealReminder>) => void;
  onAdd: () => void;
  onRequestPermission: () => void;
}

export const MealRemindersTray: React.FC<MealRemindersTrayProps> = ({ reminders, onUpdate, onAdd, onRequestPermission }) => (
  <div className="fixed top-24 sm:top-32 right-6 sm:right-10 z-[150] w-[calc(100vw-3rem)] max-w-sm animate-luxe">
    <div className="bg-white shadow-2xl border border-[#e5e1da] p-6 sm:p-10 space-y-8 sm:space-y-10">
      <div className="flex justify-between items-center border-b border-[#e5e1da] pb-4">
        <h3 className="text-xs tracking-[0.3em] font-bold text-[#1a1a1a]">MEAL ALERTS</h3>
        <button onClick={onRequestPermission} className="text-[9px] font-bold text-slate-400 hover:text-[#1a1a1a] tracking-widest uppercase">BROWSER ACCESS</button>
      </div>
      <div className="space-y-6">
        {reminders.map(r => (
          <div key={r.id} className="flex items-center justify-between pb-4 border-b border-[#f3f1ed]">
            <div className="flex-1 space-y-1">
              <input type="text" value={r.label} onChange={(e) => onUpdate(r.id, { label: e.target.value.toUpperCase() })} className="text-[11px] font-bold tracking-[0.2em] text-[#1a1a1a] bg-transparent outline-none w-full" />
              <input type="time" value={r.time} onChange={(e) => onUpdate(r.id, { time: e.target.value })} className="text-xs font-light text-slate-400 bg-transparent outline-none" />
            </div>
            <button onClick={() => onUpdate(r.id, { enabled: !r.enabled })} className={`w-10 h-5 border border-[#1a1a1a] p-0.5 transition-all ${r.enabled ? 'bg-[#1a1a1a]' : 'bg-transparent'}`}>
              <div className={`h-full aspect-square transition-all ${r.enabled ? 'translate-x-5 bg-white' : 'translate-x-0 bg-[#1a1a1a]'}`}></div>
            </button>
          </div>
        ))}
      </div>
      <button onClick={onAdd} className="w-full py-4 text-[9px] tracking-[0.3em] font-bold text-[#1a1a1a] border border-[#1a1a1a] hover:bg-[#1a1a1a] hover:text-white transition-all uppercase">+ ADD NEW ALERT</button>
    </div>
  </div>
);
