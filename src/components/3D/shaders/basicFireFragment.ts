const fragmentShader = `
precision highp float;

uniform float uBass;
varying float vHeat;
varying float vHeight;

// Blackbody-like fire color
vec3 fireColor(float t) {
    t = clamp(t, 0.0, 1.0);
    return mix(
        vec3(0.2, 0.02, 0.01),                  // dark red
        mix(
            vec3(1.0, 0.3, 0.05),               // orange
            vec3(1.0, 1.0, 0.8),                // white
            smoothstep(0.4, 1.0, t)
        ),
        t
    );
}

void main() {
    vec2 uv = gl_PointCoord - 0.5;
    float d = length(uv);

    // form (usage of Hermite interpolation)
    float shape = smoothstep(0.5, 0.15, d);
    shape *= smoothstep(0.0, 0.8, vHeight);

    // fading on top
    shape *= 1.0 - pow(vHeight, 1.3);

    vec3 color = fireColor(vHeat);

    // glowing
    float glow = pow(shape, 1.6);
    color *= 1.5 + uBass * 2.5;

    gl_FragColor = vec4(color, glow);
}`;

export default fragmentShader;
