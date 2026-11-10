import Panel from "../components/Panel";
import SectionHead from "../components/SectionHead";
import TokenRow from "../components/TokenRow";
import { TOKENOMICS, FEE_CARDS, TOTAL_SUPPLY } from "../constants/vein";
import { fmt } from "../utils/format";

/** Tokenomics section: allocation rows + fee cards + honest note. */
export default function TokenomicsPage() {
  return (
    <section className="scroll-mt-24 px-4 py-12 pb-2 max-[640px]:px-3 max-[640px]:pt-9" id="tokenomik">
      <div className="mx-auto max-w-[1180px]">
        <SectionHead
          title="▤ $VEIN TOKENOMICS"
          tag={`FIXED SUPPLY ${fmt(TOTAL_SUPPLY)} VEIN`}
        />

        <div className="grid grid-cols-2 gap-6 max-[900px]:grid-cols-1 max-[480px]:gap-4">
          <Panel title="ALLOCATION">
            {TOKENOMICS.map((row) => (
              <TokenRow key={row.name} row={row} />
            ))}
          </Panel>

          <div className="grid min-w-0 grid-cols-1 gap-6 max-[480px]:gap-4">
            {FEE_CARDS.map((card) => (
              <Panel key={card.title} className="p-0">
                <div className="p-4">
                  <div className="font-num text-[2.3rem] leading-none text-gold">
                    {card.value}
                  </div>
                  <h4 className="mb-1 mt-2 font-ui text-[0.92rem] tracking-wide">
                    {card.title}
                  </h4>
                  <p className="m-0 text-[0.88rem] text-mut">{card.text}</p>
                </div>
              </Panel>
            ))}
          </div>
        </div>

        <p className="mt-5 text-[0.9rem] text-mut">
          Honest note: $0.0001 is the initial sale price, not a price floor.
          Once trading begins, the price moves freely with the contents of
          the pair — there is no buyback or reserve fund holding it up.
        </p>
      </div>
    </section>
  );
}
