'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, BarChart2, Settings } from 'lucide-react';

export default function MobileNav() {
  const pathname = usePathname();

  return (
    <>
      {/* Mobile Top Header */}
      <header className="fixed top-0 left-0 right-0 h-16 z-50 border-b border-[var(--border-subtle)]/40 backdrop-blur-xl bg-black/40 flex items-center justify-between px-6 md:hidden">
        <span className="font-black text-xl tracking-tighter text-[var(--text-primary)]">
          Disciplinear
        </span>
        <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.7)] animate-pulse" />
      </header>

      {/* Mobile Bottom Navigation Bar */}
      <nav className="fixed bottom-0 left-0 right-0 h-20 z-50 border-t border-[var(--border-subtle)]/40 backdrop-blur-2xl bg-black/50 flex items-center justify-around px-4 pb-2 md:hidden">
        <MobileNavLink href="/dashboard" icon={<Home size={20} />} label="Home" active={pathname === '/dashboard'} />
        <MobileNavLink href="/dashboard/stats" icon={<BarChart2 size={20} />} label="Analytics" active={pathname === '/dashboard/stats'} />
        <MobileNavLink href="/dashboard/settings" icon={<Settings size={20} />} label="Settings" active={pathname === '/dashboard/settings'} />
      </nav>
    </>
  );
}

function MobileNavLink({ href, icon, label, active }: { href: string; icon: React.ReactNode; label: string; active?: boolean }) {
  return (
    <Link
      href={href}
      className={`flex flex-col items-center justify-center gap-1 w-16 h-12 transition-all active:scale-95 ${
        active ? 'text-[var(--accent-color)]' : 'text-[var(--text-muted)] hover:text-[var(--text-primary)]'
      }`}
    >
      <span className="relative">
        {icon}
        {active && (
          <span className="absolute -top-1 -right-1 w-1.5 h-1.5 bg-[var(--accent-color)] rounded-full shadow-[0_0_8px_var(--accent-color)]" />
        )}
      </span>
      <span className="text-[10px] font-black uppercase tracking-widest leading-none mt-0.5">{label}</span>
    </Link>
  );
}
