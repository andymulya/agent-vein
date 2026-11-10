/**
 * Segmented pixel progress bar (40 cells). `filled` cells cycle through
 * the given tone classes. Tones: "f1" | "f2" | "f3" | "f4".
 */
const TONE_BG = {
  f1: "bg-blood-dk",
  f2: "bg-blood",
  f3: "bg-ember",
  f4: "bg-gold",
};

export default function SegmentedBar({ total = 40, filled = 0, tones }) {
  return (
    <div className="flex h-[26px] gap-[3px]" aria-hidden="true">
      {Array.from({ length: total }, (_, i) => (
        <i
          key={i}
          className={`flex-1 border border-[#170d2a] bg-[#241639] ${
            i < filled ? TONE_BG[tones[i % tones.length]] : ""
          }`}
        />
      ))}
    </div>
  );
}
