import {
  VEIN_CORE,
  VEIN_TOKEN,
  VEIN_CORE_IMPL,
  PROXY_ADMIN,
  OPS_WALLET,
  BSCSCAN_ADDRESS,
} from "../constants/vein";

const SHORT = (a) => `${a.slice(0, 6)}…${a.slice(-4)}`;

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
            positions recorded in the contract. Contracts are live on BSC
            mainnet (see the strip at the top of the page). Do not trust
            any other page claiming otherwise.
          </p>
          <p className="mt-3 max-w-[560px] font-ui text-[0.78rem] leading-loose text-dim">
            CORE ·{" "}
            <a className="text-mut underline" href={`${BSCSCAN_ADDRESS}${VEIN_CORE}`} target="_blank" rel="noreferrer">
              {SHORT(VEIN_CORE)}
            </a>
            <br />
            TOKEN ·{" "}
            <a className="text-mut underline" href={`${BSCSCAN_ADDRESS}${VEIN_TOKEN}`} target="_blank" rel="noreferrer">
              {SHORT(VEIN_TOKEN)}
            </a>
            <br />
            IMPL ·{" "}
            <a className="text-mut underline" href={`${BSCSCAN_ADDRESS}${VEIN_CORE_IMPL}`} target="_blank" rel="noreferrer">
              {SHORT(VEIN_CORE_IMPL)}
            </a>
            {" · "}ADMIN ·{" "}
            <a className="text-mut underline" href={`${BSCSCAN_ADDRESS}${PROXY_ADMIN}`} target="_blank" rel="noreferrer">
              {SHORT(PROXY_ADMIN)}
            </a>
            <br />
            OPS ·{" "}
            <a className="text-mut underline" href={`${BSCSCAN_ADDRESS}${OPS_WALLET}`} target="_blank" rel="noreferrer">
              {SHORT(OPS_WALLET)}
            </a>
          </p>
        </div>
        <p className="font-ui text-[0.8rem] leading-loose text-dim">
          CHAIN · BNB (BSC)
          <br />
          PRICE · $0.0001
          <br />
          STATUS · LIVE
        </p>
      </div>
    </footer>
  );
}
