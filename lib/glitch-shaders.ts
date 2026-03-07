/**
 * WebGL Shaders for GlitchGL
 * Extracted from glitchGL.js
 */

export const VERTEX_SHADER = `
  precision highp float;
  attribute vec2 position;
  attribute vec2 uv;
  uniform vec2 resolution;
  uniform float textureAspect;
  uniform bool aspectCorrectionEnabled;
  varying vec2 vUv;
  
  void main() {
    vec2 newUv = uv;
    if (aspectCorrectionEnabled && resolution.y > 0.0 && textureAspect > 0.0) {
        float containerAspect = resolution.x / resolution.y;
        if (containerAspect < textureAspect) {
            newUv.x = (uv.x - 0.5) * (containerAspect / textureAspect) + 0.5;
        } else {
            newUv.y = (uv.y - 0.5) * (textureAspect / containerAspect) + 0.5;
        }
    }
    vUv = newUv;
    gl_Position = vec4(position, 0.0, 1.0);
  }
`;

export const FRAGMENT_SHADER_COMBINED = `
  precision mediump float;
  uniform sampler2D u_texture;
  uniform highp vec2 resolution;
  uniform float time;
  uniform float intensity;
  
  uniform bool pixelationEnabled;
  uniform bool crtEnabled;
  uniform bool glitchEnabled;
  
  // PIXELATION UNIFORMS
  uniform float pixelSize;
  uniform int pixelShape;
  uniform int bitDepth;
  uniform int dithering;
  uniform int pixelDirection;
  uniform int isText;
  uniform bool pixelSizeInteractive;
  
  // CRT UNIFORMS
  uniform float scanlineIntensity;
  uniform float scanlineThickness;
  uniform float scanlineCount;
  uniform float phosphorGlow;
  uniform float curvature;
  uniform float chromaticAberration;
  uniform float brightness;
  uniform bool flicker;
  uniform float flickerIntensity;
  uniform bool lineMovement;
  uniform float lineSpeed;
  uniform int lineDirection;
  uniform bool chromaticAberrationInteractive;
  uniform bool scanlinesInteractive;
  uniform bool phosphorGlowInteractive;
  uniform bool curvatureInteractive;
  
  // GLITCH UNIFORMS
  uniform float rgbShift;
  uniform float digitalNoise;
  uniform float lineDisplacement;
  uniform float bitCrushDepth;
  uniform float signalDropoutFreq;
  uniform float signalDropoutSize;
  uniform float syncErrorFreq;
  uniform float syncErrorAmount;
  uniform float interferenceSpeed;
  uniform float interferenceIntensity;
  uniform float frameGhostAmount;
  uniform float stutterFreq;
  uniform float datamoshStrength;
  uniform bool rgbShiftInteractive;
  uniform bool digitalNoiseInteractive;
  uniform bool lineDisplacementInteractive;
  uniform bool bitCrushInteractive;
  uniform bool signalDropoutInteractive;
  uniform bool syncErrorsInteractive;
  uniform bool interferenceLinesInteractive;
  uniform bool frameGhostingInteractive;
  uniform bool stutterFreezeInteractive;
  uniform bool datamoshingInteractive;

  // SHARED INTERACTION UNIFORMS
  uniform bool interactionEnabled;
  uniform int interactionShape;
  uniform vec2 mousePx;
  uniform float radiusPx;
  uniform float pixelRatio;
  uniform float effectScale;
  
  varying vec2 vUv;
  
  float random(vec2 st) {
    return fract(sin(dot(st.xy, vec2(12.9898, 78.233))) * 43758.5453123);
  }
  
  float random3(vec3 st) {
    return fract(sin(dot(st.xyz, vec3(12.9898, 78.233, 37.719))) * 43758.5453123);
  }
  
  float getInteractionEffect(vec2 fragCoord, vec2 mousePositionPx, float radius) {
    vec2 logicalFragCoord = fragCoord / pixelRatio;
    vec2 offset = logicalFragCoord - mousePositionPx;
    float dist = length(offset);
    
    float scaledRadius = radius * effectScale;
    if (scaledRadius <= 0.0) return 0.0;

    if (interactionShape == 1) {
      float maxDist = max(abs(offset.x), abs(offset.y));
      return 1.0 - smoothstep(0.0, scaledRadius, maxDist);
    } else if (interactionShape == 2) {
      float diamondDist = abs(offset.x) + abs(offset.y);
      return 1.0 - smoothstep(0.0, scaledRadius, diamondDist);
    } else {
      return 1.0 - smoothstep(0.0, scaledRadius, dist);
    }
  }
  
  vec3 applyBitDepth(vec3 color) {
    if (bitDepth == 1) {
      float gray = dot(color, vec3(0.299, 0.587, 0.114));
      return vec3(step(0.5, gray));
    } else if (bitDepth == 2) {
      return floor(color * 15.0) / 15.0;
    } else if (bitDepth == 3) {
      return floor(color * 255.0) / 255.0;
    }
    return color;
  }
  
  vec3 applyDithering(vec3 color, vec2 screenPos) {
    if (dithering == 1) {
      vec3 quantized = floor(color * 8.0) / 8.0;
      vec3 error = color - quantized;
      float threshold = random(screenPos) * 0.5;
      return quantized + step(threshold, length(error)) * (error * 0.5);
    }
    return color;
  }

  float getPixelShapeMask(vec2 pixelUV) {
    vec2 center = vec2(0.5);
    vec2 offset = pixelUV - center;
    if (pixelShape == 1) return 1.0 - smoothstep(0.3, 0.5, length(offset));
    if (pixelShape == 2) return 1.0 - smoothstep(0.3, 0.5, abs(offset.x) + abs(offset.y));
    return 1.0;
  }

  vec4 applyPixelation(vec2 uv, vec4 inputColor, float mouseEffect, float interactionMultiplier) {
    float effectivePixelSize = pixelSize;
    if (interactionEnabled && pixelSizeInteractive) {
      effectivePixelSize = max(1.0, pixelSize * (1.0 - mouseEffect * intensity * 0.9));
    }
    vec2 referenceRes = vec2(1920.0, 1080.0);
    float scaleFactor = min(resolution.x / referenceRes.x, resolution.y / referenceRes.y);
    float normalizedPixelSize = effectivePixelSize * scaleFactor;
    vec2 pixelCount = resolution / normalizedPixelSize;
    vec2 pixelated_uv = floor(uv * pixelCount) / pixelCount;
    vec4 pixelatedSample = texture2D(u_texture, pixelated_uv);
    vec3 color = pixelatedSample.rgb;
    float alpha = pixelatedSample.a;
    if (pixelShape != 0 && alpha > 0.0) {
      vec2 pixelUV = fract(uv * pixelCount);
      float shapeMask = getPixelShapeMask(pixelUV);
      color = mix(inputColor.rgb, pixelatedSample.rgb, shapeMask);
    }
    color = applyBitDepth(color);
    color = applyDithering(color, gl_FragCoord.xy);
    return vec4(color, alpha);
  }

  void main() {
    vec2 uv = vUv;
    float mouseEffect = 0.0;
    float interactionMultiplier = 1.0;
    if (interactionEnabled) {
      mouseEffect = getInteractionEffect(gl_FragCoord.xy, mousePx, radiusPx);
      interactionMultiplier = 1.0 + (mouseEffect * intensity);
    }

    vec2 curvedUV = uv;
    if (crtEnabled && curvature > 0.0) {
      vec2 cuv = uv * 2.0 - 1.0;
      vec2 offset = abs(cuv.yx) * curvature / 20.0;
      cuv = cuv + cuv * offset * offset;
      curvedUV = cuv * 0.5 + 0.5;
    }

    vec4 color = texture2D(u_texture, curvedUV);
    if (pixelationEnabled) {
      color = applyPixelation(curvedUV, color, mouseEffect, interactionMultiplier);
    }

    // Simplified CRT effect for brightness/scanlines
    if (crtEnabled) {
      float scanline = sin(curvedUV.y * scanlineCount * 6.28) * 0.5 + 0.5;
      color.rgb *= mix(1.0 - scanlineIntensity, 1.0, scanline);
      color.rgb *= brightness;
    }

    gl_FragColor = color;
  }
`;
