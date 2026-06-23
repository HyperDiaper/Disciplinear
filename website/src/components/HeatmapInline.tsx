'use client';

import { useState, useRef, useCallback, useEffect } from 'react';
import { format, parseISO } from 'date-fns';
import { motion, AnimatePresence } from 'framer-motion';

type DayData = {
  date: string;       // yyyy-MM-dd
  count: number;      // Successful Build habits
  relapsed: number;   // Relapsed Quit habits
  totalBuild: number;
  totalQuit: number;
};

type TooltipState = {
  x: number;
  y: number;
  data: DayData;
} | null;

// 7-row (Sun→Sat) heatmap that fills columns left→right
export default function HeatmapInline({ days }: { days: DayData[] }) {
  const [tooltip, setTooltip] = useState<TooltipState>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 640);
    };
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Group into columns of 7 (weeks)
  const weeks: (DayData | null)[][] = [];
  let week: (DayData | null)[] = [];

  const firstDay = days[0] ? parseISO(days[0].date) : new Date();
  const startDow = firstDay.getDay();
  for (let p = 0; p < startDow; p++) week.push(null);

  for (const day of days) {
    week.push(day);
    if (week.length === 7) {
      weeks.push(week);
      week = [];
    }
  }
  if (week.length) {
    while (week.length < 7) week.push(null);
    weeks.push(week);
  }

  const getColorStyle = (d: DayData | null): React.CSSProperties => {
    if (!d || !d.date) return { backgroundColor: 'transparent' };
    const { count, relapsed, totalBuild, totalQuit } = d;

    const totalPossible = totalBuild + totalQuit;
    if (totalPossible === 0) return { backgroundColor: 'var(--cell-bg)' };

    // Success Rate
    const buildSuccesses = count;
    const quitSuccesses = totalQuit - relapsed;
    const totalSuccesses = buildSuccesses + quitSuccesses;
    const successRate = totalSuccesses / totalPossible;

    // GitHub-style Levels
    const greenLevels = ['#0e4429', '#006d32', '#26a641', '#39d353'];
    const redLevels = ['#440e0e', '#6d0000', '#a62626', '#d33939'];

    const getLevel = (rate: number) => {
      if (rate < 0.2) return 0;
      if (rate < 0.5) return 1;
      if (rate < 0.8) return 2;
      return 3;
    };

    // 1. Perfect Day (All reached)
    if (successRate === 1) {
      return { backgroundColor: greenLevels[3] };
    }

    // 2. Failed Day (No builds reached OR any relapses)
    // If we have relapses, we definitely want to show some red.
    if (relapsed > 0 && count === 0) {
      return { backgroundColor: redLevels[getLevel(relapsed / totalQuit)] };
    }

    // 3. Mixed Day (Some builds done, some relapses or missed builds)
    if (successRate > 0 && successRate < 1) {
      // If relapsed, or missed build, use lower green or red?
      // Let's use green for general activity, but the red overlay in JSX will handle the tint if relapsed.
      return { backgroundColor: greenLevels[getLevel(successRate)] };
    }

    // 4. Absolute Failure (0 successes)
    if (successRate === 0) {
      return { backgroundColor: redLevels[3] };
    }

    return { backgroundColor: '#161b22' };
  };


  const handleMouseMove = useCallback((e: React.MouseEvent, d: DayData | null) => {
    if (!d || !d.date) return;
    setTooltip({ x: e.clientX + 4, y: e.clientY + 4, data: d });
  }, []);

  const displayedWeeks = isMobile ? weeks.slice(-15) : weeks;

  return (
    <div ref={containerRef} className="relative w-full overflow-hidden">
      <div
        className="grid gap-[2px] w-full pt-[2px]"
        style={{
          gridTemplateColumns: `auto repeat(${displayedWeeks.length}, 1fr)`,
          gridTemplateRows: 'repeat(7, auto)'
        }}
      >
        {/* Row Headers (Weekdays) */}
        {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((d, ri) => (
          <div
            key={ri}
            className="text-[8px] font-black text-[var(--text-primary)] opacity-40 flex items-center justify-center pr-1.5"
            style={{ gridRow: ri + 1, gridColumn: 1, height: '100%' }}
          >
            {d}
          </div>
        ))}

        {/* Data Cells */}
        {displayedWeeks.map((weekData, wi) => (
          weekData.map((d, di) => {
            const dateStyle = getColorStyle(d);
            return (
              <div
                key={`${wi}-${di}`}
                onMouseMove={e => handleMouseMove(e, d)}
                onMouseLeave={() => setTooltip(null)}
                className={`relative rounded-[3px] transition-colors duration-200 ${d ? 'hover:brightness-90' : ''}`}
                style={{
                  gridRow: di + 1,
                  gridColumn: wi + 2,
                  cursor: d?.date ? 'crosshair' : 'default',
                  width: '100%',
                  aspectRatio: '1/1',
                  border: d?.date ? '1px solid rgba(255,255,255,0.02)' : 'none',
                  overflow: 'hidden' // Ensure layers don't spill
                }}
              >
                {/* Base Intensity Layer */}
                <div className="absolute inset-0" style={{ backgroundColor: dateStyle.backgroundColor }} />

                {/* Mixed Activity Overlay */}
                {d && d.count > 0 && d.relapsed > 0 && (
                  <div
                    className="absolute inset-0 z-10"
                    style={{ backgroundColor: 'rgba(239, 68, 68, 0.6)' }}
                  />
                )}

                {/* Hover Effect Layer */}
                {d && (
                  <div className="absolute inset-0 bg-black/20 dark:bg-white/20 opacity-0 hover:opacity-100 transition-opacity duration-200 z-20" />
                )}
              </div>
            );
          })

        ))}
      </div>

      {/* Floating Tooltip */}
      <AnimatePresence>
        {tooltip && (
          <motion.div
            className="heatmap-tooltip backdrop-blur-xs p-3 min-w-[140px]"
            style={{ left: tooltip.x, top: tooltip.y }}
            initial={{ opacity: 0, scale: 0.9, y: 5 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 5 }}
            transition={{ duration: 0.15, ease: "easeOut" }}
          >
            <div className="font-bold text-[var(--text-primary)] mb-2 border-b border-[var(--border-subtle)] pb-1.5 text-[12px]">
              {format(parseISO(tooltip.data.date), 'MMM d, yyyy')}
            </div>

            <div className="space-y-1.5">
              <div className="flex items-center justify-between gap-4">
                <span className="text-[11px] font-bold text-[var(--text-secondary)] uppercase tracking-wider">Completed</span>
                <span className="text-[11px] font-black text-emerald-500 tabular-nums">
                  {tooltip.data.count}/{tooltip.data.totalBuild}
                </span>
              </div>

              <div className="flex items-center justify-between gap-4">
                <span className="text-[11px] font-bold text-[var(--text-secondary)] uppercase tracking-wider">Relapsed</span>
                <span className={`text-[11px] font-black tabular-nums ${tooltip.data.relapsed > 0 ? 'text-red-500 animate-pulse' : 'text-[var(--text-muted)]'}`}>
                  {tooltip.data.relapsed}/{tooltip.data.totalQuit}
                </span>
              </div>
            </div>

            <div className="mt-2.5 pt-2 border-t border-[var(--border-subtle)]">
              {(() => {
                const isPerfect = tooltip.data.relapsed === 0 &&
                  tooltip.data.count === tooltip.data.totalBuild &&
                  (tooltip.data.totalBuild > 0 || (tooltip.data as any).totalQuit > 0);

                if (isPerfect) return (
                  <span className="text-[10px] font-black uppercase tracking-widest text-emerald-500/80">Perfect Day</span>
                );

                if (tooltip.data.relapsed > 0 && tooltip.data.count > 0) return (
                  <span className="text-[10px] font-black uppercase tracking-widest text-[#ffcc00]/80">Mixed Results</span>
                );

                if (tooltip.data.relapsed > 0) return (
                  <span className="text-[10px] font-black uppercase tracking-widest text-red-500/80">Failed</span>
                );

                if (tooltip.data.count < tooltip.data.totalBuild && tooltip.data.count > 0) return (
                  <span className="text-[10px] font-black uppercase tracking-widest text-[#ffcc00]/80">Incomplete</span>
                );

                return (
                  <span className="text-[10px] font-black uppercase tracking-widest text-[var(--text-muted)]">No Logs</span>
                );
              })()}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Legend */}
      <div className="flex items-center justify-end gap-3 text-[10px] font-bold text-[var(--text-secondary)] mt-2 uppercase tracking-widest opacity-60">
        <div className="flex items-center gap-1">
          <div className="w-[10px] h-[10px] rounded-[2px] bg-[#161b22]" />
          <span>Empty</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-[10px] h-[10px] rounded-[2px] bg-[#26a641]" />
          <span>Success</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-[10px] h-[10px] rounded-[2px] bg-[#26a641] relative overflow-hidden">
            <div className="absolute inset-0" style={{ backgroundColor: 'rgba(239, 68, 68, 0.6)' }} />
          </div>
          <span>Mixed</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-[10px] h-[10px] rounded-[2px] bg-[#a62626]" />
          <span>Relapse</span>
        </div>
      </div>
    </div>
  );
}
