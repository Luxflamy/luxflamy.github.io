'use client';

import GlitchGL from '@/components/GlitchGL';
import { ThemeToggle } from '@/components/ThemeToggle';

const SAMPLE_IMAGE = 'https://picsum.photos/seed/luxflamy/800/500';

export default function Home() {
  return (
    <main className="min-h-screen">
      {/* 顶部：主题切换 */}
      <header className="sticky top-0 z-10 flex justify-end border-b border-gray-200 bg-white/80 p-4 backdrop-blur dark:border-gray-700 dark:bg-gray-900/80">
        <ThemeToggle />
      </header>

      {/* 主内容：GlitchGL 组件 */}
      <section className="mx-auto max-w-4xl px-4 py-8">
        <h1 className="mb-6 text-center text-2xl font-semibold text-gray-800 dark:text-gray-200">
          主页
        </h1>
        <div className="overflow-hidden rounded-xl border border-gray-200 shadow-lg dark:border-gray-700">
          <GlitchGL
            src={SAMPLE_IMAGE}
            className="aspect-video w-full"
            effects={{
              crt: {
                enabled: true,
                scanlineIntensity: 0.25,
                scanlineCount: 360,
                curvature: 2,
                brightness: 1.05,
              },
              pixelation: {
                enabled: false,
              },
            }}
            interaction={{
              enabled: true,
              radius: 120,
              intensity: 0.8,
            }}
          />
        </div>
        <p className="mt-4 text-center text-sm text-gray-500 dark:text-gray-400">
          使用 GlitchGL 组件 · 鼠标移入可交互
        </p>
      </section>
    </main>
  );
}
