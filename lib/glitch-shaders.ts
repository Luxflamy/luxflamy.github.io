/**
 * Advanced WebGL Shaders for GlitchGL (Ultimate CRT Edition)
 * Inspired by retro CRT monitors and glitch aesthetics.
 */

export const VERTEX_SHADER = `
  precision highp float;
  attribute vec2 position;
  attribute vec2 uv;
  uniform vec2 resolution;
  varying vec2 vUv;
  
  void main() {
    vUv = uv;
    gl_Position = vec4(position, 0.0, 1.0);
  }
`;

export const FRAGMENT_SHADER_COMBINED = `
  precision mediump float;
  uniform sampler2D u_texture;
  uniform highp vec2 resolution;
  uniform float time;
  
  // Controls
  uniform bool pixelationEnabled;
  uniform float pixelSize;
  
  uniform bool crtEnabled;
  uniform float scanlineIntensity;
  uniform float curvature;
  uniform float brightness;
  
  // Advanced Features from User_note.md
  uniform float phosphorIntensity; // RGB Mask strength
  uniform float vignetteIntensity;
  uniform float scanningBandIntensity;
  uniform float chromaticPulseIntensity; // Periodic CA pulse
  uniform float rareGlitchIntensity;  // Rare sync errors
  uniform float interferenceIntensity; // New: Scrolling noise/distortion bands
  uniform float jitterIntensity;       // New: Random line jitter
  uniform vec3 u_bgColor;              // New: Base background color
  uniform float zoom;                  // New: Zoom factor
  
  // Wave Distortion Feature
  uniform bool wavesEnabled;
  uniform float waveAmplitude;
  uniform float waveFrequency;
  uniform float waveSpeed;
  
  // Interaction
  uniform bool interactionEnabled;
  uniform vec2 mousePx;
  uniform float radiusPx;
  uniform float effectScale;
  
  varying vec2 vUv;

  // --- Utilities ---
  float random(vec2 st) {
    return fract(sin(dot(st.xy, vec2(12.9898, 78.233))) * 43758.5453123);
  }

  vec2 barrelDistortion(vec2 uv, float k) {
    if (k == 0.0) return uv;
    vec2 st = uv - 0.5;
    float r2 = dot(st, st);
    st *= 1.0 + k * r2 + k * k * r2 * r2;
    return st + 0.5;
  }

  void main() {
    float timeScaled = time * 0.6; // Reduced from 1.5 for a slower base frequency
    
    // 0. Zoom & Center (Hide distorted edges)
    vec2 uv = (vUv - 0.5) * (1.0 / max(0.1, zoom)) + 0.5;
    
    // 1. Barrel Distortion (Curvature)
    vec2 curvedUV = barrelDistortion(uv, curvature * 0.15);
    
    // 2. Electronic Jitter (Horizontal line shifts)
    // Simulates unstable horizontal sync per line
    float jitter = (random(vec2(timeScaled, floor(curvedUV.y * 100.0))) - 0.5) * jitterIntensity * 0.01;
    curvedUV.x += jitter;

    // 3. Rare Glitch (Vertical/Horizontal sync jump)
    float rareTrigger = step(0.995, random(vec2(floor(timeScaled * 0.4), 456.0)));
    float jump = (random(vec2(timeScaled, 0.0)) - 0.5) * rareTrigger * rareGlitchIntensity * 0.1;
    curvedUV.x += jump;

    // 4. Scrolling Interference Bands
    // Wide horizontal bands that cause localized noise and offset
    if (interferenceIntensity > 0.0) {
      float interference = sin(curvedUV.y * 10.0 - timeScaled * 2.0) * 0.5 + 0.5;
      interference = pow(interference, 4.0); // Make the band sharper
      float offset = (random(vec2(timeScaled, floor(curvedUV.y * 50.0))) - 0.5) * interference * interferenceIntensity * 0.05;
      curvedUV.x += offset;
    }

    // 5. Horizontal Wave Distortion (Legacy)
    if (wavesEnabled) {
      float wave = sin(curvedUV.y * waveFrequency + timeScaled * waveSpeed) * waveAmplitude;
      curvedUV.x += wave;
    }

    // Critical: Clip the edges
    if (curvedUV.x < 0.0 || curvedUV.x > 1.0 || curvedUV.y < 0.0 || curvedUV.y > 1.0) {
      gl_FragColor = vec4(0.0, 0.0, 0.0, 1.0);
      return;
    }

    // 6. Chromatic Aberration Pulse（最大偏移量已调小）
    float pulse = (sin(timeScaled * 0.5) * 0.5 + 0.5) * chromaticPulseIntensity;
    float caAmount = 0.002 + pulse * 0.005;
    
    if (interactionEnabled) {
      float dist = length(gl_FragCoord.xy - vec2(mousePx.x, resolution.y - mousePx.y));
      float mouseEffect = 1.0 - smoothstep(0.0, radiusPx * 2.5, dist);
      caAmount += mouseEffect * effectScale * 0.02;
    }

    vec3 texColor = texture2D(u_texture, curvedUV).rgb;
    float r = texture2D(u_texture, curvedUV + vec2(caAmount, 0.0)).r;
    float g = texture2D(u_texture, curvedUV).g;
    float b = texture2D(u_texture, curvedUV - vec2(caAmount, 0.0)).b;
    vec3 color = vec3(r, g, b);
    
    // Blend with base color (Option 1)
    float alpha = texture2D(u_texture, curvedUV).a;
    color = mix(u_bgColor, color, alpha);

    // 7. Signal Noise (Fine-grained snow)
    float snow = (random(curvedUV + timeScaled) - 0.5) * 0.15 * interferenceIntensity;
    color += snow;

    // 8. Dynamic Scanning Bands (Brightness drift)
    float band = sin(curvedUV.y * 3.0 - timeScaled * 1.5) * 0.5 + 0.5;
    color *= 1.0 + (band * 0.2 * scanningBandIntensity);

    // 9. Scanlines
    float scanline = sin(curvedUV.y * resolution.y * 0.8) * 0.5 + 0.5;
    color *= mix(1.0 - scanlineIntensity, 1.0, scanline);

    // 10. RGB Phosphor Mask
    float m = mod(gl_FragCoord.x, 3.0);
    vec3 mask = vec3(1.0);
    if (m < 1.0) mask = vec3(1.15, 0.9, 0.9);
    else if (m < 2.0) mask = vec3(0.9, 1.15, 0.9);
    else mask = vec3(0.9, 0.9, 1.15);
    color = mix(color, color * mask, phosphorIntensity);

    // 11. Vignette (Dark corners)
    vec2 vuv = curvedUV * (1.0 - curvedUV.yx);
    float vig = pow(vuv.x * vuv.y * 15.0, 0.2);
    color *= mix(1.0, vig, vignetteIntensity);

    // 12. Global Brightness & Flicker
    float flicker = 1.0 + (random(vec2(timeScaled, 0.0)) - 0.5) * 0.03;
    color *= brightness * flicker;

    gl_FragColor = vec4(color, 1.0);
  }
`;
