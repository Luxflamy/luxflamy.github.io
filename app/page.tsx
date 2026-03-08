'use client';

import React, { useState, useEffect, useMemo } from 'react';
import GlitchGL from '@/components/GlitchGL';
import { GlitchRandomizer } from '@/components/GlitchRandomizer';
import { BloomProvider } from '@/components/Bloom';
import { useWheelScrollOffset } from '@/hooks/useWheelScrollOffset';
import { buildContentSegments } from '@/lib/contentSegments';
import type { CardData } from '@/lib/cardData';

const SCRAMBLE_TRIGGER_MS: [number, number] = [10000, 20000];
const SCRAMBLE_DURATION_MS: [number, number] = [2000, 4000];

/** plan3 完整文案（标题 + 自我介绍 + 技能 + 项目），占位由下方卡片承接 */
const HERO_COPY = `Database Developer

Hi, I'm XiangyiLi, a database and data developer passionate about building scalable data systems.

I work with SQL, Python, and machine learning to turn complex data into useful insights and reliable infrastructure.

My projects focus on data architecture, analytics platforms, and large-scale data processing.

— 如下 —`;

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

/** 根据行数 + 卡片数估算可滚动范围 */
const HERO_LINE_COUNT = HERO_COPY.split('\n').length;

/** plan4 可复用卡片数据（经历、技能、项目等） */
const CARD_ITEMS: CardData[] = [
  {
    title: 'Experience',
    subtitle: 'Database Developer · 2022 – Present',
    description: 'Building scalable data pipelines and analytics platforms.\nOptimizing queries and data architecture for large-scale systems.',
    tags: ['SQL', 'Python', 'ETL', 'Data Modeling'],
    variant: 'experience',
  },
  {
    title: 'Skills',
    subtitle: 'Core Technologies',
    description: 'Proficient in relational databases, data warehousing, and machine learning pipelines.',
    tags: ['SQL', 'Python', 'Spark', 'Airflow', 'dbt'],
    variant: 'skill',
  },
  {
    title: 'Projects',
    subtitle: 'Data & Analytics',
    description: 'End-to-end data solutions: from ingestion to dashboards.',
    tags: ['Data Architecture', 'Analytics', 'ETL'],
    variant: 'project',
  },
];

const SCROLL_CLAMP_PX = Math.max(500, Math.round(HERO_LINE_COUNT * 90 + CARD_ITEMS.length * 100));

export default function Home() {
  const [mounted, setMounted] = useState(false);
  const [glowIntensity, setGlowIntensity] = useState(4);
  const scrambleTriggerRangeMs = useMemo(() => SCRAMBLE_TRIGGER_MS, []);
  const scrambleDurationRangeMs = useMemo(() => SCRAMBLE_DURATION_MS, []);
  const contentSegments = useMemo(() => buildContentSegments(HERO_COPY, HERO_KEY_TERMS), []);
  const { containerRef, offsetRef } = useWheelScrollOffset({
    clampPx: SCROLL_CLAMP_PX,
    sensitivity: 0.03,
    inertia: true,
    decayFactor: 0.96,
    decayThreshold: 0.15,
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
            contentSegments={contentSegments}
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
              cards={CARD_ITEMS}
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
