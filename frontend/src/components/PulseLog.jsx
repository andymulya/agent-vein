import { PULSE_LOG } from "../constants/vein";
import { useWibClock } from "../hooks/useWibClock";

const TAG_TONE = {
  sys: "bg-blood-dk text-[#ffd7de]",
  inf: "bg-[#2a1a47] text-mut",
  ok: "bg-[#0d4d36] text-[#b9ffe2]",
};

/** System pulse log with a live WIB clock. */
export default function PulseLog() {
  const clock = useWibClock();

  return (
    <div>
      <div className="mb-3 flex items-baseline justify-between gap-3">
        <h4 className="m-0 font-ui text-[0.95rem] font-bold tracking-wide">
          ■ PULSE LOG
        </h4>
        <span className="font-num text-[1.2rem] text-mut">{clock}</span>
      </div>
      {PULSE_LOG.map((row) => (
        <div
          key={row.tag}
          className="flex items-start gap-3 border-b-2 border-dotted border-[#2c1c4d] py-2.5 text-[0.9rem] last:border-b-0"
        >
          <span
            className={`mt-0.5 flex-none border-2 border-black px-2 py-1 font-ui text-[0.66rem] font-bold tracking-wide ${TAG_TONE[row.tone]}`}
          >
            {row.tag}
          </span>
          <span
            className="text-mut [&_b]:text-ink"
            dangerouslySetInnerHTML={{ __html: row.html }}
          />
        </div>
      ))}
    </div>
  );
}
