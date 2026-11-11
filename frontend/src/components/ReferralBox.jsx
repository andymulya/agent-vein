import { useEffect, useState } from "react";
import { useToast } from "../contexts/ToastContext";
import {
  getReferralStats,
  captureReferrerFromUrl,
  shortAddress,
} from "../services/preview";
import { fmt } from "../utils/format";

/** Referral link box + qualified-referral stats. */
export default function ReferralBox({ account }) {
  const { showToast } = useToast();
  const [stats, setStats] = useState({ qualified: 0, earned: 0 });
  const [referrer, setReferrer] = useState(null);

  // H2: a /r/<address> link now actually attaches — the referrer is read
  // from the URL and kept for this session, so the visitor's pool deposits
  // pay the inviter. Without this, the link was dead end-to-end.
  useEffect(() => {
    const ref = captureReferrerFromUrl();
    if (ref) setReferrer(ref);
  }, []);

  useEffect(() => {
    let alive = true;
    if (!account) {
      setStats({ qualified: 0, earned: 0 });
      return;
    }
    getReferralStats(account).then((s) => {
      if (alive) setStats(s);
    });
    return () => {
      alive = false;
    };
  }, [account]);

  const link = account
    ? `https://agent-miner-vein.vercel.app/r/${account}`
    : "vein.app/r/andymulya";

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(link);
      showToast("Referral link copied.");
    } catch {
      showToast("Copy failed — select the link and copy it manually.");
    }
  };

  return (
    <div>
      <p className="m-0 text-[0.95rem] text-mut">
        Share your link. The reward is a{" "}
        <b className="text-ink">flat 1,000 VEIN</b> for everyone — no tiers,
        never changes — so the network stays stable.
      </p>

      <div className="mt-4 flex flex-wrap gap-2.5">
        <div className="flex min-w-[220px] flex-1 items-stretch border-[3px] border-black bg-[#0a0516] shadow-[inset_3px_3px_0_rgba(0,0,0,0.7),4px_4px_0_rgba(0,0,0,0.45)] max-[640px]:min-w-0">
          <input
            readOnly
            value={link}
            aria-label="Referral link"
            className="min-w-0 flex-1 border-none bg-transparent px-3 py-2 font-ui text-[1.05rem] text-mut outline-none"
          />
        </div>
        <button
          type="button"
          onClick={copyLink}
          className="btn max-[480px]:w-full"
        >
          COPY
        </button>
      </div>

      <div className="mt-3 flex items-start gap-2.5 text-[0.9rem] text-mut">
        <span className="mt-1 h-4 w-4 flex-none bg-mint [clip-path:polygon(14%_44%,0_65%,40%_100%,100%_16%,84%_2%,38%_72%)]" />
        <span>
          A referral <b className="text-ink">only counts</b> after the wallet
          you invited has staked / mined{" "}
          <b className="text-ink">2× in Pool A or Pool B</b>.
        </span>
      </div>
      {referrer && (
        <p className="mt-2 text-[0.9rem] text-mut">
          You arrived via a referral link —{" "}
          <b className="text-mint">{shortAddress(referrer)}</b> will be
          recorded as your referrer when you deposit into a pool.
        </p>
      )}
      <p className="mt-2 text-[0.9rem] text-mut">
        This real-participation requirement closes the loophole for fake accounts
        that only farm rewards.
      </p>
      <p className="mt-2 text-[0.9rem] text-mut">
        Rewards are paid from the Community allocation (50M VEIN).
        {!account && " Connect your wallet to see your referrals."}
      </p>

      <div className="mt-4 grid grid-cols-2 gap-4 border-2 border-line">
        <div className="border-r-2 border-line px-4 py-3">
          <div className="font-num text-[1.65rem] leading-none">
            {fmt(stats.qualified)}
          </div>
          <div className="mt-1 font-ui text-[0.7rem] tracking-wide text-dim">
            QUALIFIED REFERRALS
          </div>
        </div>
        <div className="px-4 py-3">
          <div className="font-num text-[1.65rem] leading-none text-gold">
            {fmt(stats.earned)} VEIN
          </div>
          <div className="mt-1 font-ui text-[0.7rem] tracking-wide text-dim">
            REFERRAL REWARDS EARNED
          </div>
        </div>
      </div>
    </div>
  );
}
