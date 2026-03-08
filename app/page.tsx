'use client';

import React, { useState, useEffect, useMemo } from 'react';
import GlitchGL from '@/components/GlitchGL';
import { GlitchRandomizer } from '@/components/GlitchRandomizer';
import { BloomProvider } from '@/components/Bloom';
import { useWheelScrollOffset } from '@/hooks/useWheelScrollOffset';
import { buildContentSegments } from '@/lib/contentSegments';

const SCRAMBLE_TRIGGER_MS: [number, number] = [10000, 20000];
const SCRAMBLE_DURATION_MS: [number, number] = [2000, 4000];

/** plan3 完整文案（标题 + 自我介绍 + 技能 + 项目 + 占位） */
const HERO_COPY = `Database Developer

Hi, I'm XiangyiLi, a database and data developer passionate about building scalable data systems.

I work with SQL, Python, and machine learning to turn complex data into useful insights and reliable infrastructure.

My projects focus on data architecture, analytics platforms, and large-scale data processing.

## 后面留给之后处理。。。`;

/** 仅这些词参与乱码，顺序需与文案中出现顺序一致 */
const HERO_KEY_TERMS = [
  'Database Developer',
  'XiangyiLi',
  'SQL',
  'Python',
  'machine learning',
  'data architecture',
  'analytics platforms',
  'large-scale data processing',
];

/** 根据行数估算可滚动范围（与 GlitchGL 内 lineHeight ≈ fontSize*1.5、fontSize∝视口一致） */
const HERO_LINE_COUNT = HERO_COPY.split('\n').length;
const SCROLL_CLAMP_PX = Math.max(400, Math.round(HERO_LINE_COUNT * 90));

export default function Home() {
  const [mounted, setMounted] = useState(false);
  const [glowIntensity, setGlowIntensity] = useState(4);
  const scrambleTriggerRangeMs = useMemo(() => SCRAMBLE_TRIGGER_MS, []);
  const scrambleDurationRangeMs = useMemo(() => SCRAMBLE_DURATION_MS, []);
  const contentSegments = useMemo(() => buildContentSegments(HERO_COPY, HERO_KEY_TERMS), []);
  const { containerRef, offsetRef } = useWheelScrollOffset({
    clampPx: SCROLL_CLAMP_PX,
    sensitivity: 0.35,
    inertia: true,
    decayFactor: 0.92,
  });

  useEffect(() => setMounted(true), []);

  if (!mounted) return null;

  return (
    <main className="fixed inset-0 bg-black overflow-hidden font-mono text-white">
      {/* 视口层：捕获滚轮，电视内文字上下移动 */}
      <div
        ref={containerRef as React.RefObject<HTMLDivElement>}
        className="absolute inset-0 overflow-hidden z-0"
        style={{ touchAction: 'none' }}
      >
        <BloomProvider id="hero-bloom" intensity={glowIntensity} threshold={0.3}>
          <GlitchRandomizer
            contentOffsetYRef={offsetRef}
            intervalMs={2000}
            smoothing={0.98}
            masterIntensity={0.5}
            scrambleTriggerRangeMs={scrambleTriggerRangeMs}
            scrambleDurationRangeMs={scrambleDurationRangeMs}
            onEffectsUpdate={(eff) => {
              if (eff.crt?.glowIntensity !== undefined) {
                setGlowIntensity(eff.crt.glowIntensity);
              }
            }}
            ranges={{
              'crt.rareGlitchIntensity': [0.0, 0.4],
              'crt.jitterIntensity': [0.01, 0.1],
              'crt.interferenceIntensity': [0.05, 0.3],
              'crt.brightness': [1.1, 1.3],
              'crt.scanningBandIntensity': [0.1, 0.5],
              'crt.glowIntensity': [5.0, 10.0]
            }}
            baseEffects={{
              crt: {
                enabled: true,
                baseColor: [0.26, 0.26, 0.26],
                zoom: 1.3,
                scanlineIntensity: 0.5,
                curvature: 6.0,
                brightness: 1.2,
                phosphorIntensity: 0.5,
                vignetteIntensity: 0.7,
                scanningBandIntensity: 0.5,
                rareGlitchIntensity: 0.3,
                interferenceIntensity: 0.2,
                jitterIntensity: 0.1,
              }
            }}
          >
            <GlitchGL
              contentSegments={contentSegments}
              scrambleMode="auto"
              scrambleOptions={{
                flickerCountRangeStart: [6, 8],
                flickerCountRangeEnd: [0, 2],
                refreshIntervalRangeMs: [40, 180],
              }}
              className="w-full h-full opacity-80"
            />
          </GlitchRandomizer>
        </BloomProvider>
      </div>

      {/* Global Scanline Overlay */}
      <div className="absolute inset-0 pointer-events-none z-50 bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.1)_50%)] bg-[length:100%_4px] opacity-20" />
    </main>
  );
}
