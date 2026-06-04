const fragmentShader = `
precision highp float;

uniform float uBass;
varying float vHeat;
varying float vHeight;
varying float vAlpha;

vec3 fireColor(float t) {
    t = clamp(t, 0.0, 1.0);
    return mix(
        vec3(0.32, 0.025, 0.005),
        mix(
            vec3(1.0, 0.28, 0.025),
            vec3(1.0, 0.92, 0.45),
            smoothstep(0.4, 1.0, t)
        ),
        t
    );
}

void main() {
    vec2 uv = gl_PointCoord - 0.5;
    float d = length(uv);

    float core = smoothstep(0.48, 0.05, d);
    float emberEdge = smoothstep(0.5, 0.28, d);
    float flameMask = mix(emberEdge, core, smoothstep(0.0, 0.55, vHeat));

    float topFade = 1.0 - smoothstep(0.72, 1.0, vHeight);
    float baseFade = smoothstep(0.0, 0.08, vHeight);
    float alpha = flameMask * topFade * baseFade * vAlpha;

    vec3 color = fireColor(vHeat);
    color *= 1.15 + uBass * 1.9;
    color += vec3(1.0, 0.22, 0.02) * pow(core, 2.0) * 0.45;

    if (alpha < 0.01) discard;

    gl_FragColor = vec4(color, alpha);
}`;

export default fragmentShader;
