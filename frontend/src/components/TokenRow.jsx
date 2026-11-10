/** One tokenomics row: name + note, segmented bar, % · amount. */
const TONE_COLORS = {
  blood: ["#a30f2c", "#ff2e4d"],
  gold: ["#c78f1d", "#ffc44d"],
  ember: ["#c4501f", "#ff7847"],
  violet: ["#5a3fa8", "#8b6cff"],
  mint: ["#14805c", "#5df0b0"],
};

export default function TokenRow({ row }) {
  const tone = TONE_COLORS[row.tone] || TONE_COLORS.blood;
  const filled = Math.round((40 * row.pct) / 100);

  return (
    <div className="grid grid-cols-[170px_1fr_118px] items-center gap-4 border-b-2 border-dotted border-[#2c1c4d] py-3 last:border-b-0 max-[900px]:grid-cols-1 max-[900px]:gap-2">
      <div className="font-ui text-[0.85rem] font-bold">
        {row.name}
        <small className="mt-1 block text-[0.72rem] font-normal tracking-wide text-dim">
          {row.note}
        </small>
      </div>
      <div className="flex h-[22px] gap-[3px]" aria-hidden="true">
        {Array.from({ length: 40 }, (_, i) => (
          <i
            key={i}
            className="flex-1 bg-[#241639]"
            style={i < filled ? { background: tone[i % 2] } : undefined}
          />
        ))}
      </div>
      <div className="text-right font-num text-2xl max-[900px]:text-left">
        {row.pct}% · {row.amount}
      </div>
    </div>
  );
}
