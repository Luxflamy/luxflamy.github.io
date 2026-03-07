export interface GlitchEffects {
    pixelation?: {
        enabled?: boolean;
        pixelSize?: number;
    };
    crt?: {
        enabled?: boolean;
        scanlineIntensity?: number;
        curvature?: number;
        brightness?: number;
        // Advanced features
        phosphorIntensity?: number;
        vignetteIntensity?: number;
        scanningBandIntensity?: number;
        chromaticPulseIntensity?: number;
        rareGlitchIntensity?: number;
        interferenceIntensity?: number;
        jitterIntensity?: number;
    };
    waves?: {
        enabled?: boolean;
        amplitude?: number;
        frequency?: number;
        speed?: number;
    };
}

export interface GlitchInteraction {
    enabled?: boolean;
    radius?: number;
    intensity?: number;
}

export interface GlitchOptions {
    aspectCorrection?: boolean;
    resolutionScale?: number;
}
