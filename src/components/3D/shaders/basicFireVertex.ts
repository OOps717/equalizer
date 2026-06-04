const vertexShader = `
precision highp float;

uniform float uTime;
uniform float uBass;
uniform float uRadius;

varying float vHeat;
varying float vHeight;
varying float vAlpha;

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
    float h = clamp(position.y / uRadius * 0.5 + 0.5, 0.0, 1.0);
    float radial = clamp(length(position.xz) / uRadius, 0.0, 1.0);
    float angle = atan(position.z, position.x);

    float bass = pow(uBass, 1.7);
    float verticalNoise = noise(vec2(angle * 2.0, h * 5.0 - uTime * 1.8));
    float sideNoise = noise(vec2(angle * 3.0 + uTime * 0.7, h * 7.0));
    float lickNoise = noise(vec2(position.x * 0.7 + uTime, position.z * 0.7 - uTime));

    float flameHeight = 7.5 + bass * 3.5;
    float taper = pow(1.0 - h, 1.45);
    float width = (0.18 + taper * 1.8) * (0.75 + bass * 0.35);

    vec3 pos = vec3(0.0);
    pos.y = h * flameHeight - 3.4;
    pos.y += (verticalNoise - 0.5) * (0.5 + h * 1.4 + bass);

    float swirl = (sideNoise - 0.5) * (1.0 - h) * (1.0 + bass);
    float lick = (lickNoise - 0.5) * h * (1.0 - h) * 1.8;
    float r = radial * width;

    pos.x = cos(angle + swirl * 0.8) * r + lick;
    pos.z = sin(angle + swirl * 0.8) * r + lick * 0.45;

    vHeight = h;
    vHeat = clamp(1.05 - h * 0.82 + bass * 0.35 + verticalNoise * 0.18, 0.0, 1.0);
    vAlpha = smoothstep(0.0, 0.12, h) * (1.0 - smoothstep(0.72, 1.0, h));
    vAlpha *= 0.45 + verticalNoise * 0.55;

    gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);

    vec4 mvPosition = modelViewMatrix * vec4(pos, 1.0);
    float size = mix(24.0, 5.0, h) * (0.8 + bass * 0.8);
    gl_PointSize = size * (20.0 / -mvPosition.z);
}
`;

export default vertexShader;
