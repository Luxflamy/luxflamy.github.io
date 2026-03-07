export type RandomRange = [number, number];

export interface GlitchRandomizerRanges {
    // Pixelation
    'pixelation.pixelSize'?: RandomRange;

    // Core CRT
    'crt.scanlineIntensity'?: RandomRange;
    'crt.curvature'?: RandomRange;
    'crt.brightness'?: RandomRange;

    // Advanced CRT
    'crt.phosphorIntensity'?: RandomRange;
    'crt.vignetteIntensity'?: RandomRange;
    'crt.scanningBandIntensity'?: RandomRange;
    'crt.chromaticPulseIntensity'?: RandomRange;
    'crt.rareGlitchIntensity'?: RandomRange;
    'crt.interferenceIntensity'?: RandomRange;
    'crt.jitterIntensity'?: RandomRange;

    // Waves
    'waves.amplitude'?: RandomRange;
    'waves.frequency'?: RandomRange;
    'waves.speed'?: RandomRange;
}

export interface GlitchRandomizerProps {
    /** Update interval in milliseconds. If 0, randomization is disabled. */
    intervalMs?: number;
    /** Ranges for randomization on each tick. Values will be lerped linearly, or jumped if hard cuts are needed. */
    ranges: GlitchRandomizerRanges;
    /** Base static effects which will be mixed with the dynamic random values. */
    baseEffects?: any; // To be typed against GlitchEffects
    /** The child component (must be GlitchGL for this wrapper) */
    children: React.ReactElement;
    /** Transition smoothing factor (0.0 to 1.0) */
    smoothing?: number;
    className?: string;
}
