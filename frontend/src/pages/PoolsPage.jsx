import Panel from "../components/Panel";
import SectionHead from "../components/SectionHead";
import Chip from "../components/Chip";
import PoolSimulator from "../components/PoolSimulator";
import SceneCard from "../components/SceneCard";
import PulseLog from "../components/PulseLog";

/** Pool mining section: locked until the sale sells out. */
export default function PoolsPage() {
  return (
    <section className="scroll-mt-24 px-4 py-12 pb-2 max-[640px]:px-3 max-[640px]:pt-9" id="pool">
      <div className="mx-auto max-w-[1180px]">
        <SectionHead
          title="⛏ POOL MINING"
          tag="DEPOSIT BNB — HARVEST VEIN — PRINCIPAL RETURNED"
        />

        <div className="mb-6 flex flex-wrap items-center gap-4 border-2 border-blood-dk bg-blood/8 px-4 py-3 shadow-[6px_6px_0_rgba(0,0,0,0.45)] max-[640px]:px-3">
          <span className="font-disp text-[0.72rem] leading-relaxed text-blood">
            ▚ POOLS LOCKED
          </span>
          <p className="m-0 flex-1 text-[0.95rem] text-mut">
            The pools deliberately open <b className="text-ink">after</b> the
            sale sells out. Because pool principal can return to participants,
            permanent liquidity must form from the sale first — so the pair is
            not shallow and easily drained.
          </p>
        </div>

        <div className="grid grid-cols-[1.05fr_1fr] gap-6 max-[900px]:grid-cols-1 max-[480px]:gap-4">
          <Panel title="SIMULATE YOUR DEPOSIT">
            <PoolSimulator />
          </Panel>

          <div className="flex min-w-0 flex-col gap-6 max-[480px]:gap-4">
            <SceneCard />
            <Panel title="PULSE LOG">
              <PulseLog />
            </Panel>
          </div>
        </div>
      </div>
    </section>
  );
}
