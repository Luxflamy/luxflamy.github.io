/**
 * 可复用卡片数据结构，用于经历、技能、项目等（plan4）。
 * 绘制在 GlitchGL 画布内，与文案共处同一纹理，保留完整复古电视效果。
 */

export type CardVariant = 'experience' | 'skill' | 'project' | 'default';

export interface CardData {
  title: string;
  subtitle?: string;
  description?: string;
  /** 悬停 1s 后展示的详细信息（多行），无则用 description 或 title+subtitle 作为 fallback */
  details?: string;
  tags?: string[];
  href?: string;
  variant?: CardVariant;
}

export type CardPhase = 'idle' | 'scramble' | 'detail' | 'exiting';

export interface DrawCardsOptions {
  ctx: CanvasRenderingContext2D;
  cards: CardData[];
  /** 第一张卡片顶部的 Y（由调用方根据文案结束位置 + 间距计算，已含 offsetY） */
  startY: number;
  width: number;
  marginH: number;
  baseFontSize: number;
  lineHeight: number;
  /** 当前悬停的卡片索引，该卡边框会画得更亮更粗（辉光在纹理内，经完整 CRT 管线） */
  hoveredCardIndex?: number;
  /** 每张卡当前阶段：idle / scramble(0~1.2s) / detail(≥1.2s) / exiting，与 cards 一一一对应 */
  cardPhases?: CardPhase[];
  /** 乱码阶段时，所有卡的当前乱码字符串数组（与 cards 一一对应） */
  cardTransitionTexts?: string[];
}

/**
 * 在画布上绘制卡片列表，返回绘制后的总高度（用于滚动范围估算）。
 */
export function drawCardsOnCanvas(opts: DrawCardsOptions): number {
  const { ctx, cards, startY, width, marginH, baseFontSize, lineHeight, hoveredCardIndex, cardPhases, cardTransitionTexts } = opts;
  if (!cards.length) return 0;

  const cardFontSize = baseFontSize * 0.85;
  const cardLineHeight = lineHeight * 0.9;
  const cardPadding = baseFontSize * 0.6;
  const cardGap = lineHeight * 0.8;
  const tagFontSize = baseFontSize * 0.65;
  const detailMaxLines = 5;

  let y = startY;

  cards.forEach((card, i) => {
    const cardW = width - 2 * marginH;
    const cardX = marginH;
    const phase = cardPhases?.[i] ?? 'idle';

    ctx.save();
    ctx.textAlign = 'left';
    ctx.textBaseline = 'top';

    const titleH = cardLineHeight;
    const subtitleH = card.subtitle ? cardLineHeight * 0.9 : 0;
    const descLines = card.description ? card.description.split(/\n/).length : 0;
    const descH = descLines * cardLineHeight * 0.85;
    const tagsH = card.tags?.length ? tagFontSize * 1.4 : 0;
    const detailLines = (phase === 'detail' || phase === 'scramble' || phase === 'exiting') ? Math.min(detailMaxLines, (card.details ?? card.description ?? '').split(/\n/).length || 1) : 0;
    const detailH = detailLines * cardLineHeight * 0.85;
    const innerH = (phase === 'detail' || phase === 'scramble' || phase === 'exiting')
      ? detailH + cardPadding * 2
      : titleH + subtitleH + descH + tagsH + cardPadding * 2;

    const isHovered = hoveredCardIndex === i;
    ctx.strokeStyle = isHovered ? 'rgba(255,255,255,0.85)' : 'rgba(255,255,255,0.4)';
    ctx.lineWidth = isHovered ? 2.5 : 1;
    ctx.fillStyle = 'rgba(0,0,0,0.35)';
    ctx.strokeRect(cardX, y, cardW, innerH);
    ctx.fillRect(cardX, y, cardW, innerH);

    let innerY = y + cardPadding;
    ctx.fillStyle = 'white';

    const transitionText = cardTransitionTexts?.[i];
    if ((phase === 'scramble' || phase === 'exiting') && transitionText) {
      // 使用多行过渡文本
      const lines = transitionText.split(/\n/);
      ctx.font = `400 ${cardFontSize * 0.75}px system-ui, -apple-system, sans-serif`;
      ctx.fillStyle = 'rgba(255,255,255,0.9)';
      lines.forEach((line) => {
        ctx.fillText(line.trim(), cardX + cardPadding, innerY, cardW - cardPadding * 2);
        innerY += cardLineHeight * 0.85;
      });
    } else if (phase === 'detail') {
      const detailContent = card.details ?? card.description ?? `${card.title}${card.subtitle ? ' · ' + card.subtitle : ''}`;
      const lines = detailContent.split(/\n/).slice(0, detailMaxLines);
      ctx.font = `400 ${cardFontSize * 0.75}px system-ui, -apple-system, sans-serif`;
      ctx.fillStyle = 'rgba(255,255,255,0.9)';
      lines.forEach((line) => {
        ctx.fillText(line.trim(), cardX + cardPadding, innerY, cardW - cardPadding * 2);
        innerY += cardLineHeight * 0.85;
      });
    } else {
      ctx.font = `700 ${cardFontSize}px system-ui, -apple-system, sans-serif`;
      ctx.fillText(card.title, cardX + cardPadding, innerY, cardW - cardPadding * 2);
      innerY += titleH;

      if (card.subtitle) {
        ctx.font = `400 ${cardFontSize * 0.8}px system-ui, -apple-system, sans-serif`;
        ctx.fillStyle = 'rgba(255,255,255,0.85)';
        ctx.fillText(card.subtitle, cardX + cardPadding, innerY, cardW - cardPadding * 2);
        innerY += subtitleH;
      }

      if (card.description) {
        ctx.font = `400 ${cardFontSize * 0.75}px system-ui, -apple-system, sans-serif`;
        ctx.fillStyle = 'rgba(255,255,255,0.9)';
        card.description.split(/\n/).forEach((line) => {
          ctx.fillText(line.trim(), cardX + cardPadding, innerY, cardW - cardPadding * 2);
          innerY += cardLineHeight * 0.85;
        });
      }

      if (card.tags?.length) {
        innerY += cardLineHeight * 0.3;
        ctx.font = `400 ${tagFontSize}px system-ui, -apple-system, sans-serif`;
        ctx.fillStyle = 'rgba(255,255,255,0.7)';
        ctx.fillText(card.tags.join(' · '), cardX + cardPadding, innerY, cardW - cardPadding * 2);
      }
    }

    ctx.restore();
    y += innerH + cardGap;
  });

  return y - startY;
}

/** 与 drawCardsOnCanvas 一致的布局参数，用于计算卡片矩形（hit-test / 辉光中心） */
export interface CardRectsOptions {
  width: number;
  height: number;
  offsetY: number;
  /** 文案行数（与 createTextTexture 中 lines.length 一致） */
  lineCount: number;
  cards: CardData[];
  /** 每张卡阶段，用于 detail 时计算正确高度 */
  cardPhases?: CardPhase[];
}

export interface CardRect {
  x: number;
  y: number;
  width: number;
  height: number;
}

/**
 * 计算每张卡片在画布上的包围矩形（与 drawCardsOnCanvas 同一套 layout），用于悬停判定与辉光中心。
 * 坐标系：画布 2D，原点左上，y 向下。
 */
const DETAIL_MAX_LINES = 5;

export function getCardRects(opts: CardRectsOptions): CardRect[] {
  const { width, height, offsetY, lineCount, cards, cardPhases } = opts;
  if (!cards.length) return [];

  const marginV = height * 0.06;
  const marginH = width * 0.08;
  const contentW = width - 2 * marginH;
  const contentH = height - 2 * marginV;
  const baseFontSize = Math.min(contentW * 0.032, contentH * 0.065);
  const lineHeight = baseFontSize * 1.5;

  const textBottomY = marginV + offsetY + lineCount * lineHeight + lineHeight * 0.8;

  const cardFontSize = baseFontSize * 0.85;
  const cardLineHeight = lineHeight * 0.9;
  const cardPadding = baseFontSize * 0.6;
  const cardGap = lineHeight * 0.8;
  const tagFontSize = baseFontSize * 0.65;
  const cardW = width - 2 * marginH;
  const cardX = marginH;

  const rects: CardRect[] = [];
  let y = textBottomY;

  cards.forEach((card, i) => {
    const phase = cardPhases?.[i] ?? 'idle';
    const titleH = cardLineHeight;
    const subtitleH = card.subtitle ? cardLineHeight * 0.9 : 0;
    const descLines = card.description ? card.description.split(/\n/).length : 0;
    const descH = descLines * cardLineHeight * 0.85;
    const tagsH = card.tags?.length ? tagFontSize * 1.4 : 0;
    const detailLines = (phase === 'detail' || phase === 'scramble' || phase === 'exiting') ? Math.min(DETAIL_MAX_LINES, (card.details ?? card.description ?? '').split(/\n/).length || 1) : 0;
    const detailH = detailLines * cardLineHeight * 0.85;
    const innerH = (phase === 'detail' || phase === 'scramble' || phase === 'exiting')
      ? detailH + cardPadding * 2
      : titleH + subtitleH + descH + tagsH + cardPadding * 2;

    rects.push({ x: cardX, y, width: cardW, height: innerH });
    y += innerH + cardGap;
  });

  return rects;
}
