/**
 * 将完整文案按「重点词汇」拆成静态/可乱码片段，供 GlitchGL 仅对重点词做乱码。
 * 高复用：任意文案 + 关键词列表均可复用。
 */

import { getScrambledText } from '@/components/ScrambleText/utils';
import type { ScrambleMode, ScrambleOptions } from '@/components/ScrambleText/types';

export type ContentSegment = { type: 'static'; text: string } | { type: 'scramble'; text: string };

/**
 * 按 keyTerms 顺序把 fullCopy 拆成交替的 static / scramble 片段。
 * 仅 keyTerms 中的词会标记为 scramble，其余为 static。
 */
export function buildContentSegments(fullCopy: string, keyTerms: string[]): ContentSegment[] {
  const segments: ContentSegment[] = [];
  let rest = fullCopy;
  for (const term of keyTerms) {
    const idx = rest.indexOf(term);
    if (idx < 0) continue;
    if (idx > 0) segments.push({ type: 'static', text: rest.slice(0, idx) });
    segments.push({ type: 'scramble', text: term });
    rest = rest.slice(idx + term.length);
  }
  if (rest.length > 0) segments.push({ type: 'static', text: rest });
  return segments;
}

/**
 * 根据当前乱码状态生成整段显示文案（静态片段原样，可乱码片段用 getScrambledText）。
 * activeScrambleIndices：本次参与乱码的片段下标；不传则所有 type=scramble 都乱码；传则仅这些下标做乱码，其余 scramble 显示原文。
 */
export function buildFullTextFromSegments(
  segments: ContentSegment[],
  mode: ScrambleMode,
  progress: number,
  options: ScrambleOptions,
  burstProgress?: number,
  activeScrambleIndices?: Set<number> | number[] | null
): string {
  const activeSet =
    activeScrambleIndices == null
      ? null
      : Array.isArray(activeScrambleIndices)
        ? new Set(activeScrambleIndices)
        : activeScrambleIndices;
  return segments
    .map((seg, i) => {
      if (seg.type === 'static') return seg.text;
      if (activeSet !== null && !activeSet.has(i)) return seg.text;
      return getScrambledText(seg.text, mode, progress, options, undefined, burstProgress);
    })
    .join('');
}
