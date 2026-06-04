import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import { createScene } from "./scene";
import { createRenderer } from "./renderer";

export function initThree(
  container: HTMLElement,
  loadedDataRef: { play: boolean },
) {
  const { scene, camera, equalizer } = createScene();
  const renderer = createRenderer(container);

  const canvas = renderer.domElement;
  let running = true;
  let playing = false;

  const controls = new OrbitControls(camera, canvas);

  const onResize = () => {
    const w = container.clientWidth;
    const h = container.clientHeight;

    camera.aspect = w / h;
    camera.updateProjectionMatrix();
    renderer.setSize(w, h);
  };
  window.addEventListener("resize", onResize);

  const onKeyDown = (event: KeyboardEvent) => {
    equalizer.control(event.key);
  };
  window.addEventListener("keydown", onKeyDown);

  const animate = () => {
    if (!running) return;

    if (playing !== loadedDataRef.play) {
      equalizer.audioPlayer.setPlay(loadedDataRef.play);
      playing = loadedDataRef.play;
    }
    equalizer.animate();

    controls.update();
    renderer.render(scene, camera);
    requestAnimationFrame(animate);
  };
  requestAnimationFrame(animate);

  return {
    dispose() {
      running = false;
      window.removeEventListener("resize", onResize);
      window.removeEventListener("keydown", onKeyDown);
      renderer.dispose();
      container.removeChild(renderer.domElement);
    },
  };
}
