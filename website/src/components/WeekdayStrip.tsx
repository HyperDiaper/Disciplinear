'use client';

import { format } from 'date-fns';
import { motion } from 'framer-motion';
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { Icon } from '@iconify/react';

type DayItem = {
  date: string;
  dayLabel: string;   // 'Mon'
  dayNum: string;     // '14'
  pct: number;        // 0-100
  isToday: boolean;
  isSelected?: boolean;
};

export default function WeekdayStrip({ 
  days,
  selectedDate,
  onSelectDate 
}: { 
  days: DayItem[];
  selectedDate?: string;
  onSelectDate?: (date: string) => void;
}) {
  return (
    <div className="flex items-center gap-2">
      {/* Date Picker Button */}
      <Popover>
        <PopoverTrigger className="flex-shrink-0 w-12 h-12 flex items-center justify-center rounded-full bg-[var(--bg-card)] border border-[var(--border-subtle)] hover:bg-[var(--bg-hover)] transition-all">
          <Icon icon="lucide:calendar-search" className="text-[var(--text-secondary)]" fontSize={20} />
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0 border-[var(--border-subtle)] bg-[var(--bg-card)] backdrop-blur-xl" align="start">
          <Calendar
            mode="single"
            selected={selectedDate ? new Date(selectedDate) : undefined}
            onSelect={(val) => {
              if (val && onSelectDate) {
                onSelectDate(format(val, 'yyyy-MM-dd'));
              }
            }}
            initialFocus
          />
        </PopoverContent>
      </Popover>

      {/* Weekday Strip */}
      <div className="flex-1 min-w-0 flex justify-between items-center bg-[var(--bg-input)] p-1 rounded-full border border-[var(--border-subtle)] overflow-x-auto custom-scrollbar">
        {days.map((d, i) => {
          const active = d.isSelected || d.isToday && !selectedDate;
          return (
            <button
              key={i}
              onClick={() => onSelectDate && onSelectDate(d.date)}
              className="relative flex flex-col items-center justify-center w-12 h-12 rounded-full transition-all flex-shrink-0"
            >
              {active && (
                <motion.div 
                  layoutId="activeDay"
                  className="absolute inset-0 bg-[var(--bg-hover)] rounded-full shadow-inner"
                  transition={{ type: 'spring', bounce: 0, duration: 0.4 }}
                />
              )}
              
              <svg className="absolute inset-0 w-full h-full -rotate-90 pointer-events-none text-[var(--accent-color)]">
                <circle cx="24" cy="24" r="21" className="fill-none stroke-[var(--border-subtle)] mix-blend-overlay" strokeWidth="2.5" />
                <motion.circle 
                  cx="24" cy="24" r="21" 
                  className="fill-none stroke-current" 
                  strokeWidth="2.5" 
                  strokeLinecap="round" 
                  initial={{ strokeDasharray: "0 132" }}
                  animate={{ strokeDasharray: `${(d.pct / 100) * 132} 132` }}
                  transition={{ duration: 1, ease: "easeOut" }}
                />
              </svg>

              <div className="relative z-10 flex flex-col items-center">
                <span className={`text-[8px] font-black uppercase tracking-tighter mb-0.5 ${active ? 'text-[var(--text-primary)]' : 'text-[var(--text-muted)]'}`}>
                  {d.dayLabel.substring(0, 3)}
                </span>
                <span className={`text-[13px] font-black leading-none ${active ? 'text-[var(--text-primary)]' : 'text-[var(--text-secondary)]'}`}>
                  {d.dayNum}
                </span>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
