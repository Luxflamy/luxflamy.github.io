'use client';

import React, { useRef, useEffect, useState } from 'react';
import { GlitchEffects, GlitchInteraction, GlitchOptions } from './types';
import { VERTEX_SHADER, FRAGMENT_SHADER_COMBINED } from '@/lib/glitch-shaders';

interface GlitchGLProps {
    src?: string;
    text?: string;
    effects?: GlitchEffects;
    interaction?: GlitchInteraction;
    options?: GlitchOptions;
    className?: string;
}

const GlitchGL: React.FC<GlitchGLProps> = ({
    src,
    text,
    effects = {},
    interaction = {},
    className = ''
}) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const containerRef = useRef<HTMLDivElement>(null);
    const [isLoaded, setIsLoaded] = useState(false);
    const glRef = useRef<WebGLRenderingContext | null>(null);
    const programRef = useRef<WebGLProgram | null>(null);
    const textureRef = useRef<WebGLTexture | null>(null);
    const frameIdRef = useRef<number>(0);
    const mouseRef = useRef({ x: 0, y: 0 });

    const createTextTexture = (gl: WebGLRenderingContext, text: string, width: number, height: number) => {
        const textCanvas = document.createElement('canvas');
        textCanvas.width = width;
        textCanvas.height = height;
        const ctx = textCanvas.getContext('2d');
        if (!ctx) return;

        ctx.clearRect(0, 0, width, height);
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';

        // Fix y-flipping by inverting the context or using a simpler approach
        ctx.save();
        ctx.scale(1, -1);
        ctx.translate(0, -height);

        // Dynamic font size - Reduced multiplier from 0.15 to 0.08 for smaller text
        const fontSize = Math.min(width * 0.08, height * 0.2);
        ctx.font = `900 ${fontSize}px system-ui, -apple-system, sans-serif`;
        ctx.fillStyle = 'white';
        ctx.letterSpacing = '-1px';
        ctx.fillText(text, width / 2, height / 2);
        ctx.restore();

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

        const vertices = new Float32Array([-1, -1, 0, 0, 1, -1, 1, 0, -1, 1, 0, 1, 1, 1, 1, 1]);
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

            // Re-render text texture if needed
            if (text) {
                createTextTexture(gl, text, canvas.width, canvas.height);
            }
        };

        if (text) {
            handleResize(); // Initial resize and text draw
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
            gl.uniform2f(gl.getUniformLocation(p, 'mousePx'), mouseRef.current.x * (window.devicePixelRatio || 1), mouseRef.current.y * (window.devicePixelRatio || 1));
            gl.uniform1f(gl.getUniformLocation(p, 'radiusPx'), (interaction.radius || 100) * (window.devicePixelRatio || 1));
            gl.uniform1f(gl.getUniformLocation(p, 'effectScale'), interaction.intensity || 1.0);

            gl.bindTexture(gl.TEXTURE_2D, textureRef.current);
            gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
            frameIdRef.current = requestAnimationFrame(animate);
        };
        frameIdRef.current = requestAnimationFrame(animate);

        return () => {
            window.removeEventListener('resize', handleResize);
            cancelAnimationFrame(frameIdRef.current);
            if (glRef.current && textureRef.current) {
                glRef.current.deleteTexture(textureRef.current);
            }
        };
    }, [src, text, effects, interaction]);

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
