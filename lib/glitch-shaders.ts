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

  // --- Main Logic ---
  void main() {
    vec2 uv = vUv;
    
    // 1. Barrel Distortion (Curvature)
    // We increase curvature slightly to give that bulbous tube look
    vec2 curvedUV = barrelDistortion(uv, curvature * 0.15);
    
    // Critical: Clip the edges to simulate a physical mask
    if (curvedUV.x < 0.0 || curvedUV.x > 1.0 || curvedUV.y < 0.0 || curvedUV.y > 1.0) {
      gl_FragColor = vec4(0.0, 0.0, 0.0, 1.0);
      return;
    }

    // 2. Rare Glitch / Sync Errors
    float glitchTrigger = step(0.998, random(vec2(floor(time * 0.5), 123.0))); // Rare temporal trigger
    float lineNoise = random(vec2(floor(curvedUV.y * 10.0), time)) * glitchTrigger * rareGlitchIntensity;
    vec2 glitchUV = curvedUV + vec2(lineNoise * 0.05, 0.0);

    // 3. Chromatic Aberration Pulse
    // A slow sine wave pulse for the RGB offset
    float pulse = (sin(time * 0.5) * 0.5 + 0.5) * chromaticPulseIntensity;
    float caAmount = 0.005 + pulse * 0.015;
    
    // Add interaction to CA if enabled
    if (interactionEnabled) {
      vec2 logicalFrag = gl_FragCoord.xy / (resolution.x / resolution.x); // simple ratio
      float dist = length((gl_FragCoord.xy) - vec2(mousePx.x, resolution.y - mousePx.y));
      float mouseEffect = 1.0 - smoothstep(0.0, radiusPx * 2.0, dist);
      caAmount += mouseEffect * effectScale * 0.02;
    }

    float r = texture2D(u_texture, glitchUV + vec2(caAmount, 0.0)).r;
    float g = texture2D(u_texture, glitchUV).g;
    float b = texture2D(u_texture, glitchUV - vec2(caAmount, 0.0)).b;
    vec3 color = vec3(r, g, b);

    // 4. Pixelation (if enabled)
    if (pixelationEnabled) {
      vec2 grid = resolution / pixelSize;
      vec2 pUV = floor(curvedUV * grid) / grid;
      color = texture2D(u_texture, pUV).rgb;
    }

    // 5. Dynamic Scanning Bands
    // Wide bands of brightness that slowly drift downwards
    float band = sin(curvedUV.y * 5.0 - time * 0.5) * 0.5 + 0.5;
    color *= 1.0 + (band * 0.15 * scanningBandIntensity);

    // 6. Scanlines
    float scanline = sin(curvedUV.y * resolution.y * 0.5) * 0.5 + 0.5;
    color *= mix(1.0 - scanlineIntensity, 1.0, scanline);

    // 7. RGB Phosphor Mask (3px stripes)
    // We use gl_FragCoord to ensure the stripes stay locked to screen pixels
    float xPos = gl_FragCoord.x;
    vec3 mask = vec3(1.0);
    float m = mod(xPos, 3.0);
    if (m < 1.0) mask = vec4(1.2, 0.8, 0.8, 1.0).rgb; // Reddish
    else if (m < 2.0) mask = vec4(0.8, 1.2, 0.8, 1.0).rgb; // Greenish
    else mask = vec4(0.8, 0.8, 1.2, 1.0).rgb; // Bluish
    
    color = mix(color, color * mask, phosphorIntensity);

    // 8. Vignette (Darkened corners)
    vec2 vuv = curvedUV * (1.0 - curvedUV.yx);
    float vig = vuv.x * vuv.y * 15.0;
    vig = pow(vig, 0.25);
    color *= mix(1.0, vig, vignetteIntensity);

    // 9. Global Brightness & Flicker
    float flicker = 1.0 + (random(vec2(time, 0.0)) - 0.5) * 0.02;
    color *= brightness * flicker;

    gl_FragColor = vec4(color, 1.0);
  }
`;
