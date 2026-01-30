import { useEffect, useState, useRef } from "react";
import { initThree } from "./components/3D/main.js";

function App() {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const threeRef = useRef<ReturnType<typeof initThree> | null>(null);
  const loadedDataRef = useRef({
    play: false,
  });

  const [play, setPlay] = useState(false);

  const handleClick = () => {
    setPlay((prev) => !prev);
  };

  useEffect(() => {
    loadedDataRef.current.play = play;
  }, [play]);

  useEffect(() => {
    if (!containerRef.current) return;

    threeRef.current = initThree(containerRef.current, loadedDataRef.current);

    return () => {
      threeRef.current?.dispose();
      threeRef.current = null;
    };
  }, []);

  return (
    <div style={{ width: "100vw", height: "100vh", position: "relative" }}>
      <div
        className="ui"
        style={{
          position: "absolute",
          top: 20,
          right: 20,
          zIndex: 10,
        }}
      >
        <button className="btn btn-primary" onClick={handleClick}>
          {play ? "Pause" : "Play"}
        </button>
      </div>
      <div
        ref={containerRef}
        style={{
          width: "100%",
          height: "100%",
        }}
      />
    </div>
  );
}

export default App;
