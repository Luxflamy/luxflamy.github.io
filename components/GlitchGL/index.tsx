'use client';

import React, { useRef, useEffect, useState } from 'react';
import { GlitchEffects, GlitchInteraction, GlitchOptions } from './types';
import { VERTEX_SHADER, FRAGMENT_SHADER_COMBINED } from '@/lib/glitch-shaders';

interface GlitchGLProps {
    src: string;
    effects?: GlitchEffects;
    interaction?: GlitchInteraction;
    options?: GlitchOptions;
    className?: string;
}

const GlitchGL: React.FC<GlitchGLProps> = ({
    src,
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

    useEffect(() => {
        if (!canvasRef.current) return;

        const canvas = canvasRef.current;
        const gl = canvas.getContext('webgl', { alpha: true, antialias: false });
        if (!gl) return;
        glRef.current = gl;

        const createShader = (gl: WebGLRenderingContext, type: number, source: string) => {
            const shader = gl.createShader(type);
            if (!shader) return null;
            gl.shaderSource(shader, source);
            gl.compileShader(shader);
            if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
                console.error(gl.getShaderInfoLog(shader));
                gl.deleteShader(shader);
                return null;
            }
            return shader;
        };

        const vs = createShader(gl, gl.VERTEX_SHADER, VERTEX_SHADER);
        const fs = createShader(gl, gl.FRAGMENT_SHADER, FRAGMENT_SHADER_COMBINED);
        if (!vs || !fs) return;

        const program = gl.createProgram();
        if (!program) return;
        gl.attachShader(program, vs);
        gl.attachShader(program, fs);
        gl.linkProgram(program);
        programRef.current = program;

        const vertices = new Float32Array([
            -1, -1, 0, 0,
            1, -1, 1, 0,
            -1, 1, 0, 1,
            1, 1, 1, 1,
        ]);
        const buffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
        gl.bufferData(gl.ARRAY_BUFFER, vertices, gl.STATIC_DRAW);

        const pos = gl.getAttribLocation(program, 'position');
        const uv = gl.getAttribLocation(program, 'uv');
        gl.enableVertexAttribArray(pos);
        gl.vertexAttribPointer(pos, 2, gl.FLOAT, false, 16, 0);
        gl.enableVertexAttribArray(uv);
        gl.vertexAttribPointer(uv, 2, gl.FLOAT, false, 16, 8);

        const img = new Image();
        img.crossOrigin = "anonymous";
        img.onload = () => {
            const tex = gl.createTexture();
            gl.bindTexture(gl.TEXTURE_2D, tex);
            gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, img);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
            textureRef.current = tex;
            setIsLoaded(true);
        };
        img.src = src;

        const handleResize = () => {
            if (!containerRef.current) return;
            const { width, height } = containerRef.current.getBoundingClientRect();
            const dpr = window.devicePixelRatio || 1;
            canvas.width = width * dpr;
            canvas.height = height * dpr;
            gl.viewport(0, 0, canvas.width, canvas.height);
        };
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

            // Core Uniforms
            gl.uniform2f(gl.getUniformLocation(p, 'resolution'), canvas.width, canvas.height);
            gl.uniform1f(gl.getUniformLocation(p, 'time'), time * 0.001);

            // Effects
            const { pixelation = {}, crt = {} } = effects;
            gl.uniform1i(gl.getUniformLocation(p, 'pixelationEnabled'), pixelation.enabled ? 1 : 0);
            gl.uniform1f(gl.getUniformLocation(p, 'pixelSize'), pixelation.pixelSize || 10);

            gl.uniform1i(gl.getUniformLocation(p, 'crtEnabled'), crt.enabled ? 1 : 0);
            gl.uniform1f(gl.getUniformLocation(p, 'scanlineIntensity'), crt.scanlineIntensity ?? 0.3);
            gl.uniform1f(gl.getUniformLocation(p, 'curvature'), crt.curvature ?? 2.0);
            gl.uniform1f(gl.getUniformLocation(p, 'brightness'), crt.brightness ?? 1.0);

            // Advanced CRT Uniforms
            gl.uniform1f(gl.getUniformLocation(p, 'phosphorIntensity'), crt.phosphorIntensity ?? 0.5);
            gl.uniform1f(gl.getUniformLocation(p, 'vignetteIntensity'), crt.vignetteIntensity ?? 0.5);
            gl.uniform1f(gl.getUniformLocation(p, 'scanningBandIntensity'), crt.scanningBandIntensity ?? 0.5);
            gl.uniform1f(gl.getUniformLocation(p, 'chromaticPulseIntensity'), crt.chromaticPulseIntensity ?? 0.5);
            gl.uniform1f(gl.getUniformLocation(p, 'rareGlitchIntensity'), crt.rareGlitchIntensity ?? 0.5);

            // Interaction
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
    }, [src, effects, interaction]);

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
