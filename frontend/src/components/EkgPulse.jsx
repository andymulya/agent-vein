import { useEffect, useRef, useState } from "react";

/**
 * Animated pixel EKG pulse line with a live BPM readout.
 * Draws on a canvas; respects prefers-reduced-motion (static trace).
 */
export default function EkgPulse() {
  const canvasRef = useRef(null);
  const [bpm, setBpm] = useState(72);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !canvas.getContext) return undefined;
    const ctx = canvas.getContext("2d");
    const W = canvas.width;
    const H = canvas.height;
    const reduced =
      window.matchMedia &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    let x = 0;
    const pts = [];

    const wave = (t) => {
      const c = t % 120;
      if (c < 46) return 0;
      if (c < 52) return -3;
      if (c < 58) return 5;
      if (c < 66) return -22;
      if (c < 74) return 8;
      if (c < 84) return -2;
      return 0;
    };

    const draw = () => {
      ctx.clearRect(0, 0, W, H);
      ctx.strokeStyle = "rgba(255,46,77,.16)";
      ctx.lineWidth = 1;
      for (let gy = 8; gy < H; gy += 10) {
        ctx.beginPath();
        ctx.moveTo(0, gy);
        ctx.lineTo(W, gy);
        ctx.stroke();
      }
      ctx.strokeStyle = "#ff2e4d";
      ctx.lineWidth = 2.5;
      ctx.shadowColor = "#ff2e4d";
      ctx.shadowBlur = 7;
      ctx.beginPath();
      for (let i = 0; i < pts.length; i++) {
        const px = i * 4;
        const py = H / 2 + pts[i];
        const sx = Math.round(px / 4) * 4;
        const sy = Math.round(py / 2) * 2;
        if (i === 0) ctx.moveTo(sx, sy);
        else ctx.lineTo(sx, sy);
      }
      ctx.stroke();
      ctx.shadowBlur = 0;
      const lx = (pts.length - 1) * 4;
      ctx.fillStyle = "#ffc44d";
      ctx.fillRect(lx - 3, H / 2 + pts[pts.length - 1] - 3, 6, 6);
    };

    const step = () => {
      pts.push(wave(x));
      x += 2;
      if (pts.length > W / 4) pts.shift();
      if (x % 120 === 0) setBpm(68 + Math.floor(Math.random() * 10));
      draw();
    };

    if (reduced) {
      for (let i = 0; i < W / 4; i++) step();
      return undefined;
    }
    const id = setInterval(step, 42);
    return () => clearInterval(id);
  }, []);

  return (
    <>
      <span className="whitespace-nowrap font-ui text-[0.72rem] font-bold tracking-[0.12em] text-blood max-[520px]:hidden">
        NETWORK PULSE
      </span>
      <canvas
        ref={canvasRef}
        width={640}
        height={38}
        className="h-[38px] min-w-[120px] flex-1 max-[640px]:min-w-0"
      />
      <span className="whitespace-nowrap font-num text-2xl leading-none text-mint max-[640px]:text-xl">
        {bpm} <small className="text-[0.95rem] text-dim">BPM</small>
      </span>
    </>
  );
}
