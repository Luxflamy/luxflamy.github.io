'use client';

import React, { useRef, useEffect, useState } from 'react';
import { GlitchEffects, GlitchInteraction, GlitchOptions } from './types';
import { VERTEX_SHADER, FRAGMENT_SHADER_COMBINED } from '@/lib/glitch-shaders';
import { getScrambledText, getDecodeOrder, getTransitionText } from '@/components/ScrambleText/utils';
import type { ScrambleMode, ScrambleOptions } from '@/components/ScrambleText/types';
import { PRESET_HERO_FLICKER } from '@/lib/scramblePresets';
import { buildFullTextFromSegments } from '@/lib/contentSegments';
import type { ContentSegment } from '@/lib/contentSegments';
import { drawCardsOnCanvas, getCardRects } from '@/lib/cardData';
import type { CardData, CardPhase } from '@/lib/cardData';

const randomBetween = (min: number, max: number) => Math.random() * (max - min) + min;

interface GlitchGLProps {
    src?: string;
    text?: string;
    effects?: GlitchEffects;
    interaction?: GlitchInteraction;
    options?: GlitchOptions;
    className?: string;
    /** 启用自动乱码时：先 decode 再 flicker，不传则仅用 text 静态绘制 */
    scrambleMode?: 'off' | 'auto';
    /** 乱码配置，scrambleMode='auto' 时生效 */
    scrambleOptions?: ScrambleOptions;
    /** 由 GlitchRandomizer 注入：为 false 时显示正常文字，为 true 时运行乱码；不传则保持原逻辑（解码后持续 flicker） */
    scrambleActive?: boolean;
    /** 本段乱码开始时间戳，与 scrambleBurstDurationMs 一起算 burstProgress */
    scrambleBurstStartedAt?: number;
    /** 本段乱码持续 ms */
    scrambleBurstDurationMs?: number;
    /** 电视内文字垂直偏移（px），由 useWheelScrollOffset 的 offsetRef 传入，正数=文字上移 */
    contentOffsetYRef?: React.RefObject<number>;
    /** 分段内容：仅 type=scramble 的片段参与乱码，与 text 二选一 */
    contentSegments?: ContentSegment[];
    /** 本次 burst 参与乱码的片段下标（由 GlitchRandomizer 注入），不传则全部 scramble 都乱码 */
    activeScrambleIndices?: number[];
    /** 文案下方绘制的卡片（与文案共处同一画布，保留完整 CRT 效果） */
    cards?: CardData[];
}

const DECODE_DURATION_MS = 2000;

const GlitchGL: React.FC<GlitchGLProps> = ({
    src,
    text,
    effects = {},
    interaction = {},
    className = '',
    scrambleMode = 'off',
    scrambleOptions = {},
    scrambleActive,
    scrambleBurstStartedAt = 0,
    scrambleBurstDurationMs = 1,
    contentOffsetYRef,
    contentSegments,
    activeScrambleIndices,
    cards = [],
}) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const containerRef = useRef<HTMLDivElement>(null);
    const [isLoaded, setIsLoaded] = useState(false);
    const glRef = useRef<WebGLRenderingContext | null>(null);
    const programRef = useRef<WebGLProgram | null>(null);
    const textureRef = useRef<WebGLTexture | null>(null);
    const frameIdRef = useRef<number>(0);
    const mouseRef = useRef({ x: 0, y: 0 });
    const displayTextRef = useRef<string>(text ?? '');
    const lastDisplayTextRef = useRef<string>('');
    const decodeOrderRef = useRef<number[] | null>(null);
    const startTimeRef = useRef<number>(0);
    const scrambleOptionsRef = useRef(scrambleOptions);
    scrambleOptionsRef.current = scrambleOptions;
    const scrambleActiveRef = useRef(scrambleActive);
    scrambleActiveRef.current = scrambleActive;
    /** 由父组件传入 scrambleActive 时只做 flicker，不做 2s 解码 */
    const useScrambleScheduleRef = useRef(scrambleActive !== undefined);
    useScrambleScheduleRef.current = scrambleActive !== undefined;
    const burstStartedAtRef = useRef(scrambleBurstStartedAt);
    const burstDurationMsRef = useRef(scrambleBurstDurationMs);
    burstStartedAtRef.current = scrambleBurstStartedAt;
    burstDurationMsRef.current = scrambleBurstDurationMs;

    const lastOffsetYRef = useRef(0);
    const hoveredCardIndexRef = useRef<number>(-1);
    const lastHoveredCardIndexRef = useRef<number>(-1);
    const lastFrameTimeRef = useRef<number>(0);
    // 记录每张卡的实时进度 (0.0 到 1.0)
    const cardProgressRef = useRef<number[]>([]);
    // 记录每张卡的目标进度 (0.0 或 1.0)
    const cardTargetProgressRef = useRef<number[]>([]);
    const cardTransitionTextsRef = useRef<string[]>([]);
    const lastCardTransitionUpdateRef = useRef<number>(0);
    const cardPhasesRef = useRef<CardPhase[]>([]);
    const lastCardPhasesRef = useRef<CardPhase[]>([]);

    const createTextTexture = (gl: WebGLRenderingContext, text: string, width: number, height: number, offsetY: number = 0) => {
        const textCanvas = document.createElement('canvas');
        textCanvas.width = width;
        textCanvas.height = height;
        const ctx = textCanvas.getContext('2d');
        if (!ctx) return;

        ctx.clearRect(0, 0, width, height);
        ctx.textAlign = 'center';
        ctx.textBaseline = 'top';

        const marginV = height * 0.06;
        const marginH = width * 0.08;
        const contentW = width - 2 * marginH;
        const contentH = height - 2 * marginV;
        const fontSize = Math.min(contentW * 0.032, contentH * 0.065);
        const lineHeight = fontSize * 1.5;
        ctx.font = `900 ${fontSize}px system-ui, -apple-system, sans-serif`;
        ctx.fillStyle = 'white';
        ctx.letterSpacing = '-1px';

        const lines = text.split('\n');
        const startY = marginV + offsetY;
        const maxWidth = contentW;
        lines.forEach((line, i) => {
            const y = startY + i * lineHeight;
            ctx.fillText(line.trim(), width / 2, y, maxWidth);
        });

        if (cards.length > 0) {
            const textBottomY = marginV + offsetY + lines.length * lineHeight + lineHeight * 0.8;
            drawCardsOnCanvas({
                ctx,
                cards,
                startY: textBottomY,
                width,
                marginH,
                baseFontSize: fontSize,
                lineHeight,
                hoveredCardIndex: hoveredCardIndexRef.current >= 0 ? hoveredCardIndexRef.current : undefined,
                cardPhases: cardPhasesRef.current,
                cardTransitionTexts: cardTransitionTextsRef.current,
            });
        }

        const tex = gl.createTexture();
        gl.bindTexture(gl.TEXTURE_2D, tex);
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, textCanvas);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);

        if (textureRef.current) gl.deleteTexture(textureRef.current);
        textureRef.current = tex;
        setIsLoaded(true);
    };

    const loadImageTexture = (gl: WebGLRenderingContext, source: string) => {
        const img = new Image();
        img.crossOrigin = "anonymous";
        img.onload = () => {
            const tex = gl.createTexture();
            gl.bindTexture(gl.TEXTURE_2D, tex);
            gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, img);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);

            if (textureRef.current) gl.deleteTexture(textureRef.current);
            textureRef.current = tex;
            setIsLoaded(true);
        };
        img.src = source;
    };

    useEffect(() => {
        if (!canvasRef.current || !containerRef.current) return;

        const canvas = canvasRef.current;
        const gl = canvas.getContext('webgl', { alpha: true, antialias: false });
        if (!gl) return;
        glRef.current = gl;

        const vs = gl.createShader(gl.VERTEX_SHADER)!;
        gl.shaderSource(vs, VERTEX_SHADER);
        gl.compileShader(vs);

        const fs = gl.createShader(gl.FRAGMENT_SHADER)!;
        gl.shaderSource(fs, FRAGMENT_SHADER_COMBINED);
        gl.compileShader(fs);

        const program = gl.createProgram()!;
        gl.attachShader(program, vs);
        gl.attachShader(program, fs);
        gl.linkProgram(program);
        programRef.current = program;

        // UV v 与 Canvas 一致：屏幕顶部用 v=0（画布顶），屏幕底部用 v=1（画布底），避免整幅上下颠倒
        const vertices = new Float32Array([-1, -1, 0, 1, 1, -1, 1, 1, -1, 1, 0, 0, 1, 1, 1, 0]);
        const buffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
        gl.bufferData(gl.ARRAY_BUFFER, vertices, gl.STATIC_DRAW);

        const pos = gl.getAttribLocation(program, 'position');
        const uv = gl.getAttribLocation(program, 'uv');
        gl.enableVertexAttribArray(pos);
        gl.vertexAttribPointer(pos, 2, gl.FLOAT, false, 16, 0);
        gl.enableVertexAttribArray(uv);
        gl.vertexAttribPointer(uv, 2, gl.FLOAT, false, 16, 8);

        const handleResize = () => {
            if (!containerRef.current) return;
            const rect = containerRef.current.getBoundingClientRect();
            const dpr = window.devicePixelRatio || 1;
            canvas.width = rect.width * dpr;
            canvas.height = rect.height * dpr;
            gl.viewport(0, 0, canvas.width, canvas.height);

            const offsetY = contentOffsetYRef?.current ?? 0;
            if (contentSegments?.length) {
                const fallback = buildFullTextFromSegments(contentSegments, 'idle', 0, opts(), undefined, activeScrambleIndices);
                createTextTexture(gl, displayTextRef.current || fallback, canvas.width, canvas.height, offsetY);
            } else if (text) {
                if (scrambleMode !== 'auto') {
                    createTextTexture(gl, text, canvas.width, canvas.height, offsetY);
                } else {
                    createTextTexture(gl, displayTextRef.current || text, canvas.width, canvas.height, offsetY);
                }
            }
        };

        let scrambleTimerId: ReturnType<typeof setTimeout> | null = null;
        const runScramble = scrambleActiveRef.current !== false;
        const hasContent = text || (contentSegments && contentSegments.length > 0);
        const hasScrambleSegment = contentSegments?.some((s) => s.type === 'scramble');
        const opts = () => ({ ...PRESET_HERO_FLICKER, ...scrambleOptionsRef.current });
        if (contentSegments?.length && !runScramble) {
            displayTextRef.current = buildFullTextFromSegments(contentSegments, 'idle', 0, opts(), undefined, activeScrambleIndices);
        }
        if (text && !contentSegments?.length) {
            decodeOrderRef.current = getDecodeOrder(text.length, opts().decodeOrder ?? 'sequential');
        }
        if (hasContent && scrambleMode === 'auto' && runScramble && (text || hasScrambleSegment)) {
            startTimeRef.current = Date.now();
            if (contentSegments?.length) {
                displayTextRef.current = buildFullTextFromSegments(
                    contentSegments,
                    'flicker',
                    0,
                    opts(),
                    burstDurationMsRef.current > 0
                        ? Math.min(1, Math.max(0, (Date.now() - burstStartedAtRef.current) / burstDurationMsRef.current))
                        : undefined,
                    activeScrambleIndices
                );
            } else if (text) {
                displayTextRef.current = text;
            }
            const tick = () => {
                if (scrambleActiveRef.current === false) return;
                const elapsed = Date.now() - startTimeRef.current;
                let mode: ScrambleMode;
                let progress: number;
                if (useScrambleScheduleRef.current) {
                    mode = 'flicker';
                    progress = 0;
                } else if (elapsed < DECODE_DURATION_MS && text) {
                    mode = 'decode';
                    progress = elapsed / DECODE_DURATION_MS;
                } else {
                    mode = 'flicker';
                    progress = 0;
                }
                const o = opts();
                const burstProgress =
                    useScrambleScheduleRef.current && burstDurationMsRef.current > 0
                        ? Math.min(
                            1,
                            Math.max(
                                0,
                                (Date.now() - burstStartedAtRef.current) / burstDurationMsRef.current
                            )
                        )
                        : undefined;
                if (contentSegments?.length) {
                    displayTextRef.current = buildFullTextFromSegments(contentSegments, mode, progress, o, burstProgress, activeScrambleIndices);
                } else if (text) {
                    displayTextRef.current = getScrambledText(
                        text,
                        mode,
                        progress,
                        o,
                        decodeOrderRef.current ?? undefined,
                        burstProgress
                    );
                }
            };
            const scheduleNext = () => {
                tick();
                if (scrambleActiveRef.current === false) return;
                const o = opts();
                const delayMs = o.refreshIntervalRangeMs && o.refreshIntervalRangeMs.length >= 2
                    ? randomBetween(o.refreshIntervalRangeMs[0], o.refreshIntervalRangeMs[1])
                    : (o.refreshInterval ?? 50);
                scrambleTimerId = setTimeout(scheduleNext, delayMs);
            };
            scheduleNext();
        }
        if (text && !contentSegments?.length && scrambleMode === 'auto' && !runScramble) {
            displayTextRef.current = text;
        }

        if (text || contentSegments?.length) {
            handleResize();
        } else if (src) {
            loadImageTexture(gl, src);
        }

        window.addEventListener('resize', handleResize);
        handleResize();

        const animate = (time: number) => {
            if (!glRef.current || !programRef.current || !textureRef.current) {
                frameIdRef.current = requestAnimationFrame(animate);
                return;
            }
            const gl = glRef.current;
            const p = programRef.current;
            gl.useProgram(p);

            gl.uniform2f(gl.getUniformLocation(p, 'resolution'), canvas.width, canvas.height);
            gl.uniform1f(gl.getUniformLocation(p, 'time'), time * 0.001);

            const { pixelation = {}, crt = {} } = effects;
            gl.uniform1i(gl.getUniformLocation(p, 'pixelationEnabled'), pixelation.enabled ? 1 : 0);
            gl.uniform1f(gl.getUniformLocation(p, 'pixelSize'), pixelation.pixelSize || 10);
            gl.uniform1i(gl.getUniformLocation(p, 'crtEnabled'), crt.enabled ? 1 : 0);
            gl.uniform1f(gl.getUniformLocation(p, 'scanlineIntensity'), crt.scanlineIntensity ?? 0.3);
            gl.uniform1f(gl.getUniformLocation(p, 'curvature'), crt.curvature ?? 2.0);
            gl.uniform1f(gl.getUniformLocation(p, 'brightness'), crt.brightness ?? 1.0);
            gl.uniform1f(gl.getUniformLocation(p, 'phosphorIntensity'), crt.phosphorIntensity ?? 0.5);
            gl.uniform1f(gl.getUniformLocation(p, 'vignetteIntensity'), crt.vignetteIntensity ?? 0.5);
            gl.uniform1f(gl.getUniformLocation(p, 'scanningBandIntensity'), crt.scanningBandIntensity ?? 0.5);
            gl.uniform1f(gl.getUniformLocation(p, 'chromaticPulseIntensity'), crt.chromaticPulseIntensity ?? 0.5);
            gl.uniform1f(gl.getUniformLocation(p, 'rareGlitchIntensity'), crt.rareGlitchIntensity ?? 0.5);
            gl.uniform1f(gl.getUniformLocation(p, 'interferenceIntensity'), crt.interferenceIntensity ?? 0.0);
            gl.uniform1f(gl.getUniformLocation(p, 'jitterIntensity'), crt.jitterIntensity ?? 0.0);

            const bgColor = crt.baseColor || [0, 0, 0];
            gl.uniform3f(gl.getUniformLocation(p, 'u_bgColor'), bgColor[0], bgColor[1], bgColor[2]);
            gl.uniform1f(gl.getUniformLocation(p, 'zoom'), crt.zoom ?? 1.0);

            const { waves = {} } = effects;
            gl.uniform1i(gl.getUniformLocation(p, 'wavesEnabled'), waves.enabled ? 1 : 0);
            gl.uniform1f(gl.getUniformLocation(p, 'waveAmplitude'), waves.amplitude ?? 0.02);
            gl.uniform1f(gl.getUniformLocation(p, 'waveFrequency'), waves.frequency ?? 10.0);
            gl.uniform1f(gl.getUniformLocation(p, 'waveSpeed'), waves.speed ?? 2.0);

            gl.uniform1i(gl.getUniformLocation(p, 'interactionEnabled'), interaction.enabled ? 1 : 0);
            const dpr = window.devicePixelRatio || 1;
            gl.uniform2f(gl.getUniformLocation(p, 'mousePx'), mouseRef.current.x * dpr, mouseRef.current.y * dpr);
            gl.uniform1f(gl.getUniformLocation(p, 'radiusPx'), (interaction.radius || 100) * dpr);
            gl.uniform1f(gl.getUniformLocation(p, 'effectScale'), interaction.intensity || 1.0);

            const offsetY = contentOffsetYRef?.current ?? 0;
            let hoveredIndex = -1;
            if (cards.length > 0) {
                const lineCount = contentSegments?.length
                    ? (displayTextRef.current || '').split('\n').length
                    : (text ? text.split('\n').length : 0);
                const rects = getCardRects({
                    width: canvas.width,
                    height: canvas.height,
                    offsetY,
                    lineCount,
                    cards,
                    cardPhases: lastCardPhasesRef.current,
                });
                const mouseX = mouseRef.current.x * dpr;
                const mouseY = mouseRef.current.y * dpr;
                for (let i = 0; i < rects.length; i++) {
                    const r = rects[i];
                    if (mouseX >= r.x && mouseX <= r.x + r.width && mouseY >= r.y && mouseY <= r.y + r.height) {
                        hoveredIndex = i;
                        break;
                    }
                }
                hoveredCardIndexRef.current = hoveredIndex;

                // 初始化进度数组
                if (cardProgressRef.current.length !== cards.length) {
                    cardProgressRef.current = cards.map(() => 0);
                    cardTargetProgressRef.current = cards.map(() => 0);
                    cardTransitionTextsRef.current = cards.map(() => '');
                }

                // 更新目标
                cards.forEach((_, i) => {
                    cardTargetProgressRef.current[i] = (hoveredIndex === i) ? 1.0 : 0.0;
                });
            }

            const now = Date.now();
            const deltaTime = lastFrameTimeRef.current === 0 ? 0 : now - lastFrameTimeRef.current;
            lastFrameTimeRef.current = now;

            const ANIM_DURATION = 300; // 统一动画时长

            // 更新所有卡片的实时进度与状态
            const cardPhases: CardPhase[] = cards.map((_, i) => {
                const currentP = cardProgressRef.current[i];
                const targetP = cardTargetProgressRef.current[i];

                if (currentP !== targetP) {
                    const step = deltaTime / ANIM_DURATION;
                    if (currentP < targetP) {
                        cardProgressRef.current[i] = Math.min(targetP, currentP + step);
                    } else {
                        cardProgressRef.current[i] = Math.max(targetP, currentP - step);
                    }
                }

                const p = cardProgressRef.current[i];
                if (p <= 0) return 'idle';
                if (p >= 1) return 'detail';
                return (targetP === 1.0) ? 'scramble' : 'exiting';
            });

            cardPhasesRef.current = cardPhases;
            const scrambleIntervalMs = randomBetween(40, 80);
            const anyAnimating = cardPhases.some(p => p === 'scramble' || p === 'exiting');
            let needScrambleRedraw = false;

            if (anyAnimating) {
                if (now - lastCardTransitionUpdateRef.current >= scrambleIntervalMs || lastCardTransitionUpdateRef.current === 0) {
                    cardPhases.forEach((phase, i) => {
                        const progress = cardProgressRef.current[i];
                        if (progress <= 0 || progress >= 1 && phase === 'detail') {
                            if (phase === 'idle') cardTransitionTextsRef.current[i] = '';
                            return;
                        }

                        const targetCard = cards[i];
                        const sourceArr = [
                            targetCard.title,
                            targetCard.subtitle,
                            targetCard.description,
                            targetCard.tags?.join(' · ')
                        ].filter(Boolean);
                        const sourceStr = sourceArr.join('\n');
                        const targetStr = targetCard.details ?? targetCard.description ?? sourceStr;

                        cardTransitionTextsRef.current[i] = getTransitionText(sourceStr, targetStr, progress, {});
                    });
                    lastCardTransitionUpdateRef.current = now;
                    needScrambleRedraw = true;
                }
            }

            const cardPhasesChanged = cards.length > 0 && (
                lastCardPhasesRef.current.length !== cardPhases.length ||
                cardPhases.some((p, i) => p !== lastCardPhasesRef.current[i])
            );
            const hasTextOrSegments = text || contentSegments?.length;
            if (hasTextOrSegments && scrambleMode === 'auto') {
                if (scrambleActiveRef.current === false && contentSegments?.length)
                    displayTextRef.current = buildFullTextFromSegments(contentSegments, 'idle', 0, opts(), undefined, activeScrambleIndices);
                else if (scrambleActiveRef.current === false && text) displayTextRef.current = text ?? '';
                const textOrOffsetChanged =
                    displayTextRef.current !== lastDisplayTextRef.current || offsetY !== lastOffsetYRef.current;
                const hoverChanged = cards.length > 0 && hoveredIndex !== lastHoveredCardIndexRef.current;
                const shouldRedraw = textOrOffsetChanged || hoverChanged || cardPhasesChanged || needScrambleRedraw;
                if (shouldRedraw) {
                    createTextTexture(gl, displayTextRef.current, canvas.width, canvas.height, offsetY);
                    lastDisplayTextRef.current = displayTextRef.current;
                    lastOffsetYRef.current = offsetY;
                    lastHoveredCardIndexRef.current = hoveredIndex;
                    lastCardPhasesRef.current = [...cardPhases];
                }
            } else if (hasTextOrSegments && (offsetY !== lastOffsetYRef.current || (cards.length > 0 && (hoveredIndex !== lastHoveredCardIndexRef.current || cardPhasesChanged || needScrambleRedraw)))) {
                const staticStr = contentSegments?.length
                    ? (displayTextRef.current || buildFullTextFromSegments(contentSegments, 'idle', 0, opts(), undefined, activeScrambleIndices))
                    : (text ?? '');
                createTextTexture(gl, staticStr, canvas.width, canvas.height, offsetY);
                lastOffsetYRef.current = offsetY;
                lastHoveredCardIndexRef.current = hoveredIndex;
                lastCardPhasesRef.current = [...cardPhases];
            }

            gl.bindTexture(gl.TEXTURE_2D, textureRef.current);
            gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
            frameIdRef.current = requestAnimationFrame(animate);
        };
        frameIdRef.current = requestAnimationFrame(animate);

        return () => {
            window.removeEventListener('resize', handleResize);
            cancelAnimationFrame(frameIdRef.current);
            if (scrambleTimerId) clearTimeout(scrambleTimerId);
            if (glRef.current && textureRef.current) {
                glRef.current.deleteTexture(textureRef.current);
            }
        };
    }, [src, text, effects, interaction, scrambleMode, scrambleActive, contentSegments, cards]);

    const handleMouseMove = (e: React.MouseEvent) => {
        if (!containerRef.current) return;
        const rect = containerRef.current.getBoundingClientRect();
        mouseRef.current = {
            x: e.clientX - rect.left,
            y: e.clientY - rect.top
        };
    };

    return (
        <div
            ref={containerRef}
            className={`relative overflow-hidden group ${className}`}
            onMouseMove={handleMouseMove}
            style={{
                // Global Bloom (Glowing effect)
                filter: effects.crt?.enabled ? 'drop-shadow(0 0 4px rgba(255, 255, 255, 0.15))' : 'none'
            }}
        >
            <canvas
                ref={canvasRef}
                className="w-full h-full block transform-gpu"
            />
            {!isLoaded && <div className="absolute inset-0 flex items-center justify-center bg-gray-900 text-gray-400 italic">Initializing CRT...</div>}
        </div>
    );
};

export default GlitchGL;
