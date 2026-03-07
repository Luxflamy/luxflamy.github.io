/**
 * 乱码字符集与预设配置
 * 供 ScrambleText 与 GlitchGL 复用，保证全站乱码风格一致
 */

/** 默认乱码字符池：ASCII 特殊符号 + 数字 + 字母 + Unicode 块状符号 */
export const DEFAULT_SCRAMBLE_CHARS =
  '!@#$%^&*()_+-=[]{}|;:,.<>?/~' +
  '0123456789' +
  'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz' +
  '█▓▒░▄▀■□▪▫◆◇●○◘◙☺☻';

/** 空格保留：解码/编码时是否将空格视为可乱码（false 则空格始终为空格） */
export const PRESET_SPACE_PRESERVED = true;

export interface ScramblePreset {
  scrambleChars?: string;
  refreshInterval?: number;
  flickerProbability?: number;
  decodeOrder?: 'sequential' | 'random' | 'center-out';
}

/** 首页 HELLO WORLD 自动随机乱码预设 */
export const PRESET_HERO_FLICKER: ScramblePreset = {
  scrambleChars: DEFAULT_SCRAMBLE_CHARS,
  refreshInterval: 50,
  flickerProbability: 0.08,
  decodeOrder: 'sequential',
};

/** 转场解码预设 */
export const PRESET_TRANSITION_DECODE: ScramblePreset = {
  scrambleChars: DEFAULT_SCRAMBLE_CHARS,
  refreshInterval: 30,
  decodeOrder: 'sequential',
};

/** Hover 乱码预设 */
export const PRESET_HOVER_SCRAMBLE: ScramblePreset = {
  scrambleChars: DEFAULT_SCRAMBLE_CHARS,
  refreshInterval: 30,
  flickerProbability: 0.15,
};
