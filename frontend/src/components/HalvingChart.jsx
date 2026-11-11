import { fmt } from "../utils/format";

/** Reward halving chart — 10 epochs, base reward halves each epoch. */
export default function HalvingChart({ pool }) {
  const epochs = 10;

  return (
    <div className="mt-6">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h4 className="m-0 font-ui text-[0.95rem] font-bold tracking-wide">
          HALVING — <span className="text-blood">{pool.name}</span>
        </h4>
        <span className="font-ui text-[0.72rem] text-dim">
          epoch 1: {fmt(pool.reward)} VEIN / share
        </span>
      </div>
      <p className="mt-2 text-[0.88rem] text-mut">
        Every share mined in either pool raises the shared share height. The
        base reward halves every 150,000 shares. A deposit uses the reward
        rate of the epoch it lands in for the whole batch — a batch crossing
        a halving boundary is <b>not</b> split between rates.
      </p>
      <div className="flex h-[170px] items-end gap-1.5 pt-2 max-[480px]:h-[140px] max-[480px]:gap-1">
        {Array.from({ length: epochs }, (_, e) => {
          // Integer halving, like the contract (base >> epoch) — the tail
          // epochs are 2, 1, then 0, not fractions.
          const reward = Math.floor(pool.reward / Math.pow(2, e));
          return (
            <div
              key={e}
              className={`flex h-full flex-1 flex-col items-center justify-end gap-2 ${e === 0 ? "first" : ""}`}
            >
              <div
                className={`w-full max-w-11 border-2 border-b-0 border-line2 bg-[repeating-linear-gradient(180deg,#2a1a47_0_10px,#1d1133_10px_12px)] ${
                  e === 0
                    ? "!border-blood bg-[repeating-linear-gradient(180deg,rgba(255,46,77,0.85)_0_10px,rgba(163,15,44,0.85)_10px_12px)] shadow-[0_0_14px_rgba(255,46,77,0.35)]"
                    : ""
                }`}
                style={{ height: `${Math.max(8, (reward / pool.reward) * 118)}px` }}
              />
              <div className="text-center font-ui text-[0.68rem] text-dim max-[480px]:text-[0.6rem]">
                <b className="block text-[0.78rem] text-mut max-[480px]:text-[0.7rem]">{e + 1}</b>
                {reward >= 100
                  ? fmt(reward)
                  : reward.toLocaleString("en-US", { maximumFractionDigits: 1 })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
