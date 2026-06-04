import * as THREE from "three";
import AudioPlayer from "./audioPlayer";
import vertexShader from "./shaders/basicFireVertex.ts";
import fragmentShader from "./shaders/basicFireFragment.ts";

type VisualMode = "basic" | "capsule" | "fire";
type EqualizerMaterials = {
  basic: THREE.PointsMaterial;
  capsule: THREE.PointsMaterial;
  fire: THREE.ShaderMaterial;
};

function average(array: ArrayLike<number>): number {
  let sum = 0;
  const len = array.length;

  for (let i = 0; i < len; i++) {
    sum += array[i];
  }

  return len > 0 ? sum / len : 0;
}

export default class Equalizer {
  public points: THREE.Points;
  public count: number;
  public radius: number;
  public directions: THREE.Vector3[];
  public audioPlayer: AudioPlayer;
  public smoothValues: Float32Array;
  public materials: EqualizerMaterials;
  public mode: VisualMode;

  private influences: Float32Array;
  private noiseOffsets: Float32Array;
  private fireLife!: Float32Array;
  private fireSpeed!: Float32Array;

  private lastTime: number = performance.now();

  constructor(
    count = 1000,
    radius = 3,
    mode: VisualMode,
    camera: THREE.PerspectiveCamera,
  ) {
    this.count = count;
    this.radius = radius;
    this.directions = [];
    this.audioPlayer = new AudioPlayer(camera);
    this.smoothValues = new Float32Array(count);
    this.influences = new Float32Array(count);

    for (let i = 0; i < count; i++) {
      this.influences[i] = 0.5 + Math.random() * 0.5; // 0.5–1
    }

    this.noiseOffsets = new Float32Array(count);
    for (let i = 0; i < count; i++) {
      this.noiseOffsets[i] = Math.random() * Math.PI * 2;
    }

    this.materials = this.createMaterials();

    this.initFireState();

    this.mode = mode;
    this.points = this.createPoints();
  }

  private createSphereGeometry(count: number, radius: number) {
    const positions = new Float32Array(count * 3);
    this.directions = [];

    for (let i = 0; i < count; i++) {
      const u = Math.random();
      const v = Math.random();

      const theta = 2 * Math.PI * u;
      const phi = Math.acos(2 * v - 1);

      const dir = new THREE.Vector3(
        Math.sin(phi) * Math.cos(theta),
        Math.sin(phi) * Math.sin(theta),
        Math.cos(phi),
      ).normalize();

      this.directions.push(dir);

      positions.set([dir.x * radius, dir.y * radius, dir.z * radius], i * 3);
    }

    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));

    return geometry;
  }

  private createPoints() {
    const geometry = this.createSphereGeometry(this.count, this.radius);

    if (this.mode === "capsule") {
      const colors = new Float32Array(this.count * 3);
      for (let i = 0; i < this.count; i++) {
        colors.set([1, 0.5, 0.1], i * 3);
      }
      geometry.setAttribute("color", new THREE.BufferAttribute(colors, 3));
    }

    return new THREE.Points(geometry, this.materials[this.mode]);
  }

  private createMaterials() {
    return {
      basic: new THREE.PointsMaterial({
        size: 0.08,
        opacity: 0.8,
        color: new THREE.Color(173 / 255, 216 / 255, 230 / 255),
      }),

      capsule: new THREE.PointsMaterial({
        size: 0.08,
        transparent: true,
        opacity: 0.85,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
        vertexColors: true,
      }),

      fire: new THREE.ShaderMaterial({
        transparent: true,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
        uniforms: {
          uTime: { value: 0 },
          uBass: { value: 0 },
          uRadius: { value: this.radius },
        },
        vertexShader,
        fragmentShader,
      }),
    };
  }

  private initFireState() {
    this.fireLife = new Float32Array(this.count);
    this.fireSpeed = new Float32Array(this.count);

    for (let i = 0; i < this.count; i++) {
      this.fireLife[i] = Math.random();
      this.fireSpeed[i] = 0.3 + Math.random();
    }
  }

  private getAudioBands() {
    const data = this.audioPlayer.analyser.getFrequencyData();

    return {
      bass: average(data.slice(0, 8)) / 255,
      mid: average(data.slice(8, 40)) / 255,
      high: average(data.slice(40, 80)) / 255,
      raw: data,
    };
  }

  animate() {
    switch (this.mode) {
      case "basic":
        this.animateBasicSphere();
        break;
      case "capsule":
        this.animateCapsule();
        break;
      case "fire":
        this.animateShaderFire();
        break;
      default:
        break;
    }
  }

  changeMode(mode: VisualMode): void {
    this.mode = mode;
    this.points.material = this.materials[this.mode];
    this.points.material.needsUpdate = true;

    if (this.mode === "capsule") {
      const colors = new Float32Array(this.count * 3);
      for (let i = 0; i < this.count; i++) {
        colors.set([1, 0.5, 0.1], i * 3);
      }
      this.points.geometry.setAttribute(
        "color",
        new THREE.BufferAttribute(colors, 3),
      );
      this.points.geometry.attributes.color.needsUpdate;
    } else this.points.geometry.deleteAttribute("color");
  }

  animateBasicSphere(strength = 2, smoothing = 0.1) {
    const { bass, mid, high } = this.getAudioBands();
    const volume = this.audioPlayer.sound.getVolume();
    const pos = this.points.geometry.attributes
      .position as THREE.BufferAttribute;

    for (let i = 0; i < this.count; i++) {
      // const target = raw[i % raw.length] / 255;
      const dir = this.directions[i];
      const latitude = Math.abs(dir.z);

      const freq = latitude > 0.7 ? bass : latitude > 0.3 ? mid : high;
      this.smoothValues[i] += (freq - this.smoothValues[i]) * smoothing;

      const d = this.smoothValues[i] * this.influences[i] * strength * volume;

      pos.setXYZ(
        i,
        dir.x * (this.radius + d),
        dir.y * (this.radius + d),
        dir.z * (this.radius + d),
      );
    }

    pos.needsUpdate = true;
  }

  animateCapsule(strength = 1, smoothing = 0.08) {
    const { bass, raw } = this.getAudioBands();
    const bassPulse = Math.pow(bass, 2.5);

    const now = performance.now();
    const dt = Math.min((now - this.lastTime) * 0.001, 0.033);
    this.lastTime = now;

    const pos = this.points.geometry.attributes
      .position as THREE.BufferAttribute;
    const col = this.points.geometry.attributes.color as THREE.BufferAttribute;

    for (let i = 0; i < this.count; i++) {
      const dir = this.directions[i];
      const freq = raw[i % raw.length] / 255;

      this.fireLife[i] += dt * this.fireSpeed[i] * (0.5 + bassPulse);
      if (this.fireLife[i] > 1) {
        this.fireLife[i] = 0;
        this.fireSpeed[i] = 0.4 + Math.random() * 0.6;
      }

      const life = this.fireLife[i];
      const rise = life * (4 + bassPulse * 6);

      this.smoothValues[i] += (freq - this.smoothValues[i]) * smoothing;
      const swirl =
        this.smoothValues[i] *
        strength *
        Math.sin(now * 0.001 + this.noiseOffsets[i]) *
        0.4;

      pos.setXYZ(
        i,
        dir.x * (this.radius + swirl),
        dir.y * this.radius + rise,
        dir.z * (this.radius + swirl),
      );

      const c = new THREE.Color().setHSL(
        0.08 - life * 0.08,
        1,
        0.15 + life * 0.7,
      );

      col.setXYZ(i, c.r, c.g, c.b);
    }

    pos.needsUpdate = true;
    col.needsUpdate = true;
  }

  animateShaderFire() {
    const { bass } = this.getAudioBands();
    const mat = this.points.material as THREE.ShaderMaterial;

    mat.uniforms.uTime.value = performance.now() * 0.001;
    mat.uniforms.uBass.value = bass;
  }

  control(key: string) {
    const curVolume = this.audioPlayer.sound.getVolume();
    switch (key) {
      case "+":
        if (curVolume < 2.0) this.audioPlayer.sound.setVolume(curVolume + 0.1);
        break;
      case "-":
        if (curVolume > 0.0) this.audioPlayer.sound.setVolume(curVolume - 0.1);
        break;
      case "1":
        this.changeMode("basic");
        break;
      case "2":
        this.changeMode("capsule");
        break;
      case "3":
        this.changeMode("fire");
        break;
      default:
        break;
    }
  }
}
