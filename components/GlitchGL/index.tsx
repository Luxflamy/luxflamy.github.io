'use client';

import React, { useRef, useEffect, useState, useMemo } from 'react';
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
    options = {},
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
        const gl = canvas.getContext('webgl', { alpha: true });
        if (!gl) {
            console.error("WebGL not supported");
            return;
        }
        glRef.current = gl;

        // Shader compilation helper
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
        if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
            console.error(gl.getProgramInfoLog(program));
            return;
        }
        programRef.current = program;
        gl.useProgram(program);

        // Geometry
        const vertices = new Float32Array([
            -1, -1, 0, 0,
            1, -1, 1, 0,
            -1, 1, 0, 1,
            1, 1, 1, 1,
        ]);
        const buffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
        gl.bufferData(gl.ARRAY_BUFFER, vertices, gl.STATIC_DRAW);

        const positionLoc = gl.getAttribLocation(program, 'position');
        const uvLoc = gl.getAttribLocation(program, 'uv');
        gl.enableVertexAttribArray(positionLoc);
        gl.vertexAttribPointer(positionLoc, 2, gl.FLOAT, false, 16, 0);
        gl.enableVertexAttribArray(uvLoc);
        gl.vertexAttribPointer(uvLoc, 2, gl.FLOAT, false, 16, 8);

        // Texture
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
            canvas.width = width * window.devicePixelRatio;
            canvas.height = height * window.devicePixelRatio;
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

            gl.clear(gl.COLOR_BUFFER_BIT);
            gl.useProgram(p);

            // Uniforms
            const uRes = gl.getUniformLocation(p, 'resolution');
            gl.uniform2f(uRes, canvas.width, canvas.height);
            const uTime = gl.getUniformLocation(p, 'time');
            gl.uniform1f(uTime, time * 0.001);

            // Pixelation
            const pExp = effects.pixelation || {};
            gl.uniform1i(gl.getUniformLocation(p, 'pixelationEnabled'), pExp.enabled ? 1 : 0);
            gl.uniform1f(gl.getUniformLocation(p, 'pixelSize'), pExp.pixelSize || 10);
            gl.uniform1i(gl.getUniformLocation(p, 'pixelShape'), pExp.pixelShape || 0);
            gl.uniform1i(gl.getUniformLocation(p, 'bitDepth'), pExp.bitDepth || 0);

            // CRT
            const cExp = effects.crt || {};
            gl.uniform1i(gl.getUniformLocation(p, 'crtEnabled'), cExp.enabled ? 1 : 0);
            gl.uniform1f(gl.getUniformLocation(p, 'scanlineIntensity'), cExp.scanlineIntensity || 0.3);
            gl.uniform1f(gl.getUniformLocation(p, 'scanlineCount'), cExp.scanlineCount || 400);
            gl.uniform1f(gl.getUniformLocation(p, 'curvature'), cExp.curvature || 2.0);
            gl.uniform1f(gl.getUniformLocation(p, 'brightness'), cExp.brightness || 1.0);

            // Interaction
            gl.uniform1i(gl.getUniformLocation(p, 'interactionEnabled'), interaction.enabled ? 1 : 0);
            gl.uniform2f(gl.getUniformLocation(p, 'mousePx'), mouseRef.current.x, mouseRef.current.y);
            gl.uniform1f(gl.getUniformLocation(p, 'radiusPx'), interaction.radius || 100);
            gl.uniform1f(gl.getUniformLocation(p, 'pixelRatio'), window.devicePixelRatio);
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
    }, [src, effects, interaction, options]);

    const handleMouseMove = (e: React.MouseEvent) => {
        if (!canvasRef.current) return;
        const rect = canvasRef.current.getBoundingClientRect();
        mouseRef.current = {
            x: e.clientX - rect.left,
            y: rect.bottom - e.clientY // WebGL Y is up
        };
    };

    return (
        <div ref={containerRef} className={`relative overflow-hidden ${className}`} onMouseMove={handleMouseMove}>
            <canvas
                ref={canvasRef}
                style={{ width: '100%', height: '100%', display: 'block' }}
            />
            {!isLoaded && <div className="absolute inset-0 flex items-center justify-center bg-gray-800 text-white italic">Loading Glitch...</div>}
        </div>
    );
};

export default GlitchGL;
