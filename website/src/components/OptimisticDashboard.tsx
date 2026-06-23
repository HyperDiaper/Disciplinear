'use client';

import { useOptimistic, useTransition, useState } from 'react';
import { format, subDays, eachDayOfInterval, startOfDay, startOfWeek, endOfWeek } from 'date-fns';
import AddHabitModal from '@/components/AddHabitModal';
import HabitList from '@/components/HabitList';
import WeekdayStrip from '@/components/WeekdayStrip';
import HeatmapInline from '@/components/HeatmapInline';
import WidgetsPanel from '@/components/WidgetsPanel';
import { toggleHabitLog, adjustHabitLogValue } from '@/app/dashboard/actions';
import { motion, AnimatePresence } from 'framer-motion';
import { Icon } from '@iconify/react';

// Custom Confirmation Modal Component
function ConfirmationModal({ isOpen, onConfirm, onCancel, date }: { isOpen: boolean; onConfirm: () => void; onCancel: () => void; date: string }) {
  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div 
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={onCancel}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[2000]"
          />
          <div className="fixed inset-0 flex items-center justify-center z-[2001] p-4 pointer-events-none">
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="bg-[var(--bg-card)] border border-[var(--border-subtle)] rounded-[32px] p-8 w-full max-w-sm shadow-2xl pointer-events-auto text-center"
            >
              <div className="w-16 h-16 bg-amber-500/10 rounded-2xl flex items-center justify-center text-amber-500 mx-auto mb-6">
                <Icon icon="lucide:alert-triangle" fontSize={32} />
              </div>
              <h3 className="text-xl font-black text-[var(--text-primary)] mb-2">Modify Past Activity?</h3>
              <p className="text-[var(--text-secondary)] text-sm mb-8 leading-relaxed">
                You are about to change the logs for <span className="text-[var(--text-primary)] font-bold">{format(new Date(date), 'MMMM do')}</span>. This will update your streaks and records.
              </p>
              <div className="flex gap-3">
                <button 
                  onClick={onCancel}
                  className="flex-1 py-3 rounded-xl font-bold text-[13px] uppercase tracking-wider text-[var(--text-secondary)] hover:bg-[var(--bg-hover)] transition-colors"
                >
                  Cancel
                </button>
                <button 
                  onClick={onConfirm}
                  className="flex-1 py-3 rounded-xl font-bold text-[13px] uppercase tracking-wider bg-orange-500 text-white shadow-lg shadow-orange-500/20 hover:bg-orange-600 transition-colors"
                >
                  Confirm
                </button>
              </div>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  );
}

type Action = 
  | { type: 'toggle'; habitId: string; isCompleted: boolean; date: string }
  | { type: 'adjust'; habitId: string; date: string; delta: number; target: number };

export default function OptimisticDashboard({
  habits,
  initialTodayLogs,
  initialAllLogs,
  today,
  currentYear,
}: {
  habits: any[];
  initialTodayLogs: any[];
  initialAllLogs: any[];
  today: string;
  currentYear: number;
}) {
  const [isPending, startTransition] = useTransition();
  const [showConfirm, setShowConfirm] = useState<{ action: 'toggle' | 'adjust', habitId: string, isCompleted?: boolean, delta?: number, target?: number } | null>(null);

  const [allLogs, dispatchOptimisticLog] = useOptimistic(
    initialAllLogs,
    (state, action: Action) => {
      if (action.type === 'toggle') {
        const { habitId, isCompleted, date } = action;
        const existingIdx = state.findIndex(l => l.habit_id === habitId && l.log_date === date);
        if (isCompleted) {
          if (existingIdx > -1) return state; // Already exists
          return [...state, { habit_id: habitId, log_date: date, is_completed: true }];
        } else {
          if (existingIdx === -1) return state; // Doesn't exist
          return state.filter((_, i) => i !== existingIdx);
        }
      } else if (action.type === 'adjust') {
        const { habitId, date, delta, target } = action;
        const existingIdx = state.findIndex(l => l.habit_id === habitId && l.log_date === date);
        let currentVal = 0;
        if (existingIdx > -1) currentVal = state[existingIdx].value || 0;
        const newVal = Math.max(0, currentVal + delta);
        const isCompleted = newVal >= target;
        
        if (existingIdx > -1) {
          const newState = [...state];
          if (newVal === 0 && !isCompleted) {
            newState.splice(existingIdx, 1);
          } else {
            newState[existingIdx] = { ...newState[existingIdx], value: newVal, is_completed: isCompleted };
          }
          return newState;
        } else {
          if (newVal > 0 || isCompleted) {
            return [...state, { habit_id: habitId, log_date: date, value: newVal, is_completed: isCompleted }];
          }
          return state;
        }
      }
      return state;
    }
  );

  const habitCount = habits.length;
  const [selectedDateStr, setSelectedDateStr] = useState(today);

  const executeToggle = async (habitId: string, isCompleted: boolean) => {
    startTransition(async () => {
      dispatchOptimisticLog({ type: 'toggle', habitId, isCompleted, date: selectedDateStr });
      await toggleHabitLog(habitId, selectedDateStr, isCompleted);
    });
    setShowConfirm(null);
  };

  const executeAdjust = async (habitId: string, delta: number, target: number) => {
    startTransition(async () => {
      dispatchOptimisticLog({ type: 'adjust', habitId, date: selectedDateStr, delta, target });
      await adjustHabitLogValue(habitId, selectedDateStr, delta, target);
    });
    setShowConfirm(null);
  };

  const handleToggle = async (habitId: string, isCompleted: boolean) => {
    if (selectedDateStr !== today) {
      setShowConfirm({ action: 'toggle', habitId, isCompleted });
      return;
    }
    await executeToggle(habitId, isCompleted);
  };

  const handleAdjust = async (habitId: string, delta: number, target: number) => {
    if (selectedDateStr !== today) {
      setShowConfirm({ action: 'adjust', habitId, delta, target });
      return;
    }
    await executeAdjust(habitId, delta, target);
  };

  // Recalculate everything based on optimistic logs
  const viewedLogs = allLogs.filter(l => l.log_date === selectedDateStr);

  // Generate the week containing selectedDateStr (Sunday to Saturday)
  const weekStart = startOfWeek(new Date(selectedDateStr));
  const weekEnd = endOfWeek(new Date(selectedDateStr));
  
  const last7 = eachDayOfInterval({ start: weekStart, end: weekEnd }).map((d) => {
    const dateStr = format(d, 'yyyy-MM-dd');
    const completedCount = allLogs.filter(l => l.log_date === dateStr && l.is_completed).length;
    return { 
      date: dateStr, 
      dayLabel: format(d, 'EEE'), 
      dayNum: format(d, 'd'), 
      pct: habitCount > 0 ? (completedCount / habitCount) * 100 : 0, 
      isToday: dateStr === today,
      isSelected: dateStr === selectedDateStr
    };
  });

  const buildHabits = habits.filter(h => h.mode === 'build');
  const quitHabits = habits.filter(h => h.mode === 'quit');

  const startOfThisYear = startOfDay(new Date(currentYear, 0, 1));
  const endOfThisYear = startOfDay(new Date(currentYear, 11, 31));

  const daysYear = eachDayOfInterval({
    start: startOfThisYear,
    end: endOfThisYear
  }).map(d => {
    const dateStr = format(d, 'yyyy-MM-dd');
    const todayStr = format(new Date(), 'yyyy-MM-dd');
    const isFuture = dateStr > todayStr;
    const logsForDay = allLogs.filter(l => l.log_date === dateStr && l.is_completed);

    const activeBuildHabits = buildHabits.filter(h => h.start_date <= dateStr);
    const activeQuitHabits = quitHabits.filter(h => h.start_date <= dateStr);

    if (activeBuildHabits.length === 0 && activeQuitHabits.length === 0 || isFuture) {
      return { date: dateStr, count: 0, relapsed: 0, totalBuild: 0, totalQuit: 0 };
    }

    const buildCompleted = logsForDay.filter(l => activeBuildHabits.some(h => h.id === l.habit_id)).length;
    const quitRelapsed = logsForDay.filter(l => activeQuitHabits.some(h => h.id === l.habit_id)).length;

    return {
      date: dateStr,
      count: buildCompleted,
      relapsed: quitRelapsed,
      totalBuild: activeBuildHabits.length,
      totalQuit: activeQuitHabits.length
    };
  });

  const formattedDate = format(new Date(selectedDateStr), 'EEEE, MMMM do');
  const totalCompletedViewed = viewedLogs.filter(l => l.is_completed).length;
  const viewedPct = habitCount > 0 ? Math.round((totalCompletedViewed / habitCount) * 100) : 0;

  return (
    <div className="w-full space-y-6">
      <ConfirmationModal 
        isOpen={!!showConfirm} 
        date={selectedDateStr}
        onConfirm={() => {
          if (!showConfirm) return;
          if (showConfirm.action === 'toggle') {
            executeToggle(showConfirm.habitId, showConfirm.isCompleted!);
          } else {
            executeAdjust(showConfirm.habitId, showConfirm.delta!, showConfirm.target!);
          }
        }}
        onCancel={() => setShowConfirm(null)}
      />

      <section className="glass-panel p-4 sm:p-6 rounded-[32px] space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
          <div className="space-y-0.5">
            <div className="flex items-center gap-3">
              <h1 className="text-[32px] font-black text-[var(--text-primary)] tracking-tight leading-none">
                {selectedDateStr === today ? 'Today' : format(new Date(selectedDateStr), 'MMM d')}
              </h1>
              {selectedDateStr !== today && (
                <button 
                  onClick={() => setSelectedDateStr(today)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/5 border border-white/10 hover:bg-white/10 transition-colors text-[10px] font-black uppercase tracking-wider text-[var(--accent-color)]"
                >
                  <Icon icon="lucide:arrow-left" /> Back to Today
                </button>
              )}
            </div>
            <div className="flex items-center gap-2">
              <p className="text-[14px] text-[var(--text-secondary)] font-bold">{formattedDate}</p>
              {habitCount > 0 && <div className="h-3 w-[1.5px] bg-[var(--border-subtle)]" />}
              {habitCount > 0 && (
                <div className="flex items-center gap-2">
                  <span className="text-[13px] font-black text-[var(--accent-color)] uppercase tracking-wider">{viewedPct}%</span>
                </div>
              )}
            </div>
          </div>
          <div className="flex items-center gap-3">
            {habitCount > 0 && (
              <div className="hidden lg:flex flex-col items-end gap-1">
                <div className="w-24 h-1.5 rounded-full bg-[var(--bg-input)] overflow-hidden">
                  <div
                    className="h-full rounded-full bg-[var(--accent-color)] transition-all duration-[1000ms]"
                    style={{ width: `${viewedPct}%` }}
                  />
                </div>
                <span className="text-[10px] font-black text-[var(--text-muted)] uppercase tracking-widest">{totalCompletedViewed}/{habitCount} Habits</span>
              </div>
            )}
            <AddHabitModal />
          </div>
        </div>
        <WeekdayStrip 
          days={last7} 
          selectedDate={selectedDateStr} 
          onSelectDate={setSelectedDateStr} 
        />
      </section>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        <div className="lg:col-span-2">
          <HabitList
            habits={habits}
            logs={viewedLogs}
            today={selectedDateStr}
            allLogs={allLogs}
            onToggle={handleToggle}
            onAdjust={handleAdjust}
          />
        </div>
        <div className="lg:col-span-1">
          <WidgetsPanel
            habits={habits}
            logs={viewedLogs}
            today={selectedDateStr}
            realToday={today}
            allLogs={allLogs}
            onToggle={handleToggle}
            onAdjust={handleAdjust}
          />
        </div>
      </div>

      {habitCount > 0 && (
        <section className="mt-8 p-6 rounded-[20px] glass-panel transition-all duration-300 w-full overflow-hidden">
          <h2 className="text-[13px] font-bold text-[var(--text-secondary)] mb-5 uppercase tracking-widest pl-1">Yearly Activity ({currentYear})</h2>
          <div className="w-full">
            <HeatmapInline days={daysYear} />
          </div>
        </section>
      )}
    </div>
  );
}
