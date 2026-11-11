import { useState } from "react";
import PixelButton from "./PixelButton";
import { useToast } from "../contexts/ToastContext";
import { VEIN_PER_BNB, MAX_BUY_BNB, MIN_BUY_BNB } from "../constants/vein";
import {
  connectWallet,
  getConnectedAccount,
  isAgentHolder,
  buyVein,
  parseBnb,
} from "../services/preview";
import { fmt, fmtBnb } from "../utils/format";

const QUICK_AMOUNTS = [
  { label: "MIN ±$1", value: "0.0015" },
  { label: "0.01", value: "0.01" },
  { label: "0.1", value: "0.1" },
  { label: "1", value: "1" },
  { label: "MAX 5", value: "5" },
];

/** BNB → VEIN sale calculator with quick-amount chips. */
export default function BuyCalculator() {
  const [bnb, setBnb] = useState("0.01");
  const [busy, setBusy] = useState(false);
  const { showToast } = useToast();

  const amount = Math.max(0, parseFloat(bnb) || 0);
  const receive = fmt(amount * VEIN_PER_BNB);

  const onBuy = async () => {
    if (busy) return;
    if (amount < MIN_BUY_BNB || amount > MAX_BUY_BNB) {
      showToast(
        `Amount must be between <b>${MIN_BUY_BNB} BNB</b> and <b>${MAX_BUY_BNB} BNB</b>.`,
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
          "This wallet holds <b>no Agent ID</b> — the sale is Agent ID holders only.",
        );
        return;
      }
      const hash = await buyVein(parseBnb(bnb));
      showToast(
        `<span style="color:#7dffa8">BUY SENT</span> — tx ${hash.slice(0, 10)}…${hash.slice(-6)}. Confirm it in your wallet, then check BscScan.`,
      );
    } catch (e) {
      showToast(`Buy failed: ${String(e?.message || e).slice(0, 120)}`);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div>
      <label className="mb-2 block font-ui text-[0.78rem] font-bold tracking-wide text-mut" htmlFor="buy-bnb">
        BNB AMOUNT
      </label>
      <div className="flex items-stretch border-[3px] border-black bg-[#0a0516] shadow-[inset_3px_3px_0_rgba(0,0,0,0.7),4px_4px_0_rgba(0,0,0,0.45)]">
        <input
          id="buy-bnb"
          type="number"
          min="0"
          max={MAX_BUY_BNB}
          step="0.001"
          value={bnb}
          onChange={(e) => setBnb(e.target.value)}
          className="min-w-0 flex-1 border-none bg-transparent px-3 py-2 font-num text-[1.6rem] text-white outline-none max-[640px]:px-2.5 max-[640px]:text-[1.35rem]"
        />
        <span className="flex items-center border-l-2 border-line bg-panel3 px-4 font-ui text-[0.85rem] font-bold text-gold max-[640px]:px-2.5">
          BNB
        </span>
      </div>

      <div className="mt-2.5 flex flex-wrap gap-2">
        {QUICK_AMOUNTS.map((q) => (
          <button
            key={q.label}
            type="button"
            onClick={() => setBnb(q.value)}
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
            REFERENCE RATE
          </div>
          <div className="font-num text-[1.35rem] text-white">
            0.001 BNB ≈ {fmt(6874)} VEIN
          </div>
        </div>
      </div>

      <div className="mt-3 flex items-start gap-2.5 text-[0.9rem] text-mut">
        <span className="mt-1 h-4 w-4 flex-none bg-mint [clip-path:polygon(14%_44%,0_65%,40%_100%,100%_16%,84%_2%,38%_72%)]" />
        <span>
          Purchase requirement: the connected wallet must hold an{" "}
          <b className="text-ink">Agent ID</b> — the sale is open to Agent ID
          holders only.
        </span>
      </div>
      <div className="mt-3 flex items-start gap-2.5 text-[0.9rem] text-mut">
        <span className="mt-1 h-4 w-4 flex-none bg-gold" />
        <span>
          Minimum ±$1 (±0.0015 BNB) · maximum 5 BNB per wallet.
        </span>
      </div>
      <div className="mt-3 flex items-start gap-2.5 text-[0.9rem] text-mut">
        <span className="mt-1 h-4 w-4 flex-none bg-blood [clip-path:polygon(20%_0,0_20%,30%_50%,0_80%,20%_100%,50%_70%,80%_100%,100%_80%,70%_50%,100%_20%,80%_0,50%_30%)]" />
        <span>
          The $0.0001 price is the initial sale price — not a guarantee of
          the market price once trading begins.
        </span>
      </div>

      <PixelButton className="mt-5 w-full" onClick={onBuy}>
        {busy ? "…WAITING FOR WALLET" : "▣ BUY VEIN"}
      </PixelButton>
      <p className="mt-3 text-[0.86rem] text-dim">
        Sale proceeds do not go to the team — all of it is paired into
        permanent LP.
      </p>
    </div>
  );
}
