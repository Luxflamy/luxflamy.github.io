'use client';

import React, { useState, useEffect, useRef, useMemo } from 'react';
import type { ScrambleTextProps, ScrambleMode } from './types';
import { getScrambledText, getDecodeOrder } from './utils';
import { DEFAULT_SCRAMBLE_CHARS } from '@/lib/scramblePresets';

const DEFAULT_REFRESH = 50;

/**
 * 动态乱码文字组件：根据目标文本与模式输出当前帧显示的字符串。
 * 可渲染为 DOM（as="span"|"div"），或仅通过 onTextChange 回传字符串供 GlitchGL 等使用。
 */
const ScrambleText: React.FC<ScrambleTextProps> = ({
  targetText,
  mode,
  progress = 0,
  options = {},
  onTextChange,
  as: Tag = 'span',
  className = '',
}) => {
  const [displayText, setDisplayText] = useState(targetText);
  const decodeOrderRef = useRef<number[] | null>(null);
  const opts = useMemo(
    () => ({
      scrambleChars: options.scrambleChars ?? DEFAULT_SCRAMBLE_CHARS,
      refreshInterval: options.refreshInterval ?? DEFAULT_REFRESH,
      flickerProbability: options.flickerProbability ?? 0.1,
      decodeOrder: options.decodeOrder ?? 'sequential',
      preserveSpaces: options.preserveSpaces ?? true,
    }),
    [options.scrambleChars, options.refreshInterval, options.flickerProbability, options.decodeOrder, options.preserveSpaces]
  );

  const needsTick = mode === 'scramble' || mode === 'decode' || mode === 'encode' || mode === 'flicker';
  const progressOrModeRef = useRef({ progress, mode });
  progressOrModeRef.current = { progress, mode };

  useEffect(() => {
    if (!needsTick) {
      setDisplayText(targetText);
      onTextChange?.(targetText);
      return;
    }

    if (mode === 'decode' || mode === 'encode') {
      if (!decodeOrderRef.current || decodeOrderRef.current.length !== targetText.length) {
        decodeOrderRef.current =
          opts.decodeOrder === 'center-out'
            ? (() => {
                const mid = (targetText.length - 1) / 2;
                return Array.from({ length: targetText.length }, (_, i) => i).sort(
                  (a, b) => Math.abs(a - mid) - Math.abs(b - mid)
                );
              })()
            : getDecodeOrder(targetText.length, opts.decodeOrder);
      }
    }

    const tick = () => {
      const { progress: p, mode: m } = progressOrModeRef.current;
      const next = getScrambledText(
        targetText,
        m,
        p,
        opts,
        decodeOrderRef.current ?? undefined
      );
      setDisplayText(next);
      onTextChange?.(next);
    };

    tick();
    const id = setInterval(tick, opts.refreshInterval);
    return () => clearInterval(id);
  }, [targetText, mode, progress, needsTick, opts.refreshInterval, opts.decodeOrder, opts.flickerProbability, opts.scrambleChars, opts.preserveSpaces, onTextChange]);

  useEffect(() => {
    if (mode === 'idle') {
      setDisplayText(targetText);
      onTextChange?.(targetText);
    }
  }, [mode, targetText, onTextChange]);

  return <Tag className={className}>{displayText}</Tag>;
};

export default ScrambleText;
export type { ScrambleTextProps, ScrambleMode, ScrambleOptions } from './types';
export { getScrambledText, getDecodeOrder } from './utils';
