import { useEffect, useRef } from "react";

/** Rising ember particles over the hero. Disabled on reduced motion. */
export default function EmberCanvas() {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !canvas.getContext) return undefined;
    const reduced =
      window.matchMedia &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduced) return undefined;

    const ctx = canvas.getContext("2d");
    const parts = [];
    let ew = 0;
    let eh = 0;
    let raf = 0;

    const size = () => {
      const hero = canvas.parentElement;
      ew = canvas.width = hero.clientWidth;
      eh = canvas.height = hero.clientHeight;
    };

    const spawn = (init) => ({
      x: Math.random() * ew,
      y: init ? Math.random() * eh : eh + 6,
      s: 2 + Math.random() * 3,
      v: 0.25 + Math.random() * 0.6,
      drift: Math.random() * 0.6 - 0.3,
      a: 0.25 + Math.random() * 0.5,
    });

    const tick = () => {
      ctx.clearRect(0, 0, ew, eh);
      for (let i = 0; i < parts.length; i++) {
        const p = parts[i];
        p.y -= p.v;
        p.x += p.drift + Math.sin((p.y + i * 30) / 46) * 0.18;
        if (p.y < -8) {
          parts[i] = spawn(false);
          continue;
        }
        ctx.globalAlpha = p.a;
        ctx.fillStyle = Math.random() > 0.22 ? "#ff2e4d" : "#ffc44d";
        ctx.fillRect(Math.round(p.x / 2) * 2, Math.round(p.y / 2) * 2, p.s, p.s);
      }
      ctx.globalAlpha = 1;
      raf = requestAnimationFrame(tick);
    };

    size();
    for (let j = 0; j < 36; j++) parts.push(spawn(true));
    window.addEventListener("resize", size);
    raf = requestAnimationFrame(tick);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", size);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 h-full w-full"
      aria-hidden="true"
    />
  );
}
