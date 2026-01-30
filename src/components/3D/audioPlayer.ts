import * as THREE from "three";

export default class AudioPlayer {
  public listener: THREE.AudioListener;
  public sound: THREE.Audio;
  public audioLoader: THREE.AudioLoader;
  public analyser: THREE.AudioAnalyser;

  constructor(camera: THREE.PerspectiveCamera) {
    this.listener = new THREE.AudioListener();
    camera.add(this.listener);

    this.sound = new THREE.Audio(this.listener);
    this.audioLoader = new THREE.AudioLoader();
    this.audioLoader.load(
      "sounds/Marlon_Hoffstadt_-_Call_Me.mp3",
      (buffer) => {
        this.sound.setBuffer(buffer);
        this.sound.setLoop(true);
        this.sound.setVolume(0.5);
      },
      undefined,
      (error) => {
        console.error("Audio load error", error);
      },
    );
    this.analyser = new THREE.AudioAnalyser(this.sound, 128);
  }

  setPlay(value: boolean) {
    if (value) {
      if (!this.sound.isPlaying) {
        this.sound.play();
      }
    } else {
      this.sound.pause();
    }
  }
}
