/** 乱码模式 */
export type ScrambleMode = 'idle' | 'scramble' | 'decode' | 'encode' | 'flicker';

/** 解码顺序 */
export type DecodeOrder = 'sequential' | 'random' | 'center-out';

export interface ScrambleOptions {
  /** 乱码字符集 */
  scrambleChars?: string;
  /** 刷新间隔（ms） */
  refreshInterval?: number;
  /** flicker 模式下每字符每帧乱码概率 0-1 */
  flickerProbability?: number;
  /** 解码/编码顺序 */
  decodeOrder?: DecodeOrder;
  /** 空格是否参与乱码（false 则空格始终保留） */
  preserveSpaces?: boolean;
}

export interface ScrambleTextProps {
  /** 目标文本 */
  targetText: string;
  /** 乱码模式 */
  mode: ScrambleMode;
  /** 解码/编码进度 0-1，仅 decode/encode 使用 */
  progress?: number;
  /** 配置项 */
  options?: ScrambleOptions;
  /** 当前显示字符串变化时回调（用于 GlitchGL 纹理等） */
  onTextChange?: (displayText: string) => void;
  /** 渲染为 DOM 时使用的标签 */
  as?: 'span' | 'div';
  /** 渲染为 DOM 时的 className */
  className?: string;
}
