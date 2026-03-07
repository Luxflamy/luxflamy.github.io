/** 乱码模式 */
export type ScrambleMode = 'idle' | 'scramble' | 'decode' | 'encode' | 'flicker';

/** 解码顺序 */
export type DecodeOrder = 'sequential' | 'random' | 'center-out';

export type RefreshIntervalRangeMs = [number, number];

/** flicker 模式下每次参与乱码的字符个数范围 [min, max]，与 flickerProbability 二选一 */
export type FlickerCountRange = [number, number];

export interface ScrambleOptions {
  /** 乱码字符集 */
  scrambleChars?: string;
  /** 刷新间隔（ms），与 refreshIntervalRangeMs 二选一 */
  refreshInterval?: number;
  /** 刷新间隔范围 [min, max] ms，每次 tick 后随机取延迟，节奏时快时慢 */
  refreshIntervalRangeMs?: RefreshIntervalRangeMs;
  /** flicker 模式下每字符每帧乱码概率 0-1，与 flickerCountRange 二选一 */
  flickerProbability?: number;
  /** flicker 模式下每次仅固定个数位置乱码 [min, max]，如 [2,3] 表示每帧 2～3 个字符在变 */
  flickerCountRange?: FlickerCountRange;
  /** 段初参与乱码的个数范围，与 flickerCountRangeEnd、burstProgress 一起实现「从多到少逐步确定」 */
  flickerCountRangeStart?: FlickerCountRange;
  /** 段末参与乱码的个数范围 */
  flickerCountRangeEnd?: FlickerCountRange;
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
