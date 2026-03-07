'use client';

import { useTheme } from '@/lib/theme';
import { useState, useEffect } from 'react';

export function ThemeToggle() {
  const { theme, toggleTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  if (!mounted) return null;

  return (
    <button
      type="button"
      onClick={toggleTheme}
      className={`
        relative group flex items-center gap-3 px-4 py-1.5 
        border transition-all duration-300 overflow-hidden rounded-sm
        ${theme === 'dark'
          ? 'bg-black border-pink-500/50 hover:border-pink-500 hover:shadow-[0_0_15px_rgba(236,72,153,0.3)]'
          : 'bg-white border-cyan-500/50 hover:border-cyan-500 hover:shadow-[0_0_15px_rgba(6,182,212,0.3)]'}
      `}
      aria-label={theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
    >
      {/* Scanning line animation inside button */}
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-white/5 to-transparent h-1/2 w-full animate-scan-slow pointer-events-none" />

      {/* LED Indicator */}
      <div className="relative">
        <div className={`w-1.5 h-1.5 rounded-full ${theme === 'dark' ? 'bg-pink-500 shadow-[0_0_8px_#ec4899]' : 'bg-cyan-500 shadow-[0_0_8px_#06b6d4]'} animate-pulse`} />
      </div>

      <div className="flex flex-col items-start leading-none gap-0.5">
        <span className={`text-[8px] font-mono uppercase tracking-[0.2em] ${theme === 'dark' ? 'text-pink-500/60' : 'text-cyan-500/60'}`}>
          System_Mode
        </span>
        <span className={`text-[10px] font-bold font-mono tracking-widest ${theme === 'dark' ? 'text-white' : 'text-black'}`}>
          {theme === 'dark' ? 'IDRT.NS (DARK)' : 'IDRT.LS (LIGHT)'}
        </span>
      </div>

      {/* Corner Brackets */}
      <div className="absolute top-0 left-0 w-1 h-1 border-t border-l border-current opacity-30 group-hover:opacity-100" />
      <div className="absolute bottom-0 right-0 w-1 h-1 border-b border-r border-current opacity-30 group-hover:opacity-100" />
    </button>
  );
}
