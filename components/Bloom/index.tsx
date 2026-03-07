'use client';

import React from 'react';

interface BloomProviderProps {
    id: string;
    /** Blur radius for the primary glow layer */
    intensity?: number;
    /** Color matrix to filter brightness (0-1). Higher means only brighter pixels glow. */
    threshold?: number;
    /** Children to apply the filter to */
    children: React.ReactNode;
    className?: string;
}

/**
 * BloomProvider creates a reusable SVG filter for CRT-like glow effects.
 * It uses multi-layer Gaussian blur to simulate light bleeding and phosphor afterimage.
 */
export const BloomProvider: React.FC<BloomProviderProps> = ({
    id,
    intensity = 4,
    threshold = 0.3,
    children,
    className = ''
}) => {
    return (
        <div className={`bloom-container relative w-full h-full ${className}`}>
            {/* SVG Filter Definitions - Invisible */}
            <svg style={{ position: 'absolute', width: 0, height: 0, pointerEvents: 'none' }}>
                <defs>
                    <filter id={id} x="-50%" y="-50%" width="200%" height="200%">
                        {/* 1. Extract bright parts using a color matrix */}
                        {/* We use a matrix that pushes darker colors to black and keeps brights */}
                        <feColorMatrix
                            type="matrix"
                            values={`
                                1 0 0 0 -${threshold}
                                0 1 0 0 -${threshold}
                                0 0 1 0 -${threshold}
                                0 0 0 1 0
                            `}
                            result="bright-parts"
                        />

                        {/* 2. Create multiple layers of blur for a rich glow profile */}

                        {/* Narrow sharp glow (phosphor core) */}
                        <feGaussianBlur in="bright-parts" stdDeviation={intensity * 0.5} result="blur1" />

                        {/* Medium atmospheric glow */}
                        <feGaussianBlur in="bright-parts" stdDeviation={intensity * 1.5} result="blur2" />

                        {/* Wide ambient bloom */}
                        <feGaussianBlur in="bright-parts" stdDeviation={intensity * 3} result="blur3" />

                        {/* 3. Merge and boost the blurs */}
                        <feMerge result="combined-glow">
                            <feMergeNode in="blur1" />
                            <feMergeNode in="blur2" />
                            <feMergeNode in="blur3" />
                        </feMerge>

                        {/* Boost the glow color */}
                        <feComponentTransfer in="combined-glow" result="boosted-glow">
                            <feFuncA type="linear" slope="1.5" />
                        </feComponentTransfer>

                        {/* 4. Compose back with original */}
                        <feMerge>
                            <feMergeNode in="boosted-glow" />
                            <feMergeNode in="SourceGraphic" />
                        </feMerge>
                    </filter>
                </defs>
            </svg>

            {/* Application Layer - Must fill parent for filter to work correctly on full screen */}
            <div className="w-full h-full" style={{ filter: `url(#${id})` }}>
                {children}
            </div>
        </div>
    );
};
