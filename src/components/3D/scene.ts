import * as THREE from "three";
import Equalizer from "./equalizer.js";

export function createScene(): {
  scene: THREE.Scene;
  camera: THREE.PerspectiveCamera;
  equalizer: Equalizer;
} {
  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0x404040);

  const camera = new THREE.PerspectiveCamera(
    60,
    window.innerWidth / window.innerHeight,
    0.1,
    100,
  );
  camera.position.set(20, 0, 0);
  camera.lookAt(0, 0, 0);

  scene.add(new THREE.AmbientLight(0xffffff, 0.6));

  const light = new THREE.DirectionalLight(0xffffff, 1);
  light.position.set(20, 20, 20);
  light.castShadow = true;
  light.shadow.mapSize.width = 1024;
  light.shadow.mapSize.height = 1024;

  light.shadow.camera.near = 0.5;
  light.shadow.camera.far = 50;
  scene.add(light);

  const equalizer = new Equalizer(100000, 5, "basic", camera);
  scene.add(equalizer.points);

  return { scene, camera, equalizer };
}
