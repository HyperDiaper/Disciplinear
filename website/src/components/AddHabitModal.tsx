'use client';

import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Icon } from '@iconify/react';
import dynamic from 'next/dynamic';
import { format } from "date-fns";
import { cn } from "@/lib/utils";

// Actions
import { createHabit, updateHabit, deleteHabit } from '@/app/dashboard/actions';

// Components
import Twemoji from './Twemoji';
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

const EmojiPicker = dynamic(() => import('emoji-picker-react'), { ssr: false });

const PRESET_COLORS = [
  '#e06c75', '#e5c07b', '#98c379', '#56b6c2', '#61afef', '#c678dd', '#e0a9d0', '#858585',
];

const DAYS = [
  { key: 'mon', label: 'M' }, { key: 'tue', label: 'T' }, { key: 'wed', label: 'W' },
  { key: 'thu', label: 'T' }, { key: 'fri', label: 'F' }, { key: 'sat', label: 'S' }, { key: 'sun', label: 'S' },
];

function TabButton({ active, onClick, icon, children }: { active: boolean; onClick: () => void; icon?: string; children: React.ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`relative flex-1 py-2 text-[13px] font-bold rounded-[8px] transition-colors flex justify-center items-center gap-1.5 z-10 ${
        active ? 'text-[var(--text-primary)]' : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
      }`}
    >
      {active && (
        <motion.div
          layoutId="tabBackground"
          className="absolute inset-0 bg-[var(--bg-base)] rounded-[8px] shadow-sm z-[-1]"
          transition={{ type: 'spring', bounce: 0, duration: 0.4 }}
        />
      )}
      {icon && <Icon icon={icon} />}
      {children}
    </button>
  );
}

export function HabitForm({ initialData, onSubmit, onClose, submitLabel = 'Create Habit' }: any) {
  const [name, setName] = useState(initialData?.name || '');
  const [description, setDescription] = useState(initialData?.description || '');
  const [emoji, setEmoji] = useState(initialData?.emoji || '');
  const [type, setType] = useState<'task' | 'amount' | 'timer'>(initialData?.type || 'task');
  const [mode, setMode] = useState<'build' | 'quit'>(initialData?.mode || 'build');
  const [color, setColor] = useState(initialData?.color || PRESET_COLORS[0]);
  const [customHex, setCustomHex] = useState(initialData?.color || PRESET_COLORS[0]);
  const [targetValue, setTargetValue] = useState(initialData?.target_value || '');
  const [unit, setUnit] = useState(initialData?.unit || '');
  const [frequency, setFrequency] = useState<string[]>(
    initialData?.frequency ? (Array.isArray(initialData.frequency) ? initialData.frequency : JSON.parse(initialData.frequency)) : ['mon','tue','wed','thu','fri','sat','sun']
  );
  
  const [startDate, setStartDate] = useState(initialData?.start_date || new Date().toISOString().split('T')[0]);
  const [endDate, setEndDate] = useState(initialData?.end_date || '');

  const [showEmoji, setShowEmoji] = useState(false);
  const [showColorPicker, setShowColorPicker] = useState(false);
  const [isPending, setIsPending] = useState(false);
  
  const emojiRef = useRef<HTMLDivElement>(null);
  const colorRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (emojiRef.current && !emojiRef.current.contains(e.target as Node)) setShowEmoji(false);
      if (colorRef.current && !colorRef.current.contains(e.target as Node)) setShowColorPicker(false);
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    setIsPending(true);
    await onSubmit({ 
      name, description, emoji, type, mode, color, frequency, 
      target_value: targetValue ? Number(targetValue) : undefined, 
      unit, start_date: startDate, end_date: endDate || undefined 
    });
    setIsPending(false);
    onClose();
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="relative" ref={emojiRef}>
          <button
            type="button"
            onClick={() => { setShowEmoji(!showEmoji); setShowColorPicker(false); }}
            className={`w-[52px] h-[52px] rounded-[16px] flex items-center justify-center transition-colors shrink-0 ${
              emoji ? 'bg-transparent border-transparent' : 'glass-input border-[var(--border-subtle)]'
            }`}
          >
            {emoji ? <Twemoji emoji={emoji} className="w-[36px] h-[36px]" /> : <Icon icon="lucide:smile" className="text-[var(--text-muted)] text-xl" />}
          </button>
          
          <AnimatePresence>
            {showEmoji && (
              <motion.div
                initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}
                className="absolute top-[60px] left-0 z-50 shadow-2xl rounded-2xl overflow-hidden custom-emoji-picker border border-[var(--border-subtle)]"
              >
                <EmojiPicker onEmojiClick={e => { setEmoji(e.emoji); setShowEmoji(false); }} theme={"auto" as any} height={320} width={280} previewConfig={{ showPreview: false }} />
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <div className="relative" ref={colorRef}>
          <button
            type="button"
            onClick={() => { setShowColorPicker(!showColorPicker); setShowEmoji(false); }}
            className="w-[52px] h-[52px] rounded-[16px] flex items-center justify-center transition-colors shadow-sm border border-white/10 shrink-0"
            style={{ backgroundColor: color }}
          >
            <Icon icon="lucide:palette" className="text-white mix-blend-overlay text-xl opacity-70" />
          </button>

          <AnimatePresence>
            {showColorPicker && (
              <motion.div
                initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}
                className="absolute top-[60px] left-0 z-50 p-4 glass-panel rounded-[24px] shadow-2xl w-[220px]"
              >
                <p className="text-[11px] font-bold text-[var(--text-muted)] mb-3 tracking-wider uppercase px-1">Heat Spectrum</p>
                <div className="grid grid-cols-4 gap-2 mb-3">
                  {PRESET_COLORS.map(c => (
                    <button
                      key={c} type="button"
                      onClick={() => { setColor(c); setCustomHex(c); setShowColorPicker(false); }}
                      className="w-full aspect-square rounded-full transition-all hover:brightness-110"
                      style={{ backgroundColor: c, border: color === c ? '2.5px solid var(--text-primary)' : '2.5px solid transparent' }}
                    />
                  ))}
                </div>
                <div className="w-full h-[1px] bg-[var(--border-subtle)] my-3" />
                <input
                  type="text" value={customHex} onChange={e => {
                    setCustomHex(e.target.value);
                    if (/^#[0-9A-Fa-f]{6}$/.test(e.target.value)) setColor(e.target.value);
                  }}
                  placeholder="#Hex" maxLength={7}
                  className="w-full glass-input rounded-[10px] px-3 py-2 text-[13px] font-mono outline-none text-center"
                />
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <div className="flex-1 ml-1 flex flex-col gap-1.5">
          <input
            value={name} onChange={e => setName(e.target.value)} required placeholder="Habit Name..."
            className="w-full bg-transparent text-[20px] font-bold text-[var(--text-primary)] placeholder:text-[var(--text-muted)] outline-none border-b border-transparent focus:border-[var(--accent-color)] transition-colors pb-0.5"
          />
          <input
            value={description} onChange={e => setDescription(e.target.value)} placeholder="Description (optional)"
            className="w-full bg-transparent text-[14px] text-[var(--text-secondary)] placeholder:text-[var(--text-muted)] outline-none border-b border-transparent focus:border-[var(--accent-color)] transition-colors pb-0.5"
          />
        </div>
      </div>

      <div className="w-full h-[1px] bg-[var(--border-subtle)]" />

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="text-[11px] font-bold text-[var(--text-muted)] tracking-wider uppercase mb-1.5 flex items-center gap-1.5"><Icon icon="lucide:activity" /> Type</label>
          <div className="flex glass-input rounded-[12px] p-1 shadow-inner">
            <TabButton active={type==='task'} onClick={() => setType('task')} icon="lucide:check-square">Task</TabButton>
            <TabButton active={type==='amount'} onClick={() => setType('amount')} icon="lucide:hash">Amount</TabButton>
            <TabButton active={type==='timer'} onClick={() => setType('timer')} icon="lucide:timer">Timer</TabButton>
          </div>
        </div>
        <div>
          <label className="text-[11px] font-bold text-[var(--text-muted)] tracking-wider uppercase mb-1.5 flex items-center gap-1.5"><Icon icon="lucide:target" /> Mode</label>
          <div className="flex glass-input rounded-[12px] p-1 shadow-inner">
            <TabButton active={mode==='build'} onClick={() => setMode('build')} icon="lucide:trending-up">Build</TabButton>
            <TabButton active={mode==='quit'} onClick={() => setMode('quit')} icon="lucide:trending-down">Quit</TabButton>
          </div>
        </div>
      </div>

      <AnimatePresence mode="popLayout">
        {(type === 'amount' || type === 'timer') && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="overflow-hidden">
            <div className="flex gap-4 pt-2">
              <div className="flex-1">
                <label className="text-[11px] font-bold text-[var(--text-muted)] tracking-wider uppercase mb-1.5 block">
                  {type === 'timer' ? 'Interval (min)' : 'Target'}
                </label>
                {type === 'timer' ? (
                  <select value={targetValue} onChange={e => setTargetValue(e.target.value)} className="w-full glass-input rounded-[12px] px-3 py-2.5 text-[14px] font-bold outline-none border border-[var(--border-subtle)] cursor-pointer">
                    <option value="" disabled hidden>Select...</option>
                    {[5,10,15,30,45,60,90,120].map(m => <option key={m} value={m}>{m} mins</option>)}
                  </select>
                ) : (
                  <input type="number" value={targetValue} onChange={e => setTargetValue(e.target.value)} placeholder="10" className="w-full glass-input rounded-[12px] px-3 py-2.5 text-[14px] font-bold outline-none border border-[var(--border-subtle)]" />
                )}
              </div>
              {type === 'amount' && (
                <div className="w-[120px]">
                  <label className="text-[11px] font-bold text-[var(--text-muted)] tracking-wider uppercase mb-1.5 block">Unit</label>
                  <input type="text" value={unit} onChange={e => setUnit(e.target.value)} placeholder="pages..." className="w-full glass-input rounded-[12px] px-3 py-2.5 text-[14px] font-bold outline-none border border-[var(--border-subtle)]" />
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="w-full h-[1px] bg-[var(--border-subtle)]" />

      {/* --- SCHEDULING ROW --- */}
      <div className="grid grid-cols-2 gap-4">
        <div className="col-span-2">
          <label className="text-[11px] font-bold text-[var(--text-muted)] tracking-wider uppercase mb-1.5 flex items-center gap-1.5"><Icon icon="lucide:calendar-days" /> Repeat On</label>
          <div className="flex gap-1.5">
            {DAYS.map(d => (
              <button
                key={d.key} type="button" onClick={() => setFrequency(prev => prev.includes(d.key) ? prev.filter(x => x !== d.key) : [...prev, d.key])}
                className={`flex-1 h-10 rounded-[10px] text-[12px] font-bold transition-all border ${
                  frequency.includes(d.key) ? 'bg-[var(--accent-color)] text-white border-transparent shadow-md shadow-[var(--accent-color)]/20' : 'glass-input border-[var(--border-subtle)] text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
                }`}
              >{d.label}</button>
            ))}
          </div>
        </div>

        <div>
          <label className="text-[11px] font-bold text-[var(--text-muted)] tracking-wider uppercase mb-1.5 flex items-center gap-1.5"><Icon icon="lucide:play-circle" /> Start Date</label>
          <Popover>
            <PopoverTrigger 
              className={cn(
                "w-full glass-input rounded-[12px] px-3 py-2.5 text-[13px] font-bold outline-none border border-[var(--border-subtle)] flex items-center gap-2 transition-all",
                !startDate && "text-[var(--text-muted)]"
              )}
            >
              <Icon icon="lucide:calendar" className="text-[var(--text-secondary)] shrink-0" />
              {startDate ? format(new Date(startDate), "PPP") : <span>Pick a date</span>}
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0 border-[var(--border-subtle)] bg-[var(--bg-card)] backdrop-blur-xl" align="start">
              <Calendar
                mode="single"
                selected={startDate ? new Date(startDate) : undefined}
                onSelect={(val) => setStartDate(val ? format(val, 'yyyy-MM-dd') : '')}
                initialFocus
              />
            </PopoverContent>
          </Popover>
        </div>

        <div>
          <label className="text-[11px] font-bold text-[var(--text-muted)] tracking-wider uppercase mb-1.5 flex items-center gap-1.5"><Icon icon="lucide:stop-circle" /> End Date</label>
          <Popover>
            <PopoverTrigger 
              className={cn(
                "w-full glass-input rounded-[12px] px-3 py-2.5 text-[13px] font-bold outline-none border border-[var(--border-subtle)] flex items-center gap-2 transition-all",
                !endDate && "text-[var(--text-muted)]"
              )}
            >
              <Icon icon="lucide:calendar-off" className="text-[var(--text-secondary)] shrink-0" />
              {endDate ? format(new Date(endDate), "PPP") : <span className="opacity-60">Never</span>}
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0 border-[var(--border-subtle)] bg-[var(--bg-card)] backdrop-blur-xl" align="start">
              <div className="p-2 border-b border-[var(--border-subtle)] flex justify-end">
                <button 
                  type="button" 
                  onClick={(e) => { e.stopPropagation(); setEndDate(''); }}
                  className="text-[10px] font-black uppercase text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors"
                >
                  Clear (Never)
                </button>
              </div>
              <Calendar
                mode="single"
                selected={endDate ? new Date(endDate) : undefined}
                onSelect={(val) => setEndDate(val ? format(val, 'yyyy-MM-dd') : '')}
                initialFocus
              />
            </PopoverContent>
          </Popover>
        </div>
      </div>

      <button
        disabled={isPending} type="submit"
        className="w-full py-3.5 rounded-xl font-bold text-[13px] uppercase tracking-wider bg-[var(--accent-color)] text-white shadow-lg shadow-[var(--accent-color)]/20 hover:opacity-90 transition-opacity disabled:opacity-50 mt-4 flex items-center justify-center gap-2"
      >
        {isPending ? <Icon icon="lucide:loader-2" className="animate-spin text-xl" /> : <>{submitLabel}</>}
      </button>
    </form>
  );
}

export default function AddHabitModal() {
  const [isOpen, setIsOpen] = useState(false);
  return (
    <>
      <button onClick={() => setIsOpen(true)} className="flex items-center gap-2 px-5 py-2.5 rounded-full font-bold text-white text-[14px] bg-[var(--accent-color)] transition-opacity hover:opacity-90 shadow-md shadow-[var(--accent-color)]/20 border border-white/5">
        <Icon icon="lucide:plus" fontSize={18} strokeWidth={2.5} /> New Habit
      </button>

      <AnimatePresence>
        {isOpen && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setIsOpen(false)} className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40" />
            <div className="fixed inset-0 flex items-center justify-center z-50 p-4 pointer-events-none">
              <motion.div initial={{ opacity: 0, scale: 0.9, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.9, y: 20 }} className="bg-[var(--bg-card)] border border-[var(--border-subtle)] rounded-[32px] p-6 sm:p-8 w-full max-w-md shadow-2xl pointer-events-auto max-h-[95vh] overflow-y-auto custom-scrollbar relative">
                <button onClick={() => setIsOpen(false)} className="absolute top-6 right-6 text-[var(--text-muted)] hover:text-[var(--text-primary)] p-2 rounded-full hover:bg-[var(--bg-hover)] transition-colors z-10"><Icon icon="lucide:x" fontSize={20} /></button>
                <div className="w-16 h-16 bg-[var(--accent-color)]/10 rounded-2xl flex items-center justify-center text-[var(--accent-color)] mx-auto mb-6 mt-2">
                  <Icon icon="lucide:sparkles" fontSize={32} />
                </div>
                <h3 className="text-[22px] font-black text-[var(--text-primary)] mb-6 text-center tracking-tight">Configure Habit</h3>
                <HabitForm onSubmit={async (data: any) => { await createHabit(data); setIsOpen(false); }} onClose={() => setIsOpen(false)} />
              </motion.div>
            </div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}

export function EditHabitModal({ habit, onClose }: { habit: any; onClose: () => void }) {
  const handleUpdate = async (data: any) => {
    await updateHabit(habit.id, data);
  };

  return (
    <AnimatePresence>
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose} className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40" />
      <div className="fixed inset-0 flex items-center justify-center z-50 p-4 pointer-events-none">
        <motion.div initial={{ opacity: 0, scale: 0.9, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.9, y: 20 }} className="bg-[var(--bg-card)] border border-[var(--border-subtle)] rounded-[32px] p-6 sm:p-8 w-full max-w-md shadow-2xl pointer-events-auto max-h-[95vh] overflow-y-auto custom-scrollbar relative">
          <div className="absolute top-6 right-6 flex gap-2 z-10">
            <button onClick={async () => { await deleteHabit(habit.id); onClose(); }} className="text-red-400 hover:text-red-300 p-2 rounded-full hover:bg-red-500/10 transition-colors"><Icon icon="lucide:trash-2" fontSize={18} /></button>
            <button onClick={onClose} className="text-[var(--text-muted)] hover:text-[var(--text-primary)] p-2 rounded-full hover:bg-[var(--bg-hover)] transition-colors"><Icon icon="lucide:x" fontSize={20} /></button>
          </div>
          <div className="w-16 h-16 bg-[var(--accent-color)]/10 rounded-2xl flex items-center justify-center text-[var(--accent-color)] mx-auto mb-6 mt-2">
            <Icon icon="lucide:settings" fontSize={32} />
          </div>
          <h3 className="text-[22px] font-black text-[var(--text-primary)] mb-6 text-center tracking-tight">Edit Habit</h3>
          <HabitForm initialData={habit} onSubmit={handleUpdate} onClose={onClose} submitLabel="Save Changes" />
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
