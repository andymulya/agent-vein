import { useState } from "react";
import PixelButton from "./PixelButton";
import { useToast } from "../contexts/ToastContext";
import { VEIN_PER_SHARE, MAX_MINT_SHARES } from "../constants/vein";
import {
  connectWallet,
  getConnectedAccount,
  isAgentHolder,
  buyVein,
  addVeinToWallet,
} from "../services/preview";
import { fmt } from "../utils/format";

/** 1 mint share = 5,000 VEIN (≈ $0.50) at 6,874,000 VEIN/BNB. */
const VEIN_PER_BNB = 6874000n;
const MIN_SHARES = 1;

const QUICK_SHARES = [
  { label: "1", value: "1" },
  { label: "2", value: "2" },
  { label: "5", value: "5" },
  { label: "MAX 10", value: "10" },
];

/** Share-based mint calculator: pick shares, pay BNB, receive VEIN. */
export default function BuyCalculator() {
  const [shares, setShares] = useState("10");
  const [busy, setBusy] = useState(false);
  const { showToast } = useToast();

  const n = Math.max(0, parseInt(shares, 10) || 0);
  // Exact BNB cost, ceiling division so the contract returns exactly
  // n × 5,000 VEIN (floor division both ways would short by 1 VEIN).
  const costWei =
    (BigInt(n) * BigInt(VEIN_PER_SHARE) * 10n ** 18n + VEIN_PER_BNB - 1n) /
    VEIN_PER_BNB;
  const costBnb = Number(costWei) / 1e18;
  const receive = fmt(n * VEIN_PER_SHARE);

  const onMint = async () => {
    if (busy) return;
    if (!/^\d+$/.test(shares.trim()) || n < MIN_SHARES || n > MAX_MINT_SHARES) {
      showToast(
        `Shares must be a whole number between <b>${MIN_SHARES}</b> and <b>${MAX_MINT_SHARES}</b> per wallet.`,
      );
      return;
    }
    setBusy(true);
    try {
      let account = await getConnectedAccount();
      if (!account) {
        showToast("Connect your Agent Wallet first — check your wallet popup.");
        account = await connectWallet();
      }
      const holder = await isAgentHolder(account);
      if (!holder) {
        showToast(
          "This wallet holds <b>no Agent ID</b> — minting is Agent ID holders only.",
        );
        return;
      }
      const hash = await buyVein(costWei);
      showToast(
        `<span style="color:#7dffa8">MINT SENT</span> — tx ${hash.slice(0, 10)}…${hash.slice(-6)}. Confirm it in your wallet, then check BscScan.`,
      );
    } catch (e) {
      showToast(`Mint failed: ${String(e?.message || e).slice(0, 120)}`);
    } finally {
      setBusy(false);
    }
  };

  const onAddToWallet = async () => {
    try {
      const added = await addVeinToWallet();
      showToast(
        added
          ? `<span style="color:#7dffa8">$VEIN added to your wallet</span> — with its logo.`
          : "$VEIN was not added — request dismissed in your wallet.",
      );
    } catch (e) {
      showToast(`Could not add $VEIN: ${String(e?.message || e).slice(0, 100)}`);
    }
  };

  return (
    <div>
      <label className="mb-2 block font-ui text-[0.78rem] font-bold tracking-wide text-mut" htmlFor="mint-shares">
        SHARES
      </label>
      <div className="flex items-stretch border-[3px] border-black bg-[#0a0516] shadow-[inset_3px_3px_0_rgba(0,0,0,0.7),4px_4px_0_rgba(0,0,0,0.45)]">
        <input
          id="mint-shares"
          type="number"
          min={MIN_SHARES}
          max={MAX_MINT_SHARES}
          step="1"
          value={shares}
          onChange={(e) => setShares(e.target.value)}
          className="min-w-0 flex-1 border-none bg-transparent px-3 py-2 font-num text-[1.6rem] text-white outline-none max-[640px]:px-2.5 max-[640px]:text-[1.35rem]"
        />
        <span className="flex items-center border-l-2 border-line bg-panel3 px-4 font-ui text-[0.85rem] font-bold text-gold max-[640px]:px-2.5">
          SHARE
        </span>
      </div>

      <div className="mt-2.5 flex flex-wrap gap-2">
        {QUICK_SHARES.map((q) => (
          <button
            key={q.label}
            type="button"
            onClick={() => setShares(q.value)}
            className="min-h-[2.4rem] border-2 border-line bg-panel2 px-3 py-2 font-ui text-[0.75rem] font-bold text-mut hover:border-line2 hover:text-white max-[640px]:flex-[1_1_28%] max-[380px]:flex-[1_1_40%]"
          >
            {q.label}
          </button>
        ))}
      </div>

      <div className="mt-4 flex flex-wrap items-center justify-between gap-4 border-2 border-dashed border-line2 bg-blood/5 px-4 py-3 max-[640px]:flex-col max-[640px]:items-start max-[640px]:gap-2">
        <div>
          <div className="font-ui text-[0.72rem] tracking-wide text-dim">
            YOU RECEIVE (ESTIMATE)
          </div>
          <div className="font-num text-[2rem] leading-none text-gold max-[640px]:text-[1.75rem]">
            {receive} <span className="text-[1.4rem]">VEIN</span>
          </div>
        </div>
        <div className="text-right max-[640px]:text-left">
          <div className="font-ui text-[0.72rem] tracking-wide text-dim">
            TOTAL COST
          </div>
          <div className="font-num text-[1.35rem] text-white">
            {costBnb.toFixed(6)} BNB
          </div>
        </div>
      </div>

      <div className="mt-3 flex items-start gap-2.5 text-[0.9rem] text-mut">
        <span className="mt-1 h-4 w-4 flex-none bg-mint [clip-path:polygon(14%_44%,0_65%,40%_100%,100%_16%,84%_2%,38%_72%)]" />
        <span>
          Mint requirement: the connected wallet must hold an{" "}
          <b className="text-ink">Agent ID</b> — minting is open to Agent ID
          holders only.
        </span>
      </div>
      <div className="mt-3 flex items-start gap-2.5 text-[0.9rem] text-mut">
        <span className="mt-1 h-4 w-4 flex-none bg-gold" />
        <span>
          1 share = {fmt(VEIN_PER_SHARE)} VEIN (≈ $0.50) · Minimum 1 share ·
          maximum {MAX_MINT_SHARES} shares per wallet.
        </span>
      </div>
      <div className="mt-3 flex items-start gap-2.5 text-[0.9rem] text-mut">
        <span className="mt-1 h-4 w-4 flex-none bg-blood [clip-path:polygon(20%_0,0_20%,30%_50%,0_80%,20%_100%,50%_70%,80%_100%,100%_80%,70%_50%,100%_20%,80%_0,50%_30%)]" />
        <span>
          The $0.0001 price is the initial sale price — not a guarantee of
          the market price once trading begins.
        </span>
      </div>

      <PixelButton className="mt-5 w-full" onClick={onMint}>
        {busy ? "…WAITING FOR WALLET" : "▣ MINT VEIN"}
      </PixelButton>
      <button
        type="button"
        onClick={onAddToWallet}
        className="mt-3 flex w-full items-center justify-center gap-2 border-2 border-line bg-panel2 px-3 py-2.5 font-ui text-[0.78rem] font-bold text-mut hover:border-line2 hover:text-white"
      >
        <img src="/coin.png" alt="" className="h-5 w-5 rounded-full object-cover" aria-hidden="true" />
        ＋ ADD $VEIN TO WALLET
      </button>
      <p className="mt-3 text-[0.86rem] text-dim">
        Sale proceeds do not go to the team — all of it is paired into
        permanent LP.
      </p>
    </div>
  );
}
