'use client';

import React, { useState, useEffect, useRef } from 'react';
import { GlitchRandomizerProps, GlitchRandomizerRanges } from './types';
import { GlitchEffects } from '../GlitchGL/types';

/** Helper to generate random number between min and max */
const randomBetween = (min: number, max: number) => Math.random() * (max - min) + min;

/** Helper to lerp between two values */
const lerp = (start: number, end: number, amt: number) => (1 - amt) * start + amt * end;

export function GlitchRandomizer({
    intervalMs = 150,
    ranges,
    baseEffects = {},
    children,
    smoothing = 0.1, // 0 = jump immediately, 1 = never reach target
    className = ''
}: GlitchRandomizerProps) {
    const [currentEffects, setCurrentEffects] = useState<GlitchEffects>(baseEffects);

    // We use refs to hold target values and smoothly animate towards them
    const targetValuesRef = useRef<Record<string, number>>({});
    const currentValuesRef = useRef<Record<string, number>>({});
    const animationFrameRef = useRef<number>();
    const intervalRef = useRef<NodeJS.Timeout>();

    useEffect(() => {
        // Initialize current values from base effects or range minimums
        const initValues: Record<string, number> = {};
        Object.keys(ranges).forEach(key => {
            const range = ranges[key as keyof GlitchRandomizerRanges];
            if (range) {
                // Initial target is min of range
                initValues[key] = range[0];
            }
        });
        currentValuesRef.current = { ...initValues };
        targetValuesRef.current = { ...initValues };

        return () => {
            if (intervalRef.current) clearInterval(intervalRef.current);
            if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
        };
    }, []);

    // Timer to pick new random targets
    useEffect(() => {
        if (intervalMs <= 0) return;

        const pickNewTargets = () => {
            const newTargets: Record<string, number> = {};
            Object.keys(ranges).forEach(key => {
                const range = ranges[key as keyof GlitchRandomizerRanges];
                if (range) {
                    newTargets[key] = randomBetween(range[0], range[1]);
                }
            });
            targetValuesRef.current = {
                ...targetValuesRef.current,
                ...newTargets
            };
        };

        intervalRef.current = setInterval(pickNewTargets, intervalMs);
        return () => clearInterval(intervalRef.current!);
    }, [intervalMs, ranges]);

    // Render loop to smoothly interpolate current values towards targets
    useEffect(() => {
        if (intervalMs <= 0) return;

        const animate = () => {
            let hasChanges = false;
            const newCurrent = { ...currentValuesRef.current };

            Object.keys(targetValuesRef.current).forEach(key => {
                const target = targetValuesRef.current[key];
                const current = newCurrent[key] || 0;

                // If smoothing is 0, just jump to target
                if (smoothing <= 0) {
                    if (newCurrent[key] !== target) {
                        newCurrent[key] = target;
                        hasChanges = true;
                    }
                } else {
                    // Lerp towards target
                    const delta = target - current;
                    if (Math.abs(delta) > 0.001) { // Threshold to stop lerping
                        newCurrent[key] = current + delta * (1 - smoothing);
                        hasChanges = true;
                    }
                }
            });

            if (hasChanges) {
                currentValuesRef.current = newCurrent;

                // Construct new effects object by deeply merging baseEffects with animated values
                const reconstructedEffects: any = JSON.parse(JSON.stringify(baseEffects));

                // Helper to safely set nested object properties (e.g. 'crt.jitterIntensity')
                Object.entries(newCurrent).forEach(([key, val]) => {
                    const parts = key.split('.');
                    if (parts.length === 2) {
                        const [category, prop] = parts;
                        // Ensure category exists without overwriting existing props like 'enabled'
                        if (!reconstructedEffects[category]) {
                            reconstructedEffects[category] = {};
                        }
                        reconstructedEffects[category][prop] = val;
                    }
                });

                setCurrentEffects(reconstructedEffects);
            }

            animationFrameRef.current = requestAnimationFrame(animate);
        };

        animationFrameRef.current = requestAnimationFrame(animate);
        return () => cancelAnimationFrame(animationFrameRef.current!);
    }, [smoothing, baseEffects, intervalMs]);

    // Clone the child GlitchGL component and inject the randomly animated effects
    const clonedChild = React.isValidElement(children)
        ? React.cloneElement(children, { effects: currentEffects } as any)
        : children;

    return (
        <div className={`glitch-randomizer-wrapper w-full h-full ${className}`}>
            {clonedChild}
        </div>
    );
}
