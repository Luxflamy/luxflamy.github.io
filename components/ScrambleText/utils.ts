import { DEFAULT_SCRAMBLE_CHARS } from '@/lib/scramblePresets';
import type { DecodeOrder, ScrambleMode, ScrambleOptions } from './types';

/** 从字符池中取随机字符 */
function pickRandomChar(chars: string): string {
  if (!chars.length) return '?';
  return chars[Math.floor(Math.random() * chars.length)];
}

/** 预计算并缓存 center-out 顺序（相同 length 可复用） */
const centerOutCache = new Map<number, number[]>();
function getCenterOutOrder(length: number): number[] {
  if (!centerOutCache.has(length)) {
    const mid = (length - 1) / 2;
    const indices = Array.from({ length }, (_, i) => i);
    centerOutCache.set(
      length,
      indices.sort((a, b) => Math.abs(a - mid) - Math.abs(b - mid))
    );
  }
  return centerOutCache.get(length)!;
}

/** 生成解码顺序索引数组 */
export function getDecodeOrder(
  length: number,
  order: DecodeOrder = 'sequential'
): number[] {
  const indices = Array.from({ length }, (_, i) => i);
  if (order === 'sequential') return indices;
  if (order === 'random') {
    for (let i = length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [indices[i], indices[j]] = [indices[j], indices[i]];
    }
    return indices;
  }
  if (order === 'center-out') return getCenterOutOrder(length);
  return indices;
}

/**
 * 根据目标文本、模式、进度和配置，计算当前帧应显示的字符串
 */
export function getScrambledText(
  targetText: string,
  mode: ScrambleMode,
  progress: number = 0,
  options: ScrambleOptions = {},
  decodeOrderIndices?: number[]
): string {
  const chars = options.scrambleChars ?? DEFAULT_SCRAMBLE_CHARS;
  const preserveSpaces = options.preserveSpaces ?? true;
  const len = targetText.length;
  if (len === 0) return '';

  if (mode === 'idle') return targetText;

  const isSpace = (i: number) => targetText[i] === ' ' || targetText[i] === '\u00A0';
  const shouldPreserve = (i: number) => preserveSpaces && isSpace(i);

  if (mode === 'scramble') {
    return Array.from(targetText, (c, i) =>
      shouldPreserve(i) ? c : pickRandomChar(chars)
    ).join('');
  }

  if (mode === 'decode') {
    const numDecoded = Math.min(len, Math.floor(progress * len));
    const order =
      decodeOrderIndices ?? getDecodeOrder(len, options.decodeOrder);
    const decodedSet = new Set(order.slice(0, numDecoded));
    return Array.from(targetText, (c, i) =>
      shouldPreserve(i) || decodedSet.has(i) ? c : pickRandomChar(chars)
    ).join('');
  }

  if (mode === 'encode') {
    const numEncoded = Math.min(len, Math.floor((1 - progress) * len));
    const order =
      decodeOrderIndices ?? getDecodeOrder(len, options.decodeOrder);
    const encodedSet = new Set(order.slice(0, numEncoded));
    return Array.from(targetText, (c, i) =>
      shouldPreserve(i) || !encodedSet.has(i) ? c : pickRandomChar(chars)
    ).join('');
  }

  if (mode === 'flicker') {
    const prob = options.flickerProbability ?? 0.1;
    return Array.from(targetText, (c, i) =>
      shouldPreserve(i) || Math.random() >= prob ? c : pickRandomChar(chars)
    ).join('');
  }

  return targetText;
}
