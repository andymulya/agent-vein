import SectionHead from "../components/SectionHead";
import RuleAccordion from "../components/RuleAccordion";
import { HOW_IT_WORKS } from "../constants/vein";

/** How it works + rules section. */
export default function RulesPage() {
  return (
    <section className="scroll-mt-24 px-4 py-12 pb-2 max-[640px]:px-3 max-[640px]:pt-9" id="aturan">
      <div className="mx-auto max-w-[1180px]">
        <SectionHead title="▦ HOW IT WORKS & RULES" tag="FOUR PULSES FROM BUYING TO HARVEST" />

        <div className="grid grid-cols-4 gap-6 max-[900px]:grid-cols-2 max-[520px]:grid-cols-1 max-[480px]:gap-4">
          {HOW_IT_WORKS.map((step) => (
            <div
              key={step.n}
              className="border-2 border-line bg-panel p-4 shadow-[8px_8px_0_rgba(0,0,0,0.5)]"
            >
              <div
                className="font-disp text-[1.3rem] text-blood"
                style={{ textShadow: "2px 2px 0 #000" }}
              >
                {step.n}
              </div>
              <h4 className="mb-1 mt-3 font-ui text-[0.95rem]">{step.title}</h4>
              <p className="m-0 text-[0.88rem] text-mut">{step.text}</p>
            </div>
          ))}
        </div>

        <div className="mt-8">
          <RuleAccordion title="TOKEN SALE">
            <p>
              Fixed price of <b>$0.0001 per VEIN</b>. Reference rate: 0.001 BNB
              ≈ <b>6,874 VEIN</b> (follows the BNB price at the time of
              purchase).
            </p>
            <ul>
              <li>
                Sale allocation of <b>200,000,000 VEIN</b> (20% of supply).
              </li>
              <li>
                <b>No time limit</b> — the sale runs until the allocation is
                gone.
              </li>
              <li>
                Only wallets holding an <b>Agent ID</b> can buy. Minimum ±$1
                (±0.0015 BNB), maximum 5 BNB per wallet.
              </li>
              <li>
                All sale proceeds go into <b>permanent LP</b>, not to the
                team.
              </li>
            </ul>
          </RuleAccordion>

          <RuleAccordion title="POOL A — FAST PULSE">
            <ul>
              <li>
                Deposit <b>0.001 BNB per share</b>, maximum 10 shares per
                Agent ID. Epoch 1 reward: <b>750 VEIN per share</b>.
              </li>
              <li>
                After <b>24 hours</b>: claim your VEIN rewards and take your
                principal back, minus a <b>5% fee</b>.
              </li>
              <li>
                Example per share: deposit 0.001 BNB → receive 750 VEIN +
                0.00095 BNB back.
              </li>
            </ul>
          </RuleAccordion>

          <RuleAccordion title="POOL B — LP PULSE">
            <ul>
              <li>
                Deposit <b>0.001 BNB per share</b>, maximum 10 shares per
                Agent ID. Epoch 1 reward: <b>2,500 VEIN per share</b>.
              </li>
              <li>
                From your deposit: half buys VEIN, half is paired as
                liquidity.
              </li>
              <li>
                Your proceeds — VEIN + your BNB share of the LP — vest{" "}
                <b>linearly over 14 days</b>, calculated second by second from
                the moment you deposit.
              </li>
            </ul>
          </RuleAccordion>

          <RuleAccordion title="HALVING & SUPPLY">
            <ul>
              <li>
                Fixed total supply of <b>1,000,000,000 VEIN</b>: mining 50% ·
                sale 20% · liquidity 15% · team 10% · community 5%.
              </li>
              <li>
                The 500M VEIN mining allocation is paid out gradually. The
                base reward <b>halves every 150,000 shares</b> combined across
                both pools — once the mining allocation is exhausted, there are
                no new rewards.
              </li>
              <li>
                Team allocation: <b>20% TGE unlock</b> at launch for
                operations, <b>80% vesting linearly over 6 months</b> (±13.3M
                VEIN / month).
              </li>
            </ul>
          </RuleAccordion>

          <RuleAccordion title="REFERRAL">
            <ul>
              <li>
                A reward of <b>1,000 VEIN</b> per referral — flat for everyone,
                no tiers.
              </li>
              <li>
                A referral qualifies only after the invited wallet has{" "}
                <b>staked / mined 2×</b> in Pool A or Pool B.
              </li>
              <li>
                Rewards are paid from the Community allocation (50M VEIN) —
                enough for 50,000 qualified referrals.
              </li>
            </ul>
          </RuleAccordion>

          <RuleAccordion title="FEES & TAXES">
            <ul>
              <li>
                <b>2% transfer tax</b> on buys and sells on the pair: 1%
                operations (BNB) + 1% LP that is burned.
              </li>
              <li>
                <b>5% Pool A fee</b> on returned principal ·{" "}
                <b>5% claim fee</b> on claimed VEIN.
              </li>
              <li>
                <b>99% snipe tax</b> in the opening block of trading only.
              </li>
              <li>
                Token sale proceeds are <b>not</b> team income — 100% becomes
                LP.
              </li>
            </ul>
          </RuleAccordion>
        </div>
      </div>
    </section>
  );
}
