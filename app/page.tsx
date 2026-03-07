'use client';

import GlitchGL from '@/components/GlitchGL';
import { ThemeToggle } from '@/components/ThemeToggle';

const SAMPLE_IMAGE = 'https://picsum.photos/seed/luxflamy/1200/800';

export default function Home() {
  return (
    <main className="min-h-screen bg-gray-950">
      {/* Top Navigation */}
      <header className="sticky top-0 z-20 flex justify-between items-center border-b border-white/5 bg-black/40 p-4 backdrop-blur-md">
        <h2 className="text-sm font-mono tracking-widest text-pink-500 uppercase">Luxflamy Terminal v1.0</h2>
        <ThemeToggle />
      </header>

      {/* Hero Section with Ultimate CRT */}
      <section className="relative flex flex-col items-center justify-center px-4 py-16 min-h-[80vh]">
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-pink-500/5 to-transparent pointer-events-none" />

        <div className="w-full max-w-5xl group">
          <div className="relative overflow-hidden rounded-2xl border border-white/10 shadow-2xl transition-all duration-700 hover:border-pink-500/30">
            <GlitchGL
              src={SAMPLE_IMAGE}
              className="aspect-video w-full"
              effects={{
                crt: {
                  enabled: true,
                  scanlineIntensity: 0.4,
                  curvature: 3.5,
                  brightness: 1.1,
                  phosphorIntensity: 0.4,
                  vignetteIntensity: 0.6,
                  scanningBandIntensity: 0.7,
                  chromaticPulseIntensity: 0.5,
                  rareGlitchIntensity: 0.8,
                },
                pixelation: {
                  enabled: false,
                },
              }}
              interaction={{
                enabled: true,
                radius: 150,
                intensity: 1.2,
              }}
            />

            {/* Retro Overlays */}
            <div className="absolute top-6 left-6 pointer-events-none flex flex-col gap-1 items-start">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                <span className="text-xs font-mono text-white/70 uppercase">Recording...</span>
              </div>
              <span className="text-[10px] font-mono text-white/40 tracking-tighter">REF: LUX-GL-2026</span>
            </div>

            <div className="absolute bottom-6 right-6 pointer-events-none">
              <span className="text-xs font-mono text-pink-500/80 tracking-widest">SYSTEM: OPERATIONAL</span>
            </div>
          </div>
        </div>

        <div className="mt-12 text-center max-w-2xl">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-white via-pink-200 to-gray-500 bg-clip-text text-transparent">
            Retro-Future Interface
          </h1>
          <p className="mt-4 text-gray-400 font-mono text-sm leading-relaxed">
            [EXPERIMENT] Ultimate CRT Shader Implementation<br />
            RGB Phosphor / Scanning Bands / Rare Glitch / Barrel Distortion
          </p>
        </div>
      </section>

      {/* Footer Info */}
      <footer className="border-t border-white/5 py-8 text-center bg-black/20">
        <p className="text-[10px] font-mono text-gray-600 uppercase tracking-widest">
          Build with Next.js & WebGL Shaders
        </p>
      </footer>
    </main>
  );
}
