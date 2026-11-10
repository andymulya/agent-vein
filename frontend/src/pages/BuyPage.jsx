import Panel from "../components/Panel";
import SectionHead from "../components/SectionHead";
import BuyCalculator from "../components/BuyCalculator";
import SegmentedBar from "../components/SegmentedBar";
import Chip from "../components/Chip";
import { getSaleStatus } from "../services/preview";
import { fmt, fmtBnb } from "../utils/format";
import {
  SALE_PRICE,
  SALE_ALLOCATION,
  SALE_MAX_TARGET_USD,
  LIQUIDITY_ALLOCATION,
} from "../constants/vein";

/** Buy section: fixed-price sale calculator + live sale status. */
export default function BuyPage() {
  const sale = getSaleStatus();

  return (
    <section className="scroll-mt-24 px-4 py-12 pb-2 max-[640px]:px-3 max-[640px]:pt-9" id="beli">
      <div className="mx-auto max-w-[1180px]">
        <SectionHead
          title="▣ BUY $VEIN"
          tag="FIXED PRICE $0.0001 — NO TIME LIMIT, UNTIL THE ALLOCATION RUNS OUT"
        />

        <div className="grid grid-cols-2 gap-6 max-[900px]:grid-cols-1 max-[480px]:gap-4">
          <Panel
            title="BUY NOW"
            head={<Chip tone="gold">AGENT ID ONLY</Chip>}
          >
            <BuyCalculator />
          </Panel>

          <Panel
            title="SALE STATUS"
            head={<Chip tone="red">AWAITING LAUNCH</Chip>}
          >
            <div className="font-num text-[2rem] leading-none max-[640px]:text-[1.55rem]">
              {fmt(sale.sold)}
              <span className="text-[1.5rem] text-gold max-[640px]:text-[1.25rem]">
                {" "}
                / {fmt(SALE_ALLOCATION)} VEIN
              </span>
            </div>
            <div className="mt-3">
              <SegmentedBar total={40} filled={0} tones={["f1", "f2", "f3", "f4"]} />
            </div>
            <div className="mt-4 grid grid-cols-2 border-2 border-line">
              {[
                { v: `$${fmt(SALE_MAX_TARGET_USD)}`, k: "MAX TARGET — 200M VEIN" },
                { v: `${fmt(LIQUIDITY_ALLOCATION / 1_000_000)}M`, k: "VEIN LIQUIDITY ALLOCATION PAIRED IN" },
                { v: "∞", k: "TIME LIMIT — NONE" },
                { v: "PANCAKE", k: "PERMANENT LP ON PANCAKESWAP" },
              ].map((s, i) => (
                <div
                  key={s.k}
                  className={`px-4 py-3 ${i % 2 === 1 ? "border-l-2 border-line" : ""} ${i >= 2 ? "border-t-2 border-line" : ""}`}
                >
                  <div className="font-num text-[1.65rem] leading-tight max-[480px]:text-[1.35rem]">
                    {s.v}
                  </div>
                  <div className="mt-1 font-ui text-[0.7rem] tracking-wide text-dim">
                    {s.k}
                  </div>
                </div>
              ))}
            </div>
            <p className="mt-4 text-[0.9rem] text-mut">
              Pool A &amp; Pool B stay locked while the sale runs — the pools
              start pulsing only after all 200M VEIN are sold and the LP is
              formed.
            </p>
            <p className="mt-2 text-[0.9rem] text-mut">
              There is no countdown. The sale stops only when the allocation
              runs out.
            </p>
          </Panel>
        </div>
      </div>
    </section>
  );
}
