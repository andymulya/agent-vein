export default function PreviewStrip() {
  return (
    <div className="relative z-30 border-b-[3px] border-black bg-blood-dk px-3 py-2 text-center font-ui text-[0.72rem] tracking-wide text-[#ffe9ee]">
      PREVIEW MODE —{" "}
      <b className="text-white">frontend only, contract not yet deployed.</b>{" "}
      All figures follow the final $VEIN design draft.
    </div>
  );
}
