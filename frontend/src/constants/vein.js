/**
 * Agent Vein design constants — single source of truth for every figure
 * on the page. All copy is US English; all numbers are US-formatted at
 * render time (see utils/format.js). No refund information lives here.
 */

export const SALE_PRICE = 0.0001; // USD per VEIN
export const TOTAL_SUPPLY = 1_000_000_000;
export const SALE_ALLOCATION = 200_000_000;
export const SALE_MAX_TARGET_USD = 20_000;
export const LIQUIDITY_ALLOCATION = 150_000_000;

/** VEIN per 1 BNB at the design reference rate (0.001 BNB ≈ 6,874 VEIN). */
export const VEIN_PER_BNB = 6_874 / 0.001;

export const SHARE_BNB = 0.001;
export const MAX_SHARES_PER_AGENT_ID = 10;
export const HALVING_EVERY_SHARES = 150_000;
export const MIN_BUY_BNB = 0.0015; // ≈ $1
export const MAX_BUY_BNB = 5;

export const NAV_ITEMS = [
  { id: "beli", label: "Buy", icon: "▣" },
  { id: "pool", label: "Pool", icon: "⛏" },
  { id: "klaim", label: "Claim", icon: "✚" },
  { id: "tokenomik", label: "Tokenomics", icon: "▤" },
  { id: "aturan", label: "Rules", icon: "▦" },
];

export const POOLS = {
  a: {
    id: "a",
    name: "POOL A",
    tag: "FAST · 24 HOURS",
    reward: 750,
    backKey: "95%",
    backCap: "PRINCIPAL BACK",
    backLabel: "PRINCIPAL RETURNED (AFTER 5% FEE)",
    back: (deposit) => deposit * 0.95,
    when: "AFTER 24 HOURS",
    desc: "Fast pulse. Deposit BNB, wait 24 hours, then claim your VEIN rewards and take your principal back (5% fee). Suited to short, repeatable rounds.",
  },
  b: {
    id: "b",
    name: "POOL B",
    tag: "LP · 14-DAY VESTING",
    reward: 2500,
    backKey: "VEIN+BNB",
    backCap: "RETURNED · VESTING",
    backLabel: "DEPOSIT ROTATED INTO VEIN + LP",
    back: (deposit) => deposit,
    when: "14-DAY VESTING",
    desc: "Deep pulse. Half of your deposit buys VEIN, half becomes liquidity. Your VEIN + BNB proceeds vest linearly over 14 days — the largest reward per share.",
  },
};

export const TOKENOMICS = [
  {
    name: "MINING",
    note: "Pool A + Pool B rewards, paid out gradually through halvings",
    pct: 50,
    amount: "500M",
    tone: "blood",
  },
  {
    name: "SALE",
    note: "Sold at $0.0001 — Agent ID only, no time limit",
    pct: 20,
    amount: "200M",
    tone: "gold",
  },
  {
    name: "LIQUIDITY",
    note: "Paired with BNB from the sale — permanent LP",
    pct: 15,
    amount: "150M",
    tone: "ember",
  },
  {
    name: "TEAM",
    note: "20% TGE unlock at launch (operations) · 80% vesting over 6 months",
    pct: 10,
    amount: "100M",
    tone: "violet",
  },
  {
    name: "COMMUNITY",
    note: "Flat 1,000 VEIN referrals + community programs",
    pct: 5,
    amount: "50M",
    tone: "mint",
  },
];

export const FEE_CARDS = [
  {
    value: "2%",
    title: "TRANSFER TAX",
    text: "Every buy and sell on the pair is taxed 2%: 1% to operations (in BNB) and 1% to LP that is burned. Regular wallet-to-wallet transfers are not taxed.",
  },
  {
    value: "5%",
    title: "POOL A FEE & CLAIM FEE",
    text: "Pool A principal returns are charged a 5% fee (BNB). Every reward claim is charged 5% (VEIN). Pool B has no principal fee — proceeds return as VEIN + BNB from the LP.",
  },
  {
    value: "99%",
    title: "SNIPE TAX — ONE TIME ONLY",
    text: "In the opening block of trading, sniper bots are taxed 99%. After that block, the tax returns to the normal 2% for everyone.",
  },
];

export const HOW_IT_WORKS = [
  {
    n: "01",
    title: "BUY $VEIN",
    text: "Agent ID holders buy VEIN at the fixed price of $0.0001 — minimum ±$1, maximum 5 BNB per wallet, no time limit.",
  },
  {
    n: "02",
    title: "LP IS FORMED",
    text: "When all 200M VEIN are sold, all BNB from the sale + the 150M VEIN liquidity allocation become permanent LP on PancakeSwap.",
  },
  {
    n: "03",
    title: "POOLS START PULSING",
    text: "Pool A & Pool B open. Deposit BNB per share (max 10 / Agent ID); positions are recorded in the contract with no NFT.",
  },
  {
    n: "04",
    title: "MINE & CLAIM",
    text: "Pool A: claim + principal back after 24 hours. Pool B: VEIN + BNB proceeds vest gradually over 14 days.",
  },
];

export const PULSE_LOG = [
  {
    tag: "SYSTEM",
    tone: "sys",
    html: "<b>Contract not yet deployed</b> — this page is a frontend preview.",
  },
  {
    tag: "SALE",
    tone: "inf",
    html: "The $VEIN sale awaits launch — Agent ID only, no time limit.",
  },
  {
    tag: "POOL",
    tone: "inf",
    html: "Pool A &amp; Pool B stay <b>locked</b> until the 200M VEIN sale sells out.",
  },
  {
    tag: "LP",
    tone: "inf",
    html: "All sale proceeds + 150M VEIN become permanent LP on PancakeSwap.",
  },
  {
    tag: "HALVING",
    tone: "inf",
    html: "Rewards halve every 150,000 shares — epoch 1 is the largest.",
  },
  {
    tag: "REFERRAL",
    tone: "ok",
    html: "A flat 1,000 VEIN per referral that meets the 2× staking requirement.",
  },
];
