'use client';

import React, { useState, useEffect } from 'react';
import GlitchGL from '@/components/GlitchGL';
import { GlitchRandomizer } from '@/components/GlitchRandomizer';

export default function Home() {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  if (!mounted) return null;

  return (
    <main className="fixed inset-0 bg-[#0a0a0a] flex items-center justify-center overflow-hidden font-mono text-white">
      {/* Full screen filter effect */}
      <div className="absolute inset-0 z-0">
        <GlitchRandomizer
          intervalMs={2000}
          smoothing={0.98}
          ranges={{
            'crt.rareGlitchIntensity': [0.0, 0.4],
            'crt.jitterIntensity': [0.01, 0.1],
            'crt.interferenceIntensity': [0.05, 0.3],
            'crt.brightness': [1.1, 1.3],
            'crt.scanningBandIntensity': [0.1, 0.5]
          }}
          baseEffects={{
            crt: {
              enabled: true,
              scanlineIntensity: 0.5,
              curvature: 4.0,
              brightness: 1.2,
              phosphorIntensity: 0.4,
              vignetteIntensity: 0.7,
              scanningBandIntensity: 0.5,
              rareGlitchIntensity: 0.3,
              interferenceIntensity: 0.2,
              jitterIntensity: 0.1,
            }
          }}
        >
          <GlitchGL
            text="HELLO WORLD"
            className="w-full h-full opacity-80"
          />
        </GlitchRandomizer>
      </div>

      {/* Global Scanline Overlay */}
      <div className="absolute inset-0 pointer-events-none z-50 bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.1)_50%)] bg-[length:100%_4px] opacity-20" />
    </main>
  );
}
