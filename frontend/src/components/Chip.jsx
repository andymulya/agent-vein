/** Small labeled tag. Tone: "red" | "gold" | "mint" | default. */
export default function Chip({ children, tone, className = "" }) {
  const toneClass =
    tone === "red"
      ? "border-blood-dk bg-blood/10 text-[#ffb3c0]"
      : tone === "gold"
        ? "border-[#8a5f14] bg-gold/8 text-gold"
        : tone === "mint"
          ? "border-[#14624a] bg-mint/8 text-mint"
          : "border-line2 bg-panel2 text-mut";
  return (
    <span
      className={`inline-flex items-center gap-2 border-2 px-2.5 py-1.5 font-ui text-[0.72rem] font-bold tracking-wide ${toneClass} ${className}`}
    >
      {children}
    </span>
  );
}
