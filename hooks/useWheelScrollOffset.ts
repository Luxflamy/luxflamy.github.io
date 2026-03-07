'use client';

import { useRef, useLayoutEffect } from 'react';

export interface UseWheelScrollOffsetOptions {
  sensitivity?: number;
  clampPx?: number;
  inertia?: boolean;
  decayFactor?: number;
  decayThreshold?: number;
}

const DEFAULT_OPTIONS: Required<UseWheelScrollOffsetOptions> = {
  sensitivity: 0.4,
  clampPx: 80,
  inertia: true,
  decayFactor: 0.92,
  decayThreshold: 0.5,
};

/**
 * 滚轮驱动垂直偏移（仅 ref，不触发重渲染）。用于「电视内文字上下移动」等场景。
 * 返回 containerRef（挂视口收 wheel）与 offsetRef（当前偏移 px，由 GlitchGL 等读取）。
 */
export function useWheelScrollOffset(
  options: UseWheelScrollOffsetOptions = {}
): {
  containerRef: React.RefObject<HTMLDivElement>;
  offsetRef: React.RefObject<number>;
} {
  const opts = { ...DEFAULT_OPTIONS, ...options };
  const containerRef = useRef<HTMLDivElement | null>(null);
  const offsetRef = useRef<number>(0);
  const rafIdRef = useRef<number | null>(null);
  const rafScheduledRef = useRef(false);

  useLayoutEffect(() => {
    const apply = () => {
      if (opts.inertia) {
        offsetRef.current *= opts.decayFactor;
        if (Math.abs(offsetRef.current) >= opts.decayThreshold) {
          rafIdRef.current = requestAnimationFrame(apply);
          return;
        }
        offsetRef.current = 0;
      }
      rafScheduledRef.current = false;
      rafIdRef.current = null;
    };

    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      const delta = e.deltaY * opts.sensitivity;
      offsetRef.current = Math.max(
        -opts.clampPx,
        Math.min(opts.clampPx, offsetRef.current + delta)
      );
      if (!rafScheduledRef.current) {
        rafScheduledRef.current = true;
        rafIdRef.current = requestAnimationFrame(apply);
      }
    };

    // 在 window 上监听，避免首页 mounted 前 containerRef 未挂载导致监听未添加
    window.addEventListener('wheel', onWheel, { passive: false });

    return () => {
      window.removeEventListener('wheel', onWheel);
      if (rafIdRef.current != null) {
        cancelAnimationFrame(rafIdRef.current);
        rafIdRef.current = null;
      }
      rafScheduledRef.current = false;
    };
  }, [
    opts.sensitivity,
    opts.clampPx,
    opts.inertia,
    opts.decayFactor,
    opts.decayThreshold,
  ]);

  return { containerRef, offsetRef };
}
