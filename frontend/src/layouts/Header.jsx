import { NAV_ITEMS } from "../constants/vein";
import { useActiveSection } from "../hooks/useActiveSection";
import { useToast } from "../contexts/ToastContext";
import { getEpoch } from "../services/preview";

export default function Header() {
  const active = useActiveSection();
  const { showPreviewToast } = useToast();
  const epoch = getEpoch();

  return (
    <header className="sticky top-0 z-50 border-b-[3px] border-black bg-[#0b0614]/92 shadow-[0_3px_0_#3a2563] backdrop-blur-md">
      <div className="mx-auto flex max-w-[1180px] flex-wrap items-center gap-4 px-4 py-2 max-[900px]:gap-x-2 max-[640px]:gap-x-2.5 max-[640px]:px-3 max-[640px]:py-2">
        <a
          href="#atas"
          className="flex items-center gap-2.5 py-1.5 font-disp text-[1.05rem] text-gold no-underline max-[640px]:text-[0.88rem] max-[380px]:text-[0.78rem]"
          style={{ textShadow: "2px 2px 0 #a30f2c, 4px 4px 0 #000" }}
        >
          <span className="logo-drop" aria-hidden="true" />
          VEIN
        </a>

        <nav
          className="mx-auto flex flex-wrap gap-1 max-[900px]:order-3 max-[900px]:w-full max-[640px]:m-0 max-[640px]:w-full max-[640px]:justify-between max-[640px]:gap-0.5"
          aria-label="Main navigation"
        >
          {NAV_ITEMS.map((item) => (
            <a
              key={item.id}
              href={`#${item.id}`}
              className={`inline-flex min-h-[2.75rem] items-center gap-1.5 border-b-4 border-transparent px-3 py-2 font-ui text-[0.82rem] font-bold text-mut no-underline hover:text-ink max-[640px]:flex-1 max-[640px]:justify-center max-[640px]:whitespace-nowrap max-[640px]:px-1 max-[640px]:py-2 max-[640px]:text-[0.72rem] max-[380px]:px-0.5 max-[380px]:text-[0.66rem] ${
                active === item.id
                  ? "border-b-mint bg-mint/7 text-mint"
                  : ""
              }`}
            >
              {item.icon} {item.label}
            </a>
          ))}
        </nav>

        <span className="hidden items-center gap-2 border-2 border-line bg-panel3 px-3 py-2 font-ui text-[0.72rem] text-mut min-[1151px]:inline-flex">
          <span className="blink h-2 w-2 bg-blood shadow-[0_0_8px_#ff2e4d]" />
          Epoch <b className="text-ink">{epoch.epoch}</b> ·{" "}
          <b className="text-ink">{epoch.poolAReward}</b> VEIN / Pool A share
        </span>

        <button
          type="button"
          onClick={showPreviewToast}
          className="btn mint small ml-auto max-[640px]:px-2.5 max-[640px]:py-2 max-[640px]:text-center max-[640px]:text-[0.7rem] max-[380px]:px-2 max-[380px]:text-[0.64rem]"
        >
          ▤ Connect Agent Wallet
        </button>
      </div>
    </header>
  );
}
