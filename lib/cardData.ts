/**
 * 可复用卡片数据结构，用于经历、技能、项目等（plan4）。
 * 绘制在 GlitchGL 画布内，与文案共处同一纹理，保留完整复古电视效果。
 */

export type CardVariant = 'experience' | 'skill' | 'project' | 'default';

export interface CardData {
  title: string;
  subtitle?: string;
  description?: string;
  tags?: string[];
  href?: string;
  variant?: CardVariant;
}

export interface DrawCardsOptions {
  ctx: CanvasRenderingContext2D;
  cards: CardData[];
  /** 第一张卡片顶部的 Y（由调用方根据文案结束位置 + 间距计算，已含 offsetY） */
  startY: number;
  width: number;
  marginH: number;
  baseFontSize: number;
  lineHeight: number;
}

/**
 * 在画布上绘制卡片列表，返回绘制后的总高度（用于滚动范围估算）。
 */
export function drawCardsOnCanvas(opts: DrawCardsOptions): number {
  const { ctx, cards, startY, width, marginH, baseFontSize, lineHeight } = opts;
  if (!cards.length) return 0;

  const cardFontSize = baseFontSize * 0.85;
  const cardLineHeight = lineHeight * 0.9;
  const cardPadding = baseFontSize * 0.6;
  const cardGap = lineHeight * 0.8;
  const tagFontSize = baseFontSize * 0.65;

  let y = startY;

  cards.forEach((card) => {
    const cardW = width - 2 * marginH;
    const cardX = marginH;

    ctx.save();
    ctx.textAlign = 'left';
    ctx.textBaseline = 'top';

    const titleH = cardLineHeight;
    const subtitleH = card.subtitle ? cardLineHeight * 0.9 : 0;
    const descLines = card.description ? card.description.split(/\n/).length : 0;
    const descH = descLines * cardLineHeight * 0.85;
    const tagsH = card.tags?.length ? tagFontSize * 1.4 : 0;
    const innerH = titleH + subtitleH + descH + tagsH + cardPadding * 2;

    ctx.strokeStyle = 'rgba(255,255,255,0.4)';
    ctx.lineWidth = 1;
    ctx.fillStyle = 'rgba(0,0,0,0.35)';
    ctx.strokeRect(cardX, y, cardW, innerH);
    ctx.fillRect(cardX, y, cardW, innerH);

    let innerY = y + cardPadding;
    ctx.fillStyle = 'white';
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
      innerY += tagFontSize * 1.2;
    }

    ctx.restore();
    y += innerH + cardGap;
  });

  return y - startY;
}
