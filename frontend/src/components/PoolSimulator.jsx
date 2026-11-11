import { useEffect, useState } from "react";
import PixelButton from "./PixelButton";
import { useToast } from "../contexts/ToastContext";
import {
  POOLS,
  SHARE_BNB,
  MAX_SHARES_PER_AGENT_ID,
} from "../constants/vein";
import {
  getPoolStats,
  getEpoch,
  getMintState,
  getConnectedAccount,
  connectWallet,
  isAgentHolder,
  depositPool,
} from "../services/preview";
import { fmt, fmtBnb } from "../utils/format";
import HalvingChart from "./HalvingChart";

/** Pool A / Pool B simulator: share stepper + deposit / reward / return. */
export default function PoolSimulator() {
  const [poolId, setPoolId] = useState("a");
  const [shares, setShares] = useState(1);
  const [busy, setBusy] = useState(false);
  const [liveReward, setLiveReward] = useState(null);
  const [remainingPool, setRemainingPool] = useState(MAX_SHARES_PER_AGENT_ID);
  const { showToast } = useToast();
  const pool = POOLS[poolId];
  const deposit = shares * SHARE_BNB;
  // M2: rewards are shown NET — claims pay 95% after the 5% claim fee —
  // using the live per-share reward when the chain read works.
  const grossReward = liveReward
    ? poolId === "a"
      ? liveReward.poolAReward
      : liveReward.poolBReward
    : pool.reward;
  const netReward = grossReward * 0.95;

  useEffect(() => {
    let alive = true;
    getEpoch().then((e) => {
      if (alive) setLiveReward(e);
    });
    getConnectedAccount().then((a) => {
      if (!a || !alive) return;
      getMintState(a).then((s) => {
        if (alive && s.live) setRemainingPool(s.remainingPool);
      });
    });
    return () => {
      alive = false;
    };
  }, []);

  const onDeposit = async () => {
    if (busy) return;
    setBusy(true);
    try {
      const stats = await getPoolStats();
      if (stats.locked) {
        showToast(
          "Pools are still <b>locked</b> — they open once 20% of the sale (8,000 shares) is sold.",
        );
        return;
      }
      let account = await getConnectedAccount();
      if (!account) {
        showToast("Connect your Agent Wallet first — check your wallet popup.");
        account = await connectWallet();
      }
      const holder = await isAgentHolder(account);
      if (!holder) {
        showToast(
          "This wallet holds <b>no Agent ID</b> — pools are Agent ID holders only.",
        );
        return;
      }
      if (shares > remainingPool) {
        showToast(
          `Your lifetime pool cap leaves only <b>${remainingPool}</b> share(s) — lower the amount and try again.`,
        );
        return;
      }
      const hash = await depositPool(poolId, shares);
      showToast(
        `<span style="color:#7dffa8">DEPOSIT SENT</span> — ${shares} share(s) to Pool ${poolId.toUpperCase()}. Tx ${hash.slice(0, 10)}…${hash.slice(-6)}. Confirm it in your wallet.`,
      );
    } catch (e) {
      showToast(`Deposit failed: ${String(e?.message || e).slice(0, 120)}`);
    } finally {
      setBusy(false);
    }
  };

  const decShares = () => setShares((s) => Math.max(1, s - 1));
  const incShares = () => {
    if (shares >= Math.min(MAX_SHARES_PER_AGENT_ID, remainingPool)) {
      showToast(
        remainingPool < MAX_SHARES_PER_AGENT_ID
          ? `Your lifetime pool cap leaves only <span style="color:#ffc44d">${remainingPool} share(s)</span>.`
          : 'Maximum of <span style="color:#ffc44d">10 shares</span> per Agent ID (lifetime).',
      );
      return;
    }
    setShares((s) => s + 1);
  };

  return (
    <div>
      <div className="grid grid-cols-2 border-[3px] border-black shadow-[5px_5px_0_rgba(0,0,0,0.5)]" role="tablist">
        {Object.values(POOLS).map((p) => (
          <button
            key={p.id}
            type="button"
            role="tab"
            aria-selected={poolId === p.id}
            onClick={() => setPoolId(p.id)}
            className={`border-b-[5px] border-transparent bg-panel3 px-2 py-3 font-ui text-[0.95rem] font-bold text-dim max-[640px]:px-1 max-[640px]:py-3 max-[640px]:text-[0.85rem] ${
              poolId === p.id
                ? "border-b-blood bg-panel2 text-white"
                : ""
            }`}
          >
            {p.name}
            <small className={`mt-1 block text-[0.68rem] tracking-wide text-dim ${poolId === p.id ? "text-ember" : ""}`}>
              {p.tag}
            </small>
          </button>
        ))}
      </div>

      <p className="mt-4 text-[0.95rem] text-mut">{pool.desc}</p>

      <div className="mt-4 grid grid-cols-3 gap-3 max-[560px]:grid-cols-1 max-[560px]:gap-2">
        <div className="max-[560px]:flex max-[560px]:items-baseline max-[560px]:justify-between max-[560px]:gap-4 max-[560px]:border-b-2 max-[560px]:border-dotted max-[560px]:border-[#2c1c4d] max-[560px]:pb-1.5">
          <div className="font-ui text-[0.7rem] tracking-wide text-dim">VEIN / SHARE — NET</div>
          <div className="font-num text-[1.65rem] leading-tight text-gold max-[640px]:text-[1.3rem]">
            {fmt(netReward)}
          </div>
        </div>
        <div className="max-[560px]:flex max-[560px]:items-baseline max-[560px]:justify-between max-[560px]:gap-4 max-[560px]:border-b-2 max-[560px]:border-dotted max-[560px]:border-[#2c1c4d] max-[560px]:pb-1.5">
          <div className="font-ui text-[0.7rem] tracking-wide text-dim">BNB / SHARE</div>
          <div className="font-num text-[1.65rem] leading-tight text-white max-[640px]:text-[1.3rem]">
            {fmtBnb(SHARE_BNB)}
          </div>
        </div>
        <div className="max-[560px]:flex max-[560px]:items-baseline max-[560px]:justify-between max-[560px]:gap-4 max-[560px]:border-b-2 max-[560px]:border-dotted max-[560px]:border-[#2c1c4d] max-[560px]:pb-1.5 max-[560px]:border-b-0 max-[560px]:pb-0">
          <div className="font-ui text-[0.7rem] tracking-wide text-dim">{pool.backCap}</div>
          <div className="font-num text-[1.65rem] leading-tight text-mint max-[640px]:text-[1.3rem]">
            {pool.backKey}
          </div>
        </div>
      </div>

      <label className="mb-2 mt-5 block font-ui text-[0.78rem] font-bold tracking-wide text-mut">
        NUMBER OF SHARES — MAX {MAX_SHARES_PER_AGENT_ID} / AGENT ID
      </label>
      <div className="flex items-stretch border-[3px] border-black shadow-[4px_4px_0_rgba(0,0,0,0.45)]">
        <button
          type="button"
          onClick={decShares}
          aria-label="Fewer shares"
          className="w-[52px] bg-panel2 text-[1.3rem] text-white"
        >
          −
        </button>
        <div className="flex-1 bg-[#0a0516] py-1.5 text-center font-num text-[1.7rem]">
          {shares}
        </div>
        <button
          type="button"
          onClick={incShares}
          aria-label="More shares"
          className="w-[52px] bg-panel2 text-[1.3rem] text-white"
        >
          +
        </button>
      </div>
      <div className="mt-3 flex gap-[5px]" aria-hidden="true">
        {Array.from({ length: MAX_SHARES_PER_AGENT_ID }, (_, i) => (
          <i
            key={i}
            className={`h-5 flex-1 border border-[#170d2a] bg-[#241639] ${
              i < shares
                ? "border-[#5c0a1c] bg-blood shadow-[0_0_8px_rgba(255,46,77,0.5)]"
                : ""
            }`}
          />
        ))}
      </div>

      <div className="mt-4">
        <div className="flex justify-between gap-4 border-b-2 border-dotted border-[#2c1c4d] py-2 text-[0.95rem]">
          <span className="pt-1 font-ui text-[0.75rem] tracking-wide text-dim">TOTAL DEPOSIT</span>
          <span className="text-right font-num text-[1.35rem] max-[640px]:text-[1.15rem]">
            {fmtBnb(deposit)} BNB
          </span>
        </div>
        <div className="flex justify-between gap-4 border-b-2 border-dotted border-[#2c1c4d] py-2 text-[0.95rem]">
          <span className="pt-1 font-ui text-[0.75rem] tracking-wide text-dim">REWARD VEIN — NET (AFTER 5% CLAIM FEE)</span>
          <span className="text-right font-num text-[1.35rem] text-gold max-[640px]:text-[1.15rem]">
            {fmt(shares * netReward)} VEIN
          </span>
        </div>
        <div className="flex justify-between gap-4 border-b-2 border-dotted border-[#2c1c4d] py-2 text-[0.95rem]">
          <span className="pt-1 font-ui text-[0.75rem] tracking-wide text-dim">{pool.backLabel}</span>
          {poolId === "b" ? (
            // M3: Pool B returns LP underlying (VEIN + BNB) — its value
            // floats with the pair, so no fixed BNB number is shown.
            <span className="text-right font-num text-[1.35rem] text-mint max-[640px]:text-[1.15rem]">
              VEIN + BNB
            </span>
          ) : (
            <span className="text-right font-num text-[1.35rem] text-mint max-[640px]:text-[1.15rem]">
              {fmtBnb(pool.back(deposit))} BNB
            </span>
          )}
        </div>
        <div className="flex justify-between gap-4 py-2 text-[0.95rem]">
          <span className="pt-1 font-ui text-[0.75rem] tracking-wide text-dim">AVAILABLE</span>
          <span className="text-right font-num text-[1.35rem] text-blood max-[640px]:text-[1.15rem]">
            {pool.when}
          </span>
        </div>
      </div>

      <PixelButton className="mt-5 w-full" onClick={onDeposit}>
        {busy ? "…WAITING FOR WALLET" : "⛏ DEPOSIT TO POOL"}
      </PixelButton>
      <p className="mt-3 text-[0.86rem] text-dim">
        Positions are recorded in the contract — no NFT, non-transferable.
      </p>

      <HalvingChart pool={pool} />
    </div>
  );
}
