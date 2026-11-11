import { VEIN_TOKEN, BSCSCAN_ADDRESS } from "../constants/vein";

export default function PreviewStrip() {
  return (
    <div className="relative z-30 border-b-[3px] border-black bg-blood-dk px-3 py-2 text-center font-ui text-[0.72rem] tracking-wide text-[#ffe9ee]">
      LIVE ON BSC MAINNET —{" "}
      <a
        className="text-white underline"
        href={`${BSCSCAN_ADDRESS}${VEIN_TOKEN}`}
        target="_blank"
        rel="noreferrer"
      >
        $VEIN {VEIN_TOKEN.slice(0, 6)}…{VEIN_TOKEN.slice(-4)}
      </a>{" "}
      · verify every address on BscScan before you transact.
    </div>
  );
}
