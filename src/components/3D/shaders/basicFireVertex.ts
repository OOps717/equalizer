const vertexShader = `
precision highp float;

uniform float uTime;
uniform float uBass;

varying float vHeat;
varying float vHeight;

// 2D hash
float hash(vec2 p) {
    return fract(sin(dot(p, vec2(127.1,311.7))) * 43758.5453);
}

// Smooth noise
float noise(vec2 p) {
    vec2 i = floor(p);
    vec2 f = fract(p);
    vec2 u = f * f * (3.0 - 2.0 * f);

    return mix(
        mix(hash(i), hash(i + vec2(1.0,0.0)), u.x),
        mix(hash(i + vec2(0.0,1.0)), hash(i + vec2(1.0,1.0)), u.x),
        u.y
    );
}

void main() {
    vec3 pos = position;

    // height
    float h = clamp(pos.y * 0.5 + 0.5, 0.0, 1.0);
    vHeight = h;

    // fire intensity
    float intensity = pow(uBass, 2.0);

    // vertical rise
    float rise = h * (2.5 + intensity * 6.0);

    float n = noise(vec2(pos.x * 2.0, uTime * 1.2 + h * 3.0));
    float swirl = (n - 0.5) * (1.0 - h) * 1.2;

    pos.y += rise;
    pos.x += swirl;
    pos.z += swirl * 0.6;

    // "temperature"
    vHeat = clamp(h + intensity * 0.6, 0.0, 1.0);

    gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
    gl_PointSize = mix(18.0, 3.0, h);
}
`;

export default vertexShader;
