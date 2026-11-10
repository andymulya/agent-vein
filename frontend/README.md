# Agent Vein — Frontend (Vite + React + Tailwind CSS)

Frontend preview for **Agent Vein ($VEIN)** — BNB-only deposit mining on
BSC, exclusively for Agent ID holders. The contract is **not deployed yet**,
so this app runs in preview mode: all figures come from the final design
draft and every action button shows a "contract not deployed yet" toast.

## Run

```bash
cd frontend
npm install     # once
npm run dev     # local dev server (Vite)
npm run build   # production build -> dist/
npm run preview # serve the production build locally
```

Stack: React 19 + Vite 8, Tailwind CSS v4 (via `@tailwindcss/vite`),
no extra UI dependencies.

## Structure

```
src/
  main.jsx            Entry point
  App.jsx             Page composition (Hero + 5 sections)
  index.css           Tailwind v4 import + @theme tokens
  styles/
    theme.css         Pixel theme: buttons, scanlines, toast, animations
  layouts/            Page chrome — the backbone of the layout
    PageLayout.jsx    Preview strip + Header + content + Footer + Toast
    PreviewStrip.jsx  "Preview mode" banner
    Header.jsx        Logo, nav tabs (Buy/Pool/Claim/Tokenomics/Rules),
                      epoch badge, "Connect Agent Wallet" button
    Footer.jsx
  pages/              One file per page section
    BuyPage.jsx       $0.0001 sale, calculator, sale status 0/200M
    PoolsPage.jsx     Pool A/B simulators, locked until the sale sells out
    ClaimPage.jsx     Claim panel + referral
    TokenomicsPage.jsx Allocation (50/20/15/10/5), fees,
                      team as TGE unlock (20% launch + 80% vesting 6 mo)
    RulesPage.jsx     How it works + rule accordions
  components/         Reusable, one component per file
    Hero.jsx          Vein identity hero (vein network art, ember canvas,
                      animated pixel EKG pulse, live BPM + stat grid)
    BuyCalculator.jsx BNB -> VEIN calculator with quick-amount chips
    PoolSimulator.jsx Pool A/B simulator, share stepper (max 10), halving chart
    HalvingChart.jsx  Reward halving across 8 epochs
    PulseLog.jsx      System log + live WIB clock
    ReferralBox.jsx   Referral link + 1,000 VEIN / qualified referral (2x stake)
    SceneCard.jsx     Pool scene art + share-height overlay
    TokenRow.jsx      One tokenomics allocation row
    RuleAccordion.jsx Collapsible rule block
    SegmentedBar.jsx  Pixel progress bar
    EkgPulse.jsx      Canvas EKG line + BPM readout
    EmberCanvas.jsx   Rising ember particles
    PixelButton.jsx / Chip.jsx / Panel.jsx / SectionHead.jsx / Toast.jsx
  hooks/
    useWibClock.js    Live WIB clock (Asia/Jakarta)
    useActiveSection.js Highlights the nav tab in view
  contexts/
    ToastContext.jsx  Toast state; showPreviewToast() for all action buttons
  constants/
    vein.js           All design figures: rates, pools, tokenomics,
                      fees, rules, pulse log, nav
  utils/
    format.js         US number formatting (fmt / fmtBnb)
  services/
    preview.js        Preview-mode data (sale status, pool stats,
                      claimable, referrals, epoch) — swap for on-chain
                      reads when the contract is deployed
  assets/
    hero.webp         Hero art (vein network + crystal heart)
    pool.webp         Pool scene art
```

## After the contract is deployed

1. Replace the functions in `src/services/preview.js` with real reads from
   VeinCore / VeinToken (sale status, shares, claimable, referrals, epoch).
2. Wire the action buttons (Connect Agent Wallet, Buy, Deposit, Claim,
   Copy link) to the wallet + contract calls — today they only call
   `showPreviewToast()`.
3. Add the agent-command section (needs the deployed contract addresses —
   deliberately not included yet).
4. No refund information is published anywhere in this app, by design.

## Note

- Copy is US English; numbers are US-formatted.
- Fully responsive (mobile / tablet / desktop); the buy form fits a phone screen.
