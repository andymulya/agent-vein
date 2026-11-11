import { useEffect, useState } from "react";
import Panel from "../components/Panel";
import SectionHead from "../components/SectionHead";
import Chip from "../components/Chip";
import SegmentedBar from "../components/SegmentedBar";
import ReferralBox from "../components/ReferralBox";
import PixelButton from "../components/PixelButton";
import { useToast } from "../contexts/ToastContext";
import {
  getClaimable,
  getConnectedAccount,
  connectWallet,
  claimAll,
  withdrawPoolB,
} from "../services/preview";
import { fmt, fmtBnb } from "../utils/format";

/** Claim + referral section. */
export default function ClaimPage() {
  const [claimable, setClaimable] = useState({
    vein: 0,
    bnbReturned: 0,
    unlockedPct: 0,
    claims: [],
    withdrawable: [],
    error: false,
  });
  const [account, setAccount] = useState(null);
  const [busy, setBusy] = useState(false);
  const [withdrawing, setWithdrawing] = useState(null);
  const { showToast } = useToast();

  useEffect(() => {
    let alive = true;
    getConnectedAccount().then((a) => {
      if (alive) setAccount(a);
    });
    return () => {
      alive = false;
    };
  }, []);

  useEffect(() => {
    let alive = true;
    if (!account) {
      setClaimable({ vein: 0, bnbReturned: 0, unlockedPct: 0, claims: [], withdrawable: [], error: false });
      return;
    }
    getClaimable(account).then((c) => {
      if (alive) setClaimable(c);
    });
    const t = setInterval(() => {
      getClaimable(account).then((c) => {
        if (alive) setClaimable(c);
      });
    }, 30000);
    return () => {
      alive = false;
      clearInterval(t);
    };
  }, [account]);

  const refreshClaimable = async (acc) => {
    const updated = await getClaimable(acc);
    setClaimable(updated);
  };

  const onWithdrawB = async (id) => {
    if (withdrawing !== null) return;
    setWithdrawing(id);
    try {
      const hash = await withdrawPoolB(id);
      showToast(
        `<span style="color:#7dffa8">WITHDRAW SENT</span> — Pool B position #${id}. Tx ${hash.slice(0, 10)}…${hash.slice(-6)}. Confirm it in your wallet.`,
      );
      await refreshClaimable(account);
    } catch (e) {
      showToast(`Withdraw failed: ${String(e?.message || e).slice(0, 120)}`);
    } finally {
      setWithdrawing(null);
    }
  };

  const onClaimAll = async () => {
    if (busy) return;
    setBusy(true);
    try {
      let acc = account;
      if (!acc) {
        showToast("Connect your Agent Wallet first — check your wallet popup.");
        acc = await connectWallet();
        setAccount(acc);
      }
      const fresh = await getClaimable(acc);
      if (!fresh.claims.length) {
        showToast("Nothing claimable yet — Pool A needs 24h after deposit, Pool B vests over 14 days.");
        return;
      }
      const txs = await claimAll(acc);
      showToast(
        `<span style="color:#7dffa8">CLAIM SENT</span> — ${txs.length} transaction(s). Confirm each in your wallet.`,
      );
      const updated = await getClaimable(acc);
      setClaimable(updated);
    } catch (e) {
      showToast(`Claim failed: ${String(e?.message || e).slice(0, 120)}`);
    } finally {
      setBusy(false);
    }
  };

  const filled = Math.min(40, Math.round((claimable.unlockedPct / 100) * 40));

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
              + {fmtBnb(claimable.bnbReturned)} BNB returned
            </p>
            {claimable.error ? (
              <div className="mt-3 border-2 border-blood bg-blood/10 px-3 py-2.5">
                <p className="m-0 text-[0.9rem] text-white">
                  Couldn&apos;t load your positions — the chain read failed.
                  The zero above may be wrong.
                </p>
                <button
                  type="button"
                  onClick={() => account && refreshClaimable(account)}
                  className="btn mt-2"
                >
                  RETRY
                </button>
              </div>
            ) : (
              <p className="mt-3 text-[0.9rem] text-mut">
                {account
                  ? claimable.claims.length
                    ? `${claimable.claims.length} position(s) ready to claim. Pool A pays reward + 95% principal after 24 hours; Pool B rewards vest over 14 days.`
                    : "Nothing to claim yet — the pools open once 20% of the sale (8,000 shares) is sold."
                  : "Connect your Agent Wallet to see what you can claim."}
              </p>
            )}

            <div className="mt-5">
              <div className="mb-2 flex flex-wrap justify-between gap-2">
                <span className="font-ui text-[0.78rem] font-bold tracking-wide text-mut">
                  UNLOCK SCHEDULE — POOL B (14-DAY VESTING)
                </span>
                <span className="font-ui text-[0.78rem] font-bold text-mint">
                  {claimable.unlockedPct}% UNLOCKED
                </span>
              </div>
              <SegmentedBar total={40} filled={filled} tones={["f2", "f3", "f4"]} />
              <p className="mt-3 text-[0.88rem] text-mut">
                Pool B rewards vest second by second over 14 days. Pool A
                rewards can be claimed together with the principal return
                after 24 hours.
              </p>
            </div>

            <PixelButton className="mt-5 w-full" onClick={onClaimAll}>
              {busy ? "…WAITING FOR WALLET" : "✚ CLAIM ALL"}
            </PixelButton>

            {/* H3: Pool B LP exit — was missing from the UI entirely, so a
                matured Pool B position could only be exited by hand. */}
            {account && claimable.withdrawable.length > 0 && (
              <div className="mt-6 border-t-2 border-line pt-4">
                <div className="font-ui text-[0.78rem] font-bold tracking-wide text-mut">
                  POOL B — LP WITHDRAWAL
                </div>
                {claimable.withdrawable.map((p) => (
                  <div
                    key={p.id}
                    className="mt-3 flex flex-wrap items-center justify-between gap-3 border-2 border-line bg-panel2 px-3 py-2.5"
                  >
                    <div className="text-[0.9rem]">
                      <b className="text-ink">Position #{p.id}</b> ·{" "}
                      {p.shares} share(s) · {fmt(p.lpTokens)} LP tokens
                      <div className="text-[0.82rem] text-dim">
                        {p.matured
                          ? "Lock finished — withdraw returns the LP underlying (VEIN + BNB) plus remaining reward."
                          : `Unlocks ${new Date(p.unlocksAt * 1000).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}.`}
                      </div>
                    </div>
                    <button
                      type="button"
                      disabled={!p.matured || withdrawing === p.id}
                      onClick={() => onWithdrawB(p.id)}
                      className="btn"
                    >
                      {withdrawing === p.id
                        ? "…WAITING"
                        : p.matured
                          ? "WITHDRAW LP"
                          : "LOCKED"}
                    </button>
                  </div>
                ))}
              </div>
            )}
          </Panel>

          <Panel
            title="REFERRAL"
            head={<Chip tone="mint">+1,000 VEIN / REFERRAL</Chip>}
          >
            <ReferralBox account={account} />
          </Panel>
        </div>
      </div>
    </section>
  );
}
