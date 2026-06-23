'use client';

import { motion } from 'framer-motion';
import { X, Trophy, Target, TrendingUp, Calendar, Zap, Shield, Flame, Activity } from 'lucide-react';
import { format, parseISO, differenceInDays, subDays } from 'date-fns';
import Twemoji from './Twemoji';
import { calculateStreak } from '@/utils/analytics';

type HabitHistoryLog = {
  log_date: string;
  is_completed: boolean;
};

export default function HabitAnalyticsModal({
  habit,
  logs,
  onClose
}: {
  habit: any;
  logs: HabitHistoryLog[];
  onClose: () => void;
}) {
  const isQuit = habit.mode === 'quit';
  
  // Calculate Streaks
  const calculateBestStreak = () => {
    if (logs.length === 0) {
      if (isQuit) {
        const start = parseISO(habit.start_date);
        return Math.max(0, differenceInDays(new Date(), start));
      }
      return 0;
    }

    if (!isQuit) {
      const dates = logs.filter(l => l.is_completed).map(l => l.log_date).sort();
      if (dates.length === 0) return 0;
      let max = 0;
      let current = 0;
      for (let i = 0; i < dates.length; i++) {
        if (i > 0) {
          const diff = differenceInDays(parseISO(dates[i]), parseISO(dates[i - 1]));
          if (diff === 1) current++;
          else {
            max = Math.max(max, current);
            current = 1;
          }
        } else current = 1;
      }
      return Math.max(max, current);
    } else {
      const relapseDates = logs.filter(l => l.is_completed).map(l => l.log_date).sort();
      const start = parseISO(habit.start_date);
      const today = new Date();

      if (relapseDates.length === 0) {
        return Math.max(0, differenceInDays(today, start));
      }

      let max = 0;
      let lastRelapse = start;

      for (const rDate of relapseDates) {
        const relapse = parseISO(rDate);
        max = Math.max(max, differenceInDays(relapse, lastRelapse));
        lastRelapse = relapse;
      }
      max = Math.max(max, differenceInDays(today, lastRelapse));
      return max;
    }
  };

  const bestStreak = calculateBestStreak();
  const currentStreak = calculateStreak(
    logs.filter(l => l.is_completed).map(l => l.log_date), 
    habit.mode, 
    habit.start_date
  );
  
  const daysSinceStart = Math.max(1, differenceInDays(new Date(), parseISO(habit.start_date)) + 1);
  const successfulDays = isQuit 
    ? daysSinceStart - logs.filter(l => l.is_completed).length
    : logs.filter(l => l.is_completed).length;
    
  const accuracy = Math.round((successfulDays / daysSinceStart) * 100);

  // Animation variants
  const containerVars = {
    hidden: { opacity: 0, scale: 0.95, y: 30 },
    visible: { 
      opacity: 1, 
      scale: 1, 
      y: 0,
      transition: { 
        duration: 0.4, 
        ease: [0.16, 1, 0.3, 1] as any,
        staggerChildren: 0.05
      }
    }
  };

  const itemVars = {
    hidden: { opacity: 0, y: 15 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.3 } }
  };

  return (
    <>
      <motion.div
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        onClick={onClose}
        className="fixed inset-0 bg-black/90 backdrop-blur-xl z-[1100]"
      />
      <div className="fixed inset-0 flex items-center justify-center z-[1101] p-4 pointer-events-none">
        <motion.div
          variants={containerVars}
          initial="hidden"
          animate="visible"
          exit="hidden"
          className="bg-[#09090b] border border-[#18181b] rounded-[48px] w-full max-w-4xl overflow-hidden pointer-events-auto shadow-[0_0_100px_rgba(0,0,0,0.8)] relative"
        >
          {/* Decorative Glow */}
          <div 
            className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[300px] opacity-10 blur-[120px] pointer-events-none"
            style={{ background: `radial-gradient(circle, ${habit.color} 0%, transparent 70%)` }}
          />

          {/* Header */}
          <div className="relative p-8 md:p-12 flex flex-col md:flex-row md:items-center justify-between gap-8">
            <div className="flex items-center gap-6">
              <motion.div 
                whileHover={{ scale: 1.05, rotate: 5 }}
                className="w-24 h-24 rounded-[32px] flex items-center justify-center text-4xl shadow-2xl relative group"
                style={{ 
                  background: `linear-gradient(135deg, ${habit.color}20 0%, ${habit.color}10 100%)`, 
                  border: `1px solid ${habit.color}40` 
                }}
              >
                <div 
                   className="absolute inset-0 rounded-[32px] opacity-0 group-hover:opacity-100 transition-opacity blur-xl"
                   style={{ backgroundColor: habit.color }}
                />
                <div className="relative z-10">
                  {habit.emoji ? <Twemoji emoji={habit.emoji} className="w-14 h-14" /> : habit.name.charAt(0)}
                </div>
              </motion.div>
              <div>
                <motion.h2 variants={itemVars} className="text-4xl md:text-5xl font-[1000] text-white tracking-tighter">
                  {habit.name}
                </motion.h2>
                <motion.div variants={itemVars} className="flex items-center gap-3 mt-2">
                   <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white/5 border border-white/10">
                      <Zap size={12} className="text-amber-400 fill-amber-400" />
                      <span className="text-[10px] font-black text-white uppercase tracking-widest">Mastery Level: {accuracy > 90 ? 'Legend' : accuracy > 70 ? 'Expert' : 'Apprentice'}</span>
                   </div>
                   <p className="text-zinc-500 font-bold uppercase tracking-widest text-[10px]">Deep Intelligence Report</p>
                </motion.div>
              </div>
            </div>
            <button 
              onClick={onClose} 
              className="absolute top-8 right-8 p-3 rounded-full hover:bg-white/5 text-zinc-500 hover:text-white transition-all active:scale-90"
            >
              <X size={28} />
            </button>
          </div>

          {/* Bento Stats Grid */}
          <div className="p-8 md:p-12 pt-0 grid grid-cols-1 md:grid-cols-4 md:grid-rows-2 gap-4">
            
            {/* Main Streak Card - High Priority */}
            <motion.div 
              variants={itemVars}
              className="md:col-span-2 md:row-span-2 bg-[#121214] border border-[#1c1c1f] rounded-[40px] p-8 flex flex-col justify-between group overflow-hidden relative"
            >
              <div className="relative z-10">
                <p className="text-[11px] font-black text-zinc-500 uppercase tracking-[0.2em] mb-4">Current Momentum</p>
                <h3 className="text-8xl font-[1000] text-white tracking-tighter leading-none flex items-end gap-2">
                  {currentStreak}
                  <span className="text-2xl text-zinc-700 pb-2">days</span>
                </h3>
              </div>
              
              <div className="relative z-10 mt-8 space-y-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-orange-500/10 flex items-center justify-center text-orange-500">
                    <Flame size={20} className="fill-orange-500" />
                  </div>
                  <div>
                    <p className="text-[10px] font-black text-zinc-600 uppercase">Longest Chain</p>
                    <p className="text-lg font-black text-white">{bestStreak} Days</p>
                  </div>
                </div>
                {currentStreak < bestStreak && (
                  <div className="bg-white/5 p-4 rounded-3xl border border-white/5">
                    <p className="text-[11px] text-zinc-400 font-medium leading-relaxed">
                      You're <span className="text-white font-black">{bestStreak - currentStreak + 1} days</span> away from smashing your record. Keep the flame alive!
                    </p>
                  </div>
                )}
              </div>

              {/* Background Decoration */}
              <Activity 
                size={200} 
                className="absolute -bottom-10 -right-10 text-white/[0.02] -rotate-12 group-hover:rotate-0 transition-transform duration-1000" 
              />
            </motion.div>

            {/* Accuracy Card - Circular Metric */}
            <motion.div 
              variants={itemVars}
              className="md:col-span-2 bg-[#121214] border border-[#1c1c1f] rounded-[40px] p-8 flex items-center justify-between"
            >
              <div>
                <p className="text-[11px] font-black text-zinc-500 uppercase tracking-[0.2em] mb-1">Consistency Score</p>
                <p className="text-4xl font-black text-white">{accuracy}%</p>
                <div className="flex items-center gap-2 mt-3">
                  <Shield size={14} className="text-emerald-500" />
                  <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">{successfulDays} Safe Days</span>
                </div>
              </div>
              <div className="relative w-24 h-24">
                 <svg className="w-full h-full -rotate-90">
                    <circle 
                      cx="48" cy="48" r="40" 
                      className="fill-none stroke-[#1c1c1f]" strokeWidth="8" 
                    />
                    <motion.circle 
                      initial={{ strokeDasharray: "0 251" }}
                      animate={{ strokeDasharray: `${(accuracy / 100) * 251} 251` }}
                      transition={{ duration: 1.5, delay: 0.5, ease: "easeOut" }}
                      cx="48" cy="48" r="40" 
                      className="fill-none stroke-current text-white" 
                      strokeWidth="8" strokeLinecap="round" 
                    />
                 </svg>
                 <div className="absolute inset-0 flex items-center justify-center">
                    <Target size={20} className="text-zinc-600" />
                 </div>
              </div>
            </motion.div>

            {/* History Card - Bar Chart */}
            <motion.div 
              variants={itemVars}
              className="md:col-span-2 bg-[#121214] border border-[#1c1c1f] rounded-[40px] p-8 flex flex-col"
            >
              <div className="flex items-center justify-between mb-6">
                <p className="text-[11px] font-black text-zinc-500 uppercase tracking-[0.2em]">Activity Flow (14D)</p>
                <TrendingUp size={16} className="text-indigo-500" />
              </div>
              <div className="flex-1 flex items-end gap-1.5">
                 {Array.from({ length: 14 }).map((_, i) => {
                    const date = format(subDays(new Date(), 13 - i), 'yyyy-MM-dd');
                    const dayLog = logs.find(l => l.log_date === date);
                    const isSuccess = dayLog ? (!isQuit ? dayLog.is_completed : !dayLog.is_completed) : (isQuit ? true : false);
                    
                    return (
                      <div key={i} className="flex-1 h-full flex flex-col justify-end group/bar relative">
                         <motion.div 
                           initial={{ height: 0 }}
                           animate={{ height: isSuccess ? '100%' : '15%' }}
                           transition={{ duration: 0.5, delay: 0.6 + (i * 0.03) }}
                           className="w-full rounded-full transition-all duration-300 group-hover/bar:brightness-125"
                           style={{ 
                             backgroundColor: isSuccess ? (habit.color || '#3b82f6') : '#1c1c1f',
                             opacity: isSuccess ? 1 : 0.4
                           }}
                         />
                         <div className="absolute -top-12 left-1/2 -translate-x-1/2 bg-white text-[#09090b] text-[9px] font-[1000] py-1 px-2 rounded-lg opacity-0 group-hover/bar:opacity-100 transition-all pointer-events-none z-50 whitespace-nowrap shadow-2xl scale-50 group-hover/bar:scale-100 origin-bottom">
                           {format(subDays(new Date(), 13-i), 'MMM d')}
                         </div>
                      </div>
                    );
                 })}
              </div>
            </motion.div>
          </div>

          {/* Bottom Action Bar */}
          <div className="bg-[#121214]/50 border-t border-[#1c1c1f] p-8 flex items-center justify-between px-12">
             <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full animate-pulse" style={{ backgroundColor: habit.color }} />
                <span className="text-[10px] font-black text-zinc-500 uppercase tracking-[0.2em]">Deep Learning Synchronized</span>
             </div>
             <p className="text-[11px] text-zinc-400 font-medium">
                Last activity detected <span className="text-white font-black">{logs.length > 0 ? format(parseISO(logs[logs.length-1].log_date), 'MMM do') : 'N/A'}</span>
             </p>
          </div>

        </motion.div>
      </div>
    </>
  );
}
