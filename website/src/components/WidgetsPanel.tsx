'use client';

import { useState, useEffect, useRef, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Icon } from '@iconify/react';
import { format, parseISO, differenceInDays } from 'date-fns';
import Twemoji from './Twemoji';

// Audio tone generator using Web Audio API
const playCompletionSound = () => {
  try {
    const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
    const osc1 = ctx.createOscillator();
    const osc2 = ctx.createOscillator();
    const gainNode = ctx.createGain();

    osc1.type = 'sine';
    osc1.frequency.setValueAtTime(523.25, ctx.currentTime); // C5
    osc1.frequency.setValueAtTime(659.25, ctx.currentTime + 0.1); // E5
    osc1.frequency.setValueAtTime(783.99, ctx.currentTime + 0.2); // G5
    osc1.frequency.setValueAtTime(1046.50, ctx.currentTime + 0.3); // C6

    osc2.type = 'triangle';
    osc2.frequency.setValueAtTime(261.63, ctx.currentTime); // C4
    osc2.frequency.setValueAtTime(329.63, ctx.currentTime + 0.1); // E4
    osc2.frequency.setValueAtTime(392.00, ctx.currentTime + 0.2); // G4
    osc2.frequency.setValueAtTime(523.25, ctx.currentTime + 0.3); // C5

    gainNode.gain.setValueAtTime(0.08, ctx.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.8);

    osc1.connect(gainNode);
    osc2.connect(gainNode);
    gainNode.connect(ctx.destination);

    osc1.start();
    osc2.start();
    osc1.stop(ctx.currentTime + 0.8);
    osc2.stop(ctx.currentTime + 0.8);
  } catch (e) {
    console.error('AudioContext is blocked or unsupported:', e);
  }
};

// --- Particles Explosion for 100% ---
function ParticleExplosion() {
  const particles = useMemo(() => Array.from({ length: 30 }), []);
  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden z-[99]">
      {particles.map((_, i) => {
        const angle = (i / particles.length) * 360 + Math.random() * 20;
        const distance = 90 + Math.random() * 70;
        const x = Math.cos((angle * Math.PI) / 180) * distance;
        const y = Math.sin((angle * Math.PI) / 180) * distance;
        const size = 5 + Math.random() * 7;
        const duration = 0.8 + Math.random() * 0.6;
        const delay = Math.random() * 0.15;
        const color = ['#6366f1', '#06b6d4', '#10b981', '#f59e0b', '#ec4899', '#a855f7'][i % 6];
        return (
          <motion.div
            key={i}
            className="absolute left-1/2 top-1/2 rounded-full"
            style={{ width: size, height: size, backgroundColor: color, x: 0, y: 0 }}
            initial={{ opacity: 1, scale: 1, x: 0, y: 0 }}
            animate={{ opacity: 0, scale: 0.1, x, y }}
            transition={{ duration, delay, ease: 'easeOut' }}
          />
        );
      })}
    </div>
  );
}

const INSPIRATIONAL_TIPS = [
  {
    title: "Huberman Protocol",
    text: "View 10-15 minutes of direct morning sunlight shortly after waking. This sets your biological clock, optimizing dopamine and melatonin rhythms."
  },
  {
    title: "The 2-Minute Rule",
    text: "James Clear notes that any new habit should take under 2 minutes to start. This lowers activation energy and makes consistency effortless."
  },
  {
    title: "Habit Stacking",
    text: "Anchor a new habit to an existing routine (e.g., 'After I pour my morning coffee, I will write down three daily targets')."
  },
  {
    title: "Identity Shift",
    text: "Focus on who you want to *become*, not what you want to achieve. A reader doesn't just read a book; they embody being a reader."
  },
  {
    title: "Dopamine Detox",
    text: "Avoid high-stimulus inputs (like social media or emails) during the first hour of the day. Keeping baseline dopamine low boosts focus later."
  },
  {
    title: "Friction Engineering",
    text: "Increase steps to engage in bad habits (hide snacks) and reduce steps for good habits (lay out workout clothes the night before)."
  }
];

type Habit = {
  id: string;
  name: string;
  emoji?: string;
  color: string;
  type: 'task' | 'amount' | 'timer';
  mode: 'build' | 'quit';
  frequency: string | string[];
  target_value?: number;
  unit?: string;
  start_date: string;
};

type HabitLog = {
  habit_id: string;
  is_completed: boolean;
  value?: number;
  log_date?: string;
};

type WidgetsPanelProps = {
  habits: Habit[];
  logs: HabitLog[];
  today: string;
  realToday: string;
  allLogs: HabitLog[];
  onToggle: (habitId: string, isCompleted: boolean) => Promise<void>;
  onAdjust: (habitId: string, delta: number, target: number) => Promise<void>;
};

export default function WidgetsPanel({
  habits,
  logs,
  today,
  realToday,
  allLogs,
  onToggle,
  onAdjust,
}: WidgetsPanelProps) {
  // --- 1. Dopamine Ring Calculation ---
  const activeHabitsForSelectedDate = useMemo(() => {
    const dayOfWeek = format(parseISO(today), 'eee').toLowerCase(); // 'mon', 'tue', etc.
    return habits.filter((h) => {
      // Filter out habits that started after the selected day
      if (h.start_date > today) return false;
      const freq = typeof h.frequency === 'string' ? JSON.parse(h.frequency) : h.frequency;
      return freq.includes('daily') || freq.includes(dayOfWeek);
    });
  }, [habits, today]);

  const stats = useMemo(() => {
    const total = activeHabitsForSelectedDate.length;
    if (total === 0) return { completed: 0, total: 0, pct: 0 };
    
    // Find logs for active habits on the selected day
    const activeIds = new Set(activeHabitsForSelectedDate.map(h => h.id));
    const completed = logs.filter(l => activeIds.has(l.habit_id) && l.is_completed).length;
    return {
      completed,
      total,
      pct: Math.round((completed / total) * 100)
    };
  }, [activeHabitsForSelectedDate, logs]);

  const [triggerExplosion, setTriggerExplosion] = useState(false);
  const prevPctRef = useRef(stats.pct);

  useEffect(() => {
    if (stats.pct === 100 && prevPctRef.current < 100 && today === realToday) {
      setTriggerExplosion(true);
      playCompletionSound();
      const t = setTimeout(() => setTriggerExplosion(false), 2000);
      return () => clearTimeout(t);
    }
    prevPctRef.current = stats.pct;
  }, [stats.pct, today, realToday]);

  // --- Zen Daily Intention ---
  const [intention, setIntention] = useState<string>('Establish deep focus today. Reject shallow distractions.');
  const [isEditingIntention, setIsEditingIntention] = useState(false);
  const [tempIntention, setTempIntention] = useState(intention);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('disciplinear_daily_intention');
      if (stored) {
        setIntention(stored);
        setTempIntention(stored);
      }
    }
  }, []);

  const saveIntention = () => {
    const trimmed = tempIntention.trim();
    if (trimmed) {
      setIntention(trimmed);
      localStorage.setItem('disciplinear_daily_intention', trimmed);
    }
    setIsEditingIntention(false);
  };

  const dopamineSlogan = useMemo(() => {
    const pct = stats.pct;
    if (stats.total === 0) return "No habits scheduled today.";
    if (pct === 0) return "Baseline baseline. Ready to fire?";
    if (pct < 35) return "Spark ignited! Keep pushing.";
    if (pct < 70) return "Dopamine surge! Momentum building.";
    if (pct < 100) return "Almost complete. Crush the baseline!";
    return "⚡ ABSOLUTE DISCIPLINE ACHIEVED ⚡";
  }, [stats.pct, stats.total]);

  // --- 2. Focus Timer Widget State ---
  const timerHabits = useMemo(() => habits.filter(h => h.type === 'timer'), [habits]);
  const [selectedTimerHabitId, setSelectedTimerHabitId] = useState<string>('');
  const [timerSecondsLeft, setTimerSecondsLeft] = useState<number>(1500); // 25 mins default
  const [timerIsRunning, setTimerIsRunning] = useState<boolean>(false);
  const [timerSessionDuration, setTimerSessionDuration] = useState<number>(1500); // Target seconds
  const [showLogPrompt, setShowLogPrompt] = useState<boolean>(false);
  const [elapsedMinutesLogged, setElapsedMinutesLogged] = useState<number>(0);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Sync selected habit duration
  const activeTimerHabit = useMemo(() => 
    timerHabits.find(h => h.id === selectedTimerHabitId) || timerHabits[0]
  , [timerHabits, selectedTimerHabitId]);

  useEffect(() => {
    if (activeTimerHabit) {
      const mins = activeTimerHabit.target_value || 25;
      setTimerSecondsLeft(mins * 60);
      setTimerSessionDuration(mins * 60);
    }
  }, [activeTimerHabit]);

  useEffect(() => {
    if (timerIsRunning) {
      timerRef.current = setInterval(() => {
        setTimerSecondsLeft((prev) => {
          if (prev <= 1) {
            setTimerIsRunning(false);
            if (timerRef.current) clearInterval(timerRef.current);
            playCompletionSound();
            const elapsedMins = Math.ceil(timerSessionDuration / 60);
            setElapsedMinutesLogged(elapsedMins);
            setShowLogPrompt(true);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [timerIsRunning, timerSessionDuration]);

  const handleTimerAction = () => {
    setTimerIsRunning(!timerIsRunning);
  };

  const handleTimerReset = () => {
    setTimerIsRunning(false);
    const mins = activeTimerHabit?.target_value || 25;
    setTimerSecondsLeft(mins * 60);
    setShowLogPrompt(false);
  };

  const handleLogTimerSession = async () => {
    if (!activeTimerHabit) return;
    const target = activeTimerHabit.target_value || 25;
    await onAdjust(activeTimerHabit.id, elapsedMinutesLogged, target);
    setShowLogPrompt(false);
    handleTimerReset();
  };

  // --- 3. Streak & At-Risk Calculations ---
  const highestStreakHabit = useMemo(() => {
    if (habits.length === 0) return null;
    
    let bestHabit = null;
    let maxStreak = -1;

    for (const habit of habits) {
      const isQuit = habit.mode === 'quit';
      const habitLogs = allLogs.filter(l => l.habit_id === habit.id);
      
      let streak = 0;
      if (!isQuit) {
        // Build Streak calculation
        const dates = habitLogs.filter(l => l.is_completed).map(l => l.log_date || '').filter(Boolean).sort();
        if (dates.length > 0) {
          let current = 0;
          const todayStr = format(new Date(), 'yyyy-MM-dd');
          const yesterdayStr = format(differenceInDays(new Date(), 1) === 0 ? new Date() : new Date(Date.now() - 86400000), 'yyyy-MM-dd');
          
          // Check if streak is active (completed today or yesterday)
          const lastLoggedDate = dates[dates.length - 1];
          if (lastLoggedDate === todayStr || lastLoggedDate === yesterdayStr) {
            current = 1;
            for (let i = dates.length - 1; i > 0; i--) {
              const diff = differenceInDays(parseISO(dates[i]), parseISO(dates[i - 1]));
              if (diff === 1) {
                current++;
              } else if (diff > 1) {
                break;
              }
            }
          }
          streak = current;
        }
      } else {
        // Quit Clean streak
        const relapses = habitLogs.filter(l => l.is_completed).map(l => l.log_date || '').filter(Boolean).sort();
        const start = parseISO(habit.start_date);
        const todayD = new Date();
        if (relapses.length === 0) {
          streak = Math.max(0, differenceInDays(todayD, start));
        } else {
          const lastRelapse = parseISO(relapses[relapses.length - 1]);
          streak = Math.max(0, differenceInDays(todayD, lastRelapse));
        }
      }

      if (streak > maxStreak) {
        maxStreak = streak;
        bestHabit = { habit, streak };
      }
    }
    return bestHabit && bestHabit.streak > 0 ? bestHabit : null;
  }, [habits, allLogs]);

  const atRiskHabits = useMemo(() => {
    // Habits scheduled for selected date that are not yet completed
    const completedIds = new Set(logs.filter(l => l.is_completed).map(l => l.habit_id));
    return activeHabitsForSelectedDate.filter(h => !completedIds.has(h.id));
  }, [activeHabitsForSelectedDate, logs]);

  // --- 4. Insights State ---
  const [insightIndex, setInsightIndex] = useState(0);
  const currentTip = INSPIRATIONAL_TIPS[insightIndex];

  // Helper formatting for timer digits
  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60).toString().padStart(2, '0');
    const s = (secs % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

  return (
    <div className="space-y-6 w-full">
      {/* =======================================================================
          MINIMALIST WIDGET: Daily Intention
          ======================================================================= */}
      <div className="glass-panel p-6 rounded-[28px] relative overflow-hidden group border border-[var(--border-subtle)]/30 hover:border-indigo-500/20 transition-all duration-300">
        <div className="absolute inset-0 bg-radial-gradient from-white/[0.01] via-transparent to-transparent pointer-events-none" />
        <div className="flex items-center justify-between mb-4">
          <span className="text-zinc-500 text-[10px] font-black uppercase tracking-[0.25em]">Daily Intention</span>
          <button
            onClick={() => {
              if (isEditingIntention) {
                saveIntention();
              } else {
                setTempIntention(intention);
                setIsEditingIntention(true);
              }
            }}
            className="text-zinc-500 hover:text-[var(--text-primary)] transition-colors p-1 rounded-full hover:bg-[var(--bg-hover)]"
            title={isEditingIntention ? "Save Intention" : "Edit Intention"}
          >
            <Icon icon={isEditingIntention ? "lucide:check" : "lucide:edit-2"} fontSize={12} />
          </button>
        </div>

        <div className="min-h-[50px] flex items-center justify-center">
          {isEditingIntention ? (
            <input
              type="text"
              value={tempIntention}
              onChange={(e) => setTempIntention(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') saveIntention();
                if (e.key === 'Escape') setIsEditingIntention(false);
              }}
              maxLength={80}
              className="w-full bg-zinc-950/80 border border-[var(--border-subtle)] rounded-xl px-3 py-2 text-center text-sm font-semibold text-white focus:outline-none focus:ring-1 focus:ring-indigo-500/50"
              autoFocus
            />
          ) : (
            <p
              onClick={() => {
                setTempIntention(intention);
                setIsEditingIntention(true);
              }}
              className="text-[17px] font-normal leading-relaxed text-zinc-200 tracking-tight text-center italic font-sans px-2 opacity-95 cursor-pointer hover:text-white transition-colors"
            >
              “{intention}”
            </p>
          )}
        </div>
      </div>
      {/* =======================================================================
          WIDGET 1: Dopamine Level Meter (Daily Progress)
          ======================================================================= */}
      <div className="relative overflow-hidden glass-panel p-6 rounded-[28px] flex flex-col items-center text-center group">
        <div className="absolute inset-0 bg-gradient-to-b from-indigo-500/5 via-transparent to-transparent pointer-events-none" />
        {triggerExplosion && <ParticleExplosion />}
        
        <h3 className="text-zinc-500 text-[10px] font-black uppercase tracking-[0.2em] mb-4 self-start">Dopamine Velocity</h3>
        
        <div className="relative w-36 h-36 flex items-center justify-center mb-4 select-none">
          {/* Animated Glow Backdrops */}
          <div className="absolute inset-2 bg-indigo-500/10 rounded-full blur-xl group-hover:scale-110 transition-transform duration-500" />
          
          <svg className="w-full h-full transform -rotate-90" viewBox="0 0 120 120">
            <defs>
              <linearGradient id="ringGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#818cf8" />
                <stop offset="100%" stopColor="#22d3ee" />
              </linearGradient>
            </defs>
            {/* Track Circle */}
            <circle cx="60" cy="60" r="48" stroke="var(--border-subtle)" strokeWidth="8" fill="transparent" />
            {/* Progress Circle */}
            <motion.circle
              cx="60" cy="60" r="48"
              stroke="url(#ringGradient)"
              strokeWidth="8"
              fill="transparent"
              strokeLinecap="round"
              strokeDasharray={2 * Math.PI * 48}
              initial={{ strokeDashoffset: 2 * Math.PI * 48 }}
              animate={{ strokeDashoffset: 2 * Math.PI * 48 * (1 - stats.pct / 100) }}
              transition={{ duration: 1.2, ease: "easeOut" }}
            />
          </svg>
          
          <div className="absolute flex flex-col items-center justify-center">
            <span className="text-3xl font-black text-[var(--text-primary)] tracking-tight tabular-nums">{stats.pct}%</span>
            <span className="text-[9px] font-black text-zinc-500 uppercase tracking-widest">{stats.completed}/{stats.total} DONE</span>
          </div>
        </div>

        <p className="text-xs font-bold text-[var(--text-secondary)] leading-relaxed">{dopamineSlogan}</p>
      </div>

      {/* =======================================================================
          WIDGET 2: Focus Timer (Pomodoro Widget)
          ======================================================================= */}
      <div className="glass-panel p-6 rounded-[28px] relative overflow-hidden group">
        <div className="absolute inset-0 bg-gradient-to-br from-purple-500/5 via-transparent to-transparent pointer-events-none" />
        
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-zinc-500 text-[10px] font-black uppercase tracking-[0.2em]">Focus Lab</h3>
          <Icon icon="lucide:timer" className="text-indigo-400 group-hover:scale-110 transition-transform" />
        </div>

        {timerHabits.length === 0 ? (
          <div className="py-4 text-center">
            <p className="text-xs font-semibold text-zinc-500 leading-relaxed">
              No timer-based habits found. Create a habit with "Timer" type to activate the Pomodoro Focus module.
            </p>
          </div>
        ) : (
          <div className="space-y-5">
            {/* Habit Picker */}
            <div className="relative">
              <select
                value={selectedTimerHabitId}
                onChange={(e) => {
                  setSelectedTimerHabitId(e.target.value);
                  setTimerIsRunning(false);
                }}
                className="w-full glass-input rounded-xl px-3 py-2 text-[12px] font-bold text-[var(--text-primary)] border border-[var(--border-subtle)] focus:outline-none focus:ring-1 focus:ring-indigo-500/50 appearance-none cursor-pointer"
              >
                {timerHabits.map((h) => (
                  <option key={h.id} value={h.id}>
                    ⏱️ {h.name} ({h.target_value}m)
                  </option>
                ))}
              </select>
              <div className="absolute right-3 top-2.5 pointer-events-none text-zinc-400">
                <Icon icon="lucide:chevron-down" fontSize={14} />
              </div>
            </div>

            {/* Countdown Box */}
            <div className="flex flex-col items-center py-2 relative">
              <div className="text-4xl font-mono font-black text-[var(--text-primary)] tracking-widest select-none tabular-nums">
                {formatTime(timerSecondsLeft)}
              </div>
              <p className="text-[9px] font-black text-zinc-500 uppercase tracking-widest mt-1">
                {timerIsRunning ? "Active Focus State" : "Paused"}
              </p>

              {/* Progress Line */}
              <div className="w-full h-1 bg-[var(--border-subtle)] rounded-full mt-4 overflow-hidden">
                <motion.div
                  className="h-full bg-indigo-500"
                  style={{ width: `${(timerSecondsLeft / timerSessionDuration) * 100}%` }}
                  transition={{ ease: "linear" }}
                />
              </div>
            </div>

            {/* Control Buttons */}
            <div className="flex gap-2">
              <button
                onClick={handleTimerAction}
                className={`flex-1 py-2.5 rounded-xl text-[11px] font-black uppercase tracking-wider transition-all flex items-center justify-center gap-1.5 active:scale-[0.97] ${
                  timerIsRunning
                    ? 'bg-zinc-800 hover:bg-zinc-700 text-white'
                    : 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg shadow-indigo-600/10'
                }`}
              >
                <Icon icon={timerIsRunning ? "lucide:pause" : "lucide:play"} />
                {timerIsRunning ? "Pause" : "Focus"}
              </button>
              
              <button
                onClick={handleTimerReset}
                className="px-3.5 py-2.5 bg-[var(--bg-input)] hover:bg-[var(--bg-hover)] border border-[var(--border-subtle)] text-[var(--text-primary)] rounded-xl transition-all active:scale-[0.97]"
                title="Reset Timer"
              >
                <Icon icon="lucide:rotate-ccw" />
              </button>
            </div>

            {/* Completion Prompt */}
            <AnimatePresence>
              {showLogPrompt && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="overflow-hidden"
                >
                  <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-center space-y-3 mt-2">
                    <p className="text-xs font-bold text-emerald-400">
                      Focus block complete! Log {elapsedMinutesLogged} mins?
                    </p>
                    <div className="flex gap-2">
                      <button
                        onClick={() => setShowLogPrompt(false)}
                        className="flex-1 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-wider bg-transparent text-zinc-400 hover:text-white hover:bg-zinc-800/30 transition-colors"
                      >
                        Discard
                      </button>
                      <button
                        onClick={handleLogTimerSession}
                        className="flex-1 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-wider bg-emerald-500 text-white hover:bg-emerald-600 transition-colors"
                      >
                        Log Session
                      </button>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        )}
      </div>

      {/* =======================================================================
          WIDGET 3: Streak & At-Risk Shield
          ======================================================================= */}
      <div className="glass-panel p-6 rounded-[28px] space-y-4">
        <h3 className="text-zinc-500 text-[10px] font-black uppercase tracking-[0.2em]">Streak Guard</h3>
        
        {highestStreakHabit && (
          <div className="flex items-center justify-between p-3.5 bg-indigo-500/5 border border-indigo-500/10 rounded-2xl">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0" style={{ backgroundColor: `${highestStreakHabit.habit.color}15` }}>
                {highestStreakHabit.habit.emoji ? (
                  <Twemoji emoji={highestStreakHabit.habit.emoji} className="w-5 h-5" />
                ) : (
                  <Icon icon="lucide:flame" style={{ color: highestStreakHabit.habit.color }} />
                )}
              </div>
              <div className="flex flex-col">
                <span className="text-[12px] font-black text-[var(--text-primary)] leading-tight">{highestStreakHabit.habit.name}</span>
                <span className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider mt-0.5">Peak Momentum</span>
              </div>
            </div>
            <div className="flex items-center gap-1 text-orange-400 font-black text-sm">
              <Icon icon="lucide:flame" className="animate-pulse" />
              <span>{highestStreakHabit.streak}d</span>
            </div>
          </div>
        )}

        <div className="space-y-2">
          <p className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">
            {atRiskHabits.length > 0 ? `At Risk (${atRiskHabits.length})` : "Streak Protected"}
          </p>

          {atRiskHabits.length === 0 ? (
            <div className="p-3 bg-emerald-500/5 border border-emerald-500/10 rounded-xl flex items-center gap-2">
              <Icon icon="lucide:shield-check" className="text-emerald-400" />
              <span className="text-[11px] font-bold text-emerald-400/80">All scheduled habits logged for today!</span>
            </div>
          ) : (
            <div className="space-y-1.5">
              {atRiskHabits.slice(0, 3).map((habit) => (
                <div key={habit.id} className="flex items-center justify-between p-2.5 bg-[var(--bg-input)] border border-[var(--border-subtle)] rounded-xl hover:border-indigo-500/30 transition-all">
                  <div className="flex items-center gap-2 min-w-0">
                    <div className="shrink-0 w-6 h-6 flex items-center justify-center text-xs">
                      {habit.emoji ? <Twemoji emoji={habit.emoji} className="w-4 h-4" /> : "🔥"}
                    </div>
                    <span className="text-[11px] font-bold text-[var(--text-primary)] truncate">{habit.name}</span>
                  </div>
                  
                  <button
                    onClick={() => onToggle(habit.id, true)}
                    className="flex items-center justify-center p-1 rounded-lg bg-yellow-500/10 hover:bg-yellow-500/20 text-yellow-500 transition-colors border border-yellow-500/20"
                    title="Log Action"
                  >
                    <Icon icon="lucide:check" fontSize={12} />
                  </button>
                </div>
              ))}
              {atRiskHabits.length > 3 && (
                <div className="text-[10px] text-center text-zinc-500 font-bold">
                  + {atRiskHabits.length - 3} more habits at risk
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* =======================================================================
          WIDGET 4: Bio-Hacks / Insights
          ======================================================================= */}
      <div className="glass-panel p-6 rounded-[28px] space-y-4 relative overflow-hidden group">
        <div className="flex items-center justify-between">
          <h3 className="text-zinc-500 text-[10px] font-black uppercase tracking-[0.2em]">Bio-Hacks & Protocols</h3>
          <button
            onClick={() => setInsightIndex((prev) => (prev + 1) % INSPIRATIONAL_TIPS.length)}
            className="text-zinc-500 hover:text-[var(--text-primary)] transition-colors p-1 rounded-full hover:bg-[var(--bg-hover)]"
            title="Next Insight"
          >
            <Icon icon="lucide:sparkles" />
          </button>
        </div>

        <AnimatePresence mode="wait">
          <motion.div
            key={insightIndex}
            initial={{ opacity: 0, x: 10 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -10 }}
            transition={{ duration: 0.2 }}
            className="space-y-1.5"
          >
            <h4 className="text-[12px] font-black text-indigo-400 uppercase tracking-wide">{currentTip.title}</h4>
            <p className="text-xs font-semibold text-[var(--text-secondary)] leading-relaxed italic">
              "{currentTip.text}"
            </p>
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}
