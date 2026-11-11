/**
 * Agent Vein design constants — single source of truth for every figure
 * on the page. All copy is US English; all numbers are US-formatted at
 * render time (see utils/format.js). No refund information lives here.
 */

/**
 * LIVE DEPLOYED CONTRACTS — BSC mainnet (chain 56).
 * Deployed 2026-11-11 by the ops wallet via Remix (solc 0.8.28).
 * NEVER use the main wallet 0xD140... or second wallet 0x3819... here.
 * Abandoned (never reference): old proxy 0x927bEdF8005a65a55c1fF56de7a25847DF11698F,
 * old admin 0xba425431a38cfe37229cbd74091e06a551e21417,
 * standalone ProxyAdmin 0xc7aa4405741da617422961fba69c3bc3589dc3ad.
 */
export const CHAIN_ID = 56;
export const CHAIN_NAME = "BNB Smart Chain Mainnet";
export const RPC_URLS = [
  "https://bsc-dataseed.bnbchain.org",
  "https://bsc-dataseed2.bnbchain.org",
  "https://bsc-dataseed1.defibit.io",
  "https://bsc-dataseed1.ninicoin.io",
];
export const BSCSCAN_TX = "https://bscscan.com/tx/";
export const BSCSCAN_ADDRESS = "https://bscscan.com/address/";

/** The live core users interact with (TransparentUpgradeableProxy). */
export const VEIN_CORE = "0x869d0edf28cc79b16c1b6f8fb3b399edcbe539f6";
export const VEIN_TOKEN = "0x17ccdcd9763e824a59c78f60c10e6976d5663479";
export const VEIN_CORE_IMPL = "0xb7bd9d17e6800744a263ef8fac4cf21b3519f4e2";
export const PROXY_ADMIN = "0xe73a2630b544bd8c757364c1d71c00a2aae0273c";
export const OPS_WALLET = "0x72ebd7a99e416e737559206a7ee96c549b1c9210";
export const AGENT_ID_REGISTRY = "0x60B9262456dE011F7d15a54CdD8c48bAaa8B022F";
/** Block the live proxy was deployed in — start of eth_getLogs scans. */
export const DEPLOY_BLOCK = 132897127;

export const SALE_PRICE = 0.0001; // USD per VEIN
export const TOTAL_SUPPLY = 1_000_000_000;
export const SALE_ALLOCATION = 200_000_000;
export const SALE_MAX_TARGET_USD = 20_000;
export const LIQUIDITY_ALLOCATION = 150_000_000;
export const FREE_SHARES = 1000; // first 1,000 free mints (v2 contract)
export const FREE_MINT_AMOUNT = 5000; // VEIN per free mint

/** VEIN per 1 BNB at the design reference rate (0.001 BNB ≈ 6,874 VEIN). */
export const VEIN_PER_BNB = 6_874 / 0.001;

export const SHARE_BNB = 0.001; // pool share price (Pool A/B deposits)
export const VEIN_PER_SHARE = 5000; // 1 mint share = 5,000 VEIN ≈ $0.50
export const TOTAL_MINT_SHARES = SALE_ALLOCATION / VEIN_PER_SHARE; // 40,000
export const MAX_MINT_SHARES = 10; // per wallet
export const MAX_SHARES_PER_AGENT_ID = 10;
export const HALVING_EVERY_SHARES = 150_000;
export const MIN_BUY_BNB = 0.0015; // ≈ $1
export const MAX_BUY_BNB = 5;

export const NAV_ITEMS = [
  { id: "beli", label: "Mint", icon: "▣" },
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

export const FEE_CARDS = [  {
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
    title: "MINT $VEIN",
    text: "Agent ID holders mint VEIN at the fixed price of $0.0001 — 1 share = 5,000 VEIN ($0.50), maximum 10 shares per wallet, no time limit.",
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
    tone: "ok",
    html: "<b>Contract live on BSC mainnet</b> — sale open, Agent ID only.",
  },
  {
    tag: "SALE",
    tone: "inf",
    html: "The $VEIN sale is live — Agent ID only, no time limit.",
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
