import { useToast } from "../contexts/ToastContext";

export const AGENT_COMMAND = `AGENT COMMAND — AGENT VEIN ($VEIN)

You are my on-chain agent. Use my connected Agent ID wallet to interact
with Agent Vein on BNB Chain (chain ID 56). Only proceed if my wallet
holds an Agent ID — every action below requires one.

Website: https://agent-miner-vein.vercel.app
Token ($VEIN): 0x17ccdcd9763e824a59c78f60c10e6976d5663479
Core: read it from the token contract — call core() on the token above
Agent ID registry: 0x60B9262456dE011F7d15a54CdD8c48bAaa8B022F

ACTIONS
1. BUY VEIN — call buyVein() on the Core (payable, no arguments) and send
   BNB. Price is fixed at $0.0001 per VEIN (about 6,874 VEIN per 0.001
   BNB). Min about $1, max 5 BNB per wallet. Sale runs until the
   200,000,000 VEIN allocation is gone. All proceeds go to LP.
2. POOL A — call depositPoolA(referrer) on the Core and send 0.001 BNB
   per share (max 10 shares per Agent ID; referrer is the inviter's
   wallet, or the zero address if none). Reward: 750 VEIN per share.
   After 24 hours, call claimPoolA(positionId) to claim rewards and get
   the principal back minus a 5% fee.
3. POOL B — call depositPoolB(referrer) on the Core and send 0.001 BNB
   per share (max 10 shares per Agent ID). Reward: 2,500 VEIN per share,
   vested linearly over 14 days. Call claimPoolBReward(positionId) to
   claim vested rewards, withdrawPoolB(positionId) to exit.
   Pools open only after the sale sells out.
4. CLAIM — check claimable rewards first and report them before
   claiming. Never claim if gas costs more than the claim is worth.
5. REFUND — if the sale refund is enabled, call refundSale(veinAmount)
   to return VEIN for BNB.

RULES
- Never spend more BNB than I approve. Ask me to confirm the exact
  amount and action before sending any transaction.
- Never approve unlimited token spending. Use exact amounts only.
- Verify every address on BscScan before transacting.`;

/** Copy-paste Agent ID command for AI agents, like other Agent ID projects. */
export default function AgentCommand() {
  const { showToast } = useToast();

  const copyCommand = async () => {
    try {
      await navigator.clipboard.writeText(AGENT_COMMAND);
      showToast("Agent command copied.");
    } catch {
      showToast("Copy failed — select the text and copy it manually.");
    }
  };

  return (
    <div className="mt-8 border-2 border-line bg-panel p-4 shadow-[8px_8px_0_rgba(0,0,0,0.5)]">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h3 className="m-0 font-disp text-[1.1rem] text-gold" style={{ textShadow: "2px 2px 0 #000" }}>
          ▚ AGENT COMMAND
        </h3>
        <button type="button" onClick={copyCommand} className="btn">
          COPY COMMAND
        </button>
      </div>
      <p className="mt-2 text-[0.9rem] text-mut">
        Paste this into your AI agent (e.g. Binance AI Pro) and it will know
        how to mint, stake, mine and claim for you — Agent ID wallet only.
      </p>
      <pre className="mt-3 overflow-x-auto whitespace-pre-wrap break-words border-2 border-line bg-[#0a0516] p-3 font-ui text-[0.82rem] leading-relaxed text-mut">
        {AGENT_COMMAND}
      </pre>
    </div>
  );
}
