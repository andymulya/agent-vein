import Panel from "../components/Panel";
import SectionHead from "../components/SectionHead";
import Chip from "../components/Chip";
import SegmentedBar from "../components/SegmentedBar";
import ReferralBox from "../components/ReferralBox";
import PixelButton from "../components/PixelButton";
import { useToast } from "../contexts/ToastContext";
import { getClaimable } from "../services/preview";
import { fmt } from "../utils/format";

/** Claim + referral section. */
export default function ClaimPage() {
  const claimable = getClaimable();
  const { showPreviewToast } = useToast();

  return (
    <section className="scroll-mt-24 px-4 py-12 pb-2 max-[640px]:px-3 max-[640px]:pt-9" id="klaim">
      <div className="mx-auto max-w-[1180px]">
        <SectionHead title="✚ CLAIM & REFERRAL" tag="HARVEST YOUR PULSE REWARDS" />

        <div className="grid grid-cols-2 gap-6 max-[900px]:grid-cols-1 max-[480px]:gap-4">
          <Panel
            title="READY TO CLAIM"
            head={<Chip tone="gold">5% CLAIM FEE</Chip>}
          >
            <div className="font-num text-[3rem] leading-none text-gold max-[640px]:text-[2.3rem]">
              {fmt(claimable.vein)}{" "}
              <span className="text-[1.8rem]">$VEIN</span>
            </div>
            <p className="mt-1 text-[0.9rem] text-mut">
              + {claimable.bnbReturned} BNB returned
            </p>
            <p className="mt-3 text-[0.9rem] text-mut">
              Nothing to claim yet — the pools are still locked and the
              contract is not live.
            </p>

            <div className="mt-5">
              <div className="mb-2 flex flex-wrap justify-between gap-2">
                <span className="font-ui text-[0.78rem] font-bold tracking-wide text-mut">
                  UNLOCK SCHEDULE — POOL B (14-DAY VESTING)
                </span>
                <span className="font-ui text-[0.78rem] font-bold text-mint">
                  {claimable.unlockedPct}% UNLOCKED
                </span>
              </div>
              <SegmentedBar total={40} filled={0} tones={["f2", "f3", "f4"]} />
              <p className="mt-3 text-[0.88rem] text-mut">
                Pool B rewards vest second by second over 14 days. Pool A
                rewards can be claimed together with the principal return
                after 24 hours.
              </p>
            </div>

            <PixelButton className="mt-5 w-full" onClick={showPreviewToast}>
              ✚ CLAIM ALL
            </PixelButton>
          </Panel>

          <Panel
            title="REFERRAL"
            head={<Chip tone="mint">+1,000 VEIN / REFERRAL</Chip>}
          >
            <ReferralBox />
          </Panel>
        </div>
      </div>
    </section>
  );
}
