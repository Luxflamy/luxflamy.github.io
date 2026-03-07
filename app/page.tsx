'use client';

import React, { useState, useEffect } from 'react';
import GlitchGL from '@/components/GlitchGL';

export default function Home() {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  if (!mounted) return null;

  return (
    <main className="fixed inset-0 bg-black flex items-center justify-center overflow-hidden font-mono">
      {/* Full screen filter effect */}
      <div className="absolute inset-0 z-0 scale-105">
        <GlitchGL
          src="https://images.unsplash.com/photo-1451187580459-43490279c0fa?auto=format&fit=crop&q=80&w=2000"
          className="w-full h-full opacity-40 grayscale"
          effects={{
            crt: {
              enabled: true,
              scanlineIntensity: 0.7,
              curvature: 6.0,
              brightness: 1.5,
              phosphorIntensity: 0.6,
              vignetteIntensity: 0.9,
              scanningBandIntensity: 1.0,
              rareGlitchIntensity: 1.2,
            }
          }}
        />
      </div>

      {/* Extreme Minimal Content */}
      <div className="relative z-10 flex flex-col items-center">
        <h1 className="text-6xl md:text-9xl font-black text-white tracking-tighter mix-blend-difference animate-pulse">
          HELLO WORLD
        </h1>
        <div className="mt-4 h-[2px] w-full bg-pink-500 shadow-[0_0_15px_#ec4899] animate-pulse" />
      </div>

      {/* Global Scanline Overlay */}
      <div className="absolute inset-0 pointer-events-none z-50 bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.25)_50%),linear-gradient(90deg,rgba(255,0,0,0.06),rgba(0,255,0,0.02),rgba(0,0,255,0.06))] bg-[length:100%_4px,3px_100%] pointer-events-none" />
    </main>
  );
}
