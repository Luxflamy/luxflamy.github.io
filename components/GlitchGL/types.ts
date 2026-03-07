export interface GlitchEffects {
    pixelation?: {
        enabled?: boolean;
        pixelSize?: number;
        pixelShape?: number; // 0: Square, 1: Circle, 2: Diamond, etc.
        bitDepth?: number;
        dithering?: number;
        pixelDirection?: number;
        isText?: boolean;
        pixelSizeInteractive?: boolean;
    };
    crt?: {
        enabled?: boolean;
        scanlineIntensity?: number;
        scanlineThickness?: number;
        scanlineCount?: number;
        phosphorGlow?: number;
        curvature?: number;
        chromaticAberration?: number;
        brightness?: number;
        flicker?: boolean;
        flickerIntensity?: number;
        lineMovement?: boolean;
        lineSpeed?: number;
        lineDirection?: number;
        chromaticAberrationInteractive?: boolean;
        scanlinesInteractive?: boolean;
        phosphorGlowInteractive?: boolean;
        curvatureInteractive?: boolean;
    };
    glitch?: {
        enabled?: boolean;
        rgbShift?: number;
        digitalNoise?: number;
        lineDisplacement?: number;
        bitCrushDepth?: number;
        signalDropoutFreq?: number;
        signalDropoutSize?: number;
        syncErrorFreq?: number;
        syncErrorAmount?: number;
        interferenceSpeed?: number;
        interferenceIntensity?: number;
        frameGhostAmount?: number;
        stutterFreq?: number;
        datamoshStrength?: number;
        rgbShiftInteractive?: boolean;
        digitalNoiseInteractive?: boolean;
        lineDisplacementInteractive?: boolean;
        bitCrushInteractive?: boolean;
    };
}

export interface GlitchInteraction {
    enabled?: boolean;
    shape?: number; // 0: Circle, 1: Square, 2: Diamond, etc.
    radius?: number;
    intensity?: number;
}

export interface GlitchOptions {
    aspectCorrection?: boolean;
    resolutionScale?: number;
}
