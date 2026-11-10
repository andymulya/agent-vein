import EmberCanvas from "./EmberCanvas";
import EkgPulse from "./EkgPulse";
import PixelButton from "./PixelButton";
import { useToast } from "../contexts/ToastContext";
import { heroImg } from "../assets/images.js";

const HERO_STATS = [
  { value: "$0.0001", label: "SALE PRICE / VEIN", tone: "" },
  { value: "1 B", label: "TOTAL SUPPLY VEIN", tone: "" },
  { value: "200 M", label: "SALE ALLOCATION", tone: "text-gold" },
  { value: "750", label: "VEIN / SHARE — POOL A", tone: "text-mint" },
  { value: "LOCKED", label: "POOLS — OPEN AFTER THE SALE SELLS OUT", tone: "text-blood" },
];

export default function Hero() {
  const { showPreviewToast } = useToast();

  return (
    <div className="relative overflow-hidden border-b-[3px] border-black bg-[#0a0410] text-center" id="atas">
      <div className="absolute inset-0">
        <img
          src={heroImg}
          alt=""
          className="h-full w-full object-cover opacity-85"
          style={{ objectPosition: "center 42%" }}
        />
        <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(6,3,9,0.62)_0%,rgba(6,3,9,0.18)_34%,rgba(6,3,9,0.55)_72%,#0b0614_100%)]" />
      </div>
      <EmberCanvas />

      <div className="relative z-[2] mx-auto max-w-[980px] px-4 pb-9 pt-12 max-[640px]:px-3 max-[640px]:pb-6 max-[640px]:pt-9">
        <span className="inline-flex items-center gap-2 border-2 border-mint bg-[#04140e]/72 px-3 py-2 font-ui text-[0.78rem] font-bold tracking-[0.14em] text-mint shadow-[4px_4px_0_#000]">
          <span className="blink-fast h-[9px] w-[9px] bg-blood shadow-[0_0_10px_#ff2e4d]" />
          SALE OPENING SOON
        </span>

        <h1 className="title-gradient mx-0 mb-2 mt-6 font-disp text-[clamp(2rem,8.5vw,4.6rem)] leading-[1.12]">
          AGENT VEIN
        </h1>
        <p className="mx-0 mt-4 font-disp text-[clamp(0.78rem,3.4vw,1.35rem)] leading-[1.7] text-white [text-shadow:3px_3px_0_#000]">
          RUN BNB THROUGH ITS{" "}
          <span className="text-blood [text-shadow:3px_3px_0_#000,0_0_18px_rgba(255,46,77,0.65)]">
            VEINS
          </span>
          . MINE <span className="text-gold">$VEIN</span>
        </p>
        <p className="mx-auto mt-5 max-w-[620px] text-[1.02rem] text-[#e9e2ff] [text-shadow:1px_1px_0_#000,0_2px_14px_rgba(0,0,0,0.9)]">
          Deposit mining on BNB Chain, exclusively for Agent ID holders.
          Deposit BNB into Pool A &amp; Pool B and harvest $VEIN with every
          pulse — rewards halve every 150,000 shares, so those who enter
          first pulse the hardest.
        </p>

        <div className="mt-7 flex flex-wrap justify-center gap-4 max-[480px]:flex-col max-[480px]:items-stretch">
          <a href="#beli" className="btn">
            ▣ Buy $VEIN
          </a>
          <a href="#pool" className="btn ghost">
            View Pools →
          </a>
        </div>

        <div className="mx-auto mt-8 flex items-center gap-4 border-2 border-line bg-[#0d0718]/88 px-4 py-1.5 shadow-[6px_6px_0_rgba(0,0,0,0.6)] max-[640px]:gap-2 max-[640px]:px-2.5">
          <EkgPulse />
        </div>

        <div className="mx-auto grid grid-cols-5 border-2 border-t-0 border-line bg-[#0d0718]/92 shadow-[6px_6px_0_rgba(0,0,0,0.6)] max-[900px]:grid-cols-2 max-[520px]:grid-cols-2">
          {HERO_STATS.map((cell, i) => (
            <div
              key={cell.label}
              className={`border-l-2 border-line px-4 pb-4 pt-4 text-left first:border-l-0 max-[900px]:border-t-2 max-[900px]:nth-[-n+2]:border-t-0 max-[900px]:odd:border-l-0 max-[900px]:last:col-span-full ${
                i === 0 ? "max-[900px]:border-t-0" : ""
              }`}
            >
              <div className={`font-num text-[1.7rem] leading-none text-white max-[640px]:text-[1.4rem] ${cell.tone}`}>
                {cell.value}
              </div>
              <div className="mt-1.5 font-ui text-[0.72rem] text-dim tracking-wide">
                {cell.label}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
