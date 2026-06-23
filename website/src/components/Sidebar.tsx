'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, BarChart2, Settings, LogOut } from 'lucide-react';
import { signout } from '@/app/login/actions';
import { motion } from 'framer-motion';

export default function Sidebar() {
  const pathname = usePathname();

  return (
    <div className="hidden md:flex md:w-[260px] md:h-screen md:sticky top-0 flex-col pt-10 pb-6 px-6 glass-panel border-r border-[var(--border-subtle)]/40 shrink-0">
      <div className="mb-10 pl-2">
        <Link href="/dashboard" className="font-black text-2xl tracking-tighter text-[var(--text-primary)] flex items-center gap-3 transition-transform origin-left">
          Disciplinear
        </Link>
      </div>

      <nav className="flex-1 space-y-1">
        <SidebarLink href="/dashboard" icon={<Home size={18} />} label="Home" active={pathname === '/dashboard'} />
        <SidebarLink href="/dashboard/stats" icon={<BarChart2 size={18} />} label="Analytics" active={pathname === '/dashboard/stats'} />
      </nav>

      <div className="space-y-1 pt-6 border-t border-[var(--border-subtle)]">
        <SidebarLink href="/dashboard/settings" icon={<Settings size={18} />} label="Settings" active={pathname === '/dashboard/settings'} />
        <form action={signout}>
          <button className="group w-full flex items-center gap-3 px-4 py-3 text-[14px] font-bold rounded-xl text-[var(--text-secondary)] hover:text-red-400 hover:bg-red-500/10 transition-all">
            <LogOut size={18} className="transition-transform group-hover:-translate-x-1" />
            Sign Out
          </button>
        </form>
      </div>
    </div>
  );
}

function SidebarLink({ href, icon, label, active }: { href: string; icon: React.ReactNode; label: string; active?: boolean }) {
  return (
    <Link
      href={href}
      className={`relative flex items-center gap-3 px-4 py-3 text-[14px] font-[700] rounded-xl transition-all hover:bg-[var(--bg-hover)] active:scale-[0.97] ${active ? 'text-[var(--text-primary)] bg-[var(--bg-hover)]/50' : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
        }`}
    >
      <span className="relative z-10">{icon}</span>
      <span className="relative z-10">{label}</span>
    </Link>
  );
}
