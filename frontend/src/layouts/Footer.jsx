export default function Footer() {
  return (
    <footer className="mt-14 border-t-[3px] border-black bg-panel3 shadow-[0_-3px_0_#3a2563]">
      <div className="mx-auto flex max-w-[1180px] flex-wrap items-start justify-between gap-5 px-4 py-6 pb-9">
        <div>
          <div
            className="font-disp text-[0.85rem] text-gold"
            style={{ textShadow: "2px 2px 0 #a30f2c" }}
          >
            AGENT VEIN
          </div>
          <p className="mt-2 max-w-[560px] text-[0.85rem] text-dim">
            $VEIN deposit mining on BNB Chain — Agent ID only, no NFT,
            positions recorded in the contract. This page is a frontend
            preview: the contract is not deployed yet, and there is no
            official contract address, pair, or trading link. Do not trust
            any other page claiming otherwise.
          </p>
        </div>
        <p className="font-ui text-[0.8rem] leading-loose text-dim">
          CHAIN · BNB (BSC)
          <br />
          PRICE · $0.0001
          <br />
          STATUS · PREVIEW
        </p>
      </div>
    </footer>
  );
}
