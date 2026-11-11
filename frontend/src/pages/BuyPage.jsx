import { useEffect, useState } from "react";
import Panel from "../components/Panel";
import SectionHead from "../components/SectionHead";
import BuyCalculator from "../components/BuyCalculator";
import SegmentedBar from "../components/SegmentedBar";
import Chip from "../components/Chip";
import { getSaleStatus, getFreePhase } from "../services/preview";
import { fmt, fmtBnb } from "../utils/format";
import {
  SALE_PRICE,
  SALE_ALLOCATION,
  SALE_MAX_TARGET_USD,
  LIQUIDITY_ALLOCATION,
  VEIN_PER_SHARE,
  TOTAL_MINT_SHARES,
  FREE_SHARES,
  FREE_MINT_AMOUNT,
} from "../constants/vein";

/** Buy section: fixed-price sale calculator + live sale status. */
export default function BuyPage() {
  const [sale, setSale] = useState({
    sold: 0,
    allocation: SALE_ALLOCATION,
    pct: 0,
    status: "LOADING…",
    poolsOpen: false,
    proceedsBnb: 0,
  });
  const [freePhase, setFreePhase] = useState({
    claimed: 0,
    total: FREE_SHARES,
    pct: 0,
    status: "COMING SOON",
    live: false,
  });

  useEffect(() => {
    let alive = true;
    getSaleStatus().then((s) => {
      if (alive) setSale(s);
    });
    getFreePhase().then((f) => {
      if (alive) setFreePhase(f);
    });
    const t = setInterval(() => {
      getSaleStatus().then((s) => {
        if (alive) setSale(s);
      });
      getFreePhase().then((f) => {
        if (alive) setFreePhase(f);
      });
    }, 30000);
    return () => {
      alive = false;
      clearInterval(t);
    };
  }, []);

  const filled = Math.min(40, Math.round((sale.pct / 100) * 40));
  const freeFilled = Math.min(
    40,
    Math.round((freePhase.pct / 100) * 40),
  );

  return (
    <section className="scroll-mt-24 px-4 py-12 pb-2 max-[640px]:px-3 max-[640px]:pt-9" id="beli">
      <div className="mx-auto max-w-[1180px]">
        <SectionHead
          title="▣ MINT $VEIN"
          tag="FIXED PRICE $0.0001 — NO TIME LIMIT, UNTIL THE ALLOCATION RUNS OUT"
        />

        <div className="grid grid-cols-2 gap-6 max-[900px]:grid-cols-1 max-[480px]:gap-4">
          <Panel
            title="MINT NOW"
            head={<Chip tone="gold">AGENT ID ONLY</Chip>}
          >
            <BuyCalculator />
          </Panel>

          <Panel
            title="SALE STATUS"
            head={<Chip tone="red">{sale.status}</Chip>}
          >
            <div className="font-num text-[2rem] leading-none max-[640px]:text-[1.55rem]">
              {fmt(sale.sold / VEIN_PER_SHARE)}
              <span className="text-[1.5rem] text-gold max-[640px]:text-[1.25rem]">
                {" "}
                / {fmt(TOTAL_MINT_SHARES)} SHARES
              </span>
            </div>
            <div className="mt-2 font-num text-[1.35rem] leading-none text-gold max-[640px]:text-[1.15rem]">
              {fmt((sale.allocation - sale.sold) / VEIN_PER_SHARE)} SHARES
              REMAINING
            </div>
            <div className="mt-3">
              <SegmentedBar total={40} filled={filled} tones={["f1", "f2", "f3", "f4"]} />
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
              start pulsing once 20% of the sale (8,000 shares) is sold and
              the first LP is seeded. {fmtBnb(sale.proceedsBnb)} BNB collected so far.
            </p>
            <div className="mt-5 border-t-2 border-line pt-4">
              <div className="flex items-center justify-between gap-2">
                <div className="font-ui text-[0.78rem] font-bold tracking-wide text-mut">
                  FREE PHASE — FIRST 1,000 MINTS
                </div>
                <Chip
                  tone={
                    freePhase.status === "LIVE"
                      ? "mint"
                      : freePhase.status === "ENDED"
                        ? "red"
                        : "gold"
                  }
                >
                  {freePhase.status}
                </Chip>
              </div>
              <div className="mt-2 font-num text-[1.5rem] leading-none max-[640px]:text-[1.25rem]">
                {fmt(freePhase.claimed)}
                <span className="text-[1.15rem] text-gold max-[640px]:text-[1rem]">
                  {" "}
                  / {fmt(freePhase.total)} FREE SHARES
                </span>
              </div>
              <div className="mt-3">
                <SegmentedBar
                  total={40}
                  filled={freeFilled}
                  tones={["f1", "f2", "f3", "f4"]}
                />
              </div>
              <p className="mt-3 text-[0.9rem] text-mut">
                {freePhase.live
                  ? freePhase.status === "ENDED"
                    ? "Free phase is over — minting continues at $0.0001."
                    : `First 1,000 Agent wallets mint 1 free share (${fmt(FREE_MINT_AMOUNT)} VEIN). When the counter hits 1,000, the free phase ends.`
                  : `First 1,000 Agent wallets mint 1 free share (${fmt(FREE_MINT_AMOUNT)} VEIN) — starts with the v2 upgrade. When the counter hits 1,000, the free phase ends.`}
              </p>
            </div>
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
