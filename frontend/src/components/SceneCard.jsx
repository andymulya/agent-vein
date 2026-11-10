import { poolImg } from "../assets/images.js";

/** Pool scene image card with the live share-height overlay. */
export default function SceneCard() {
  return (
    <div className="relative overflow-hidden border-2 border-line bg-[#0a0410] shadow-[8px_8px_0_rgba(0,0,0,0.5)]">
      <img src={poolImg} alt="Vein network scene" className="h-full w-full object-cover" />
      <div className="absolute inset-x-0 bottom-0 flex items-end justify-between gap-4 bg-[linear-gradient(180deg,transparent,rgba(5,2,10,0.92))] px-4 pb-3 pt-9">
        <div>
          <div className="font-num text-[2.2rem] leading-none text-mint [text-shadow:2px_2px_0_#000]">
            0
          </div>
          <div className="font-ui text-[0.7rem] tracking-wide text-mut">
            SHARES MINED · EPOCH 1
          </div>
        </div>
        <div className="text-right">
          <div className="font-num text-[2.2rem] leading-none text-gold [text-shadow:2px_2px_0_#000]">
            0
          </div>
          <div className="font-ui text-[0.7rem] tracking-wide text-mut">
            $VEIN FOUND
          </div>
        </div>
      </div>
    </div>
  );
}
