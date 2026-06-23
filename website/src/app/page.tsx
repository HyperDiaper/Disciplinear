'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/utils/supabase/client';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { ArrowRight, CheckCircle2, TrendingUp, Calendar } from 'lucide-react';
import Navbar from '@/components/Navbar';

export default function LandingPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkUser = async () => {
      const supabase = createClient();
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        router.replace('/dashboard');
      } else {
        setLoading(false);
      }
    };
    checkUser();
  }, [router]);

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="w-10 h-10 rounded-full border-4 border-indigo-500/20 border-t-indigo-500 animate-spin" />
      </div>
    );
  }
  return (
    <div className="min-h-screen bg-black text-white selection:bg-indigo-500/30">
      <Navbar />
      
      {/* Hero Section */}
      <main className="relative pt-32 pb-20 sm:pt-40 sm:pb-24">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-indigo-900/40 via-black to-black -z-10" />
        
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight mb-8">
              Forge Habits. <br className="hidden sm:block" />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-cyan-400">
                Rewire Your Life.
              </span>
            </h1>
            <p className="mt-4 max-w-2xl text-xl text-gray-400 mx-auto mb-10">
              Disciplinear is a premium, dopamine-driven habit tracker designed to help you build consistency, track your progress, and visualize your daily success.
            </p>
            
            <div className="flex justify-center gap-4">
              <Link href="/login" className="rounded-full px-8 py-4 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold flex items-center transition-all hover:scale-105 active:scale-95">
                Start Tracking Free
                <ArrowRight className="ml-2 w-5 h-5" />
              </Link>
            </div>
          </motion.div>
        </div>
      </main>

      {/* Features Grid */}
      <section className="py-24 bg-zinc-950">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-3 gap-8">
            <FeatureCard 
              icon={<CheckCircle2 className="w-8 h-8 text-emerald-400" />}
              title="Rich Tracking"
              description="From simple checkboxes to numeric limits and timers. Track your life your way."
              delay={0.1}
            />
            <FeatureCard 
              icon={<Calendar className="w-8 h-8 text-indigo-400" />}
              title="Visual Heatmaps"
              description="GitHub-style contribution graphs to spot trends and keep the streak alive."
              delay={0.2}
            />
            <FeatureCard 
              icon={<TrendingUp className="w-8 h-8 text-rose-400" />}
              title="Dopamine Hits"
              description="Micro-animations, celebrations, and detailed stats to reward your progress instantly."
              delay={0.3}
            />
          </div>
        </div>
      </section>
    </div>
  );
}

function FeatureCard({ icon, title, description, delay }: { icon: React.ReactNode, title: string, description: string, delay: number }) {
  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.5, delay }}
      className="p-8 rounded-2xl bg-zinc-900 border border-zinc-800 hover:border-indigo-500/50 transition-colors"
    >
      <div className="mb-4">{icon}</div>
      <h3 className="text-xl font-bold text-white mb-2">{title}</h3>
      <p className="text-gray-400 leading-relaxed">{description}</p>
    </motion.div>
  );
}
