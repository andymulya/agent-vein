/**
 * Minimal on-chain client for Agent Vein — no wallet library, no extra
 * dependency. Reads go through public BSC JSON-RPC endpoints (fetch with
 * fallback); writes go through the user's injected wallet
 * (window.ethereum, EIP-1193). All selectors are the verified 4-byte
 * prefixes of the deployed VeinCore / VeinToken ABIs (see artifacts/).
 */
import {
  CHAIN_ID,
  RPC_URLS,
  VEIN_CORE,
  VEIN_TOKEN,
  AGENT_ID_REGISTRY,
  DEPLOY_BLOCK,
} from "../constants/vein";

/* ---------- selectors (verified against artifacts/*.json ABIs) ---------- */
const SEL = {
  saleOpen: "0x99288dbb",
  poolsOpen: "0x497acc33",
  saleSold: "0x647cb3ab",
  saleProceeds: "0x9ec40b1b",
  totalShares: "0x3a98ef39",
  miningPaid: "0xce7c67a4",
  epoch: "0x900cf0cf",
  rewardPerShareA: "0xfa0ac843",
  rewardPerShareB: "0xfe9fab43",
  token: "0xfc0c546a",
  positionsA: "0x6f71b190",
  positionsB: "0x31a4cebb",
  stakeCount: "0x33060d90",
  referralPaid: "0xb851d7ea",
  balanceOf: "0x70a08231",
  tradingOpen: "0xffb54a99",
  buyVein: "0xa1a89618",
  depositPoolA: "0x4e29584f",
  depositPoolB: "0xb71ab3ef",
  claimPoolA: "0xeb8c82fa",
  claimPoolBReward: "0xf868c816",
  freeClaimed: "0x1b47ec3a", // v2: free-mint shares claimed (reverts on v1)
};

const TOPIC = {
  poolADeposited:
    "0x3e9f895764b10616ee2cf1bc53ea879a16e1ff0f2be162dbfe6f6b9b21734b8e",
  poolBDeposited:
    "0xb5c79f63c9887d0a119ac4de8b7e3118ba0d89c27770ca0176aac489bd1422b5",
  referralPaid:
    "0x0a721ab4682ceb61c7e4d264ef879fc419a6d764b136e7d96ef54b2053c75673",
};

export const ZERO_ADDRESS = "0x0000000000000000000000000000000000000000";
export const REFUND_DELAY_S = 86400; // 24h, Pool A
export const VEST_B_S = 14 * 86400; // 14 days, Pool B
const SHARE_PRICE_WEI = 10n ** 15n; // 0.001 BNB

/* ---------- low-level helpers ---------- */
function toHex(n) {
  return "0x" + n.toString(16);
}

export function parseBnb(str) {
  // "0.01" -> wei as BigInt, exact decimal math, no floating point.
  const s = String(str ?? "").trim();
  if (!/^(\d+)(\.\d+)?$/.test(s)) throw new Error("Invalid BNB amount");
  const [whole, frac = ""] = s.split(".");
  return (
    BigInt(whole) * 10n ** 18n +
    BigInt((frac + "000000000000000000").slice(0, 18))
  );
}

export function formatVein(wei) {
  // BigInt wei (18 decimals) -> human number (float is fine for display).
  return Number(wei) / 1e18;
}

export function formatBnb(wei) {
  return Number(wei) / 1e18;
}

function encAddress(addr) {
  return addr.toLowerCase().replace(/^0x/, "").padStart(64, "0");
}

function encUint(n) {
  return BigInt(n).toString(16).padStart(64, "0");
}

function decUint(hex, offset = 0) {
  const word = hex.slice(2 + offset * 64, 2 + (offset + 1) * 64);
  return BigInt("0x" + (word || "0"));
}

function decAddress(hex, offset = 0) {
  return "0x" + hex.slice(2 + offset * 64 + 24, 2 + (offset + 1) * 64);
}

function decBool(hex, offset = 0) {
  return decUint(hex, offset) !== 0n;
}

export function shortAddress(addr) {
  if (!addr) return "";
  return `${addr.slice(0, 6)}…${addr.slice(-4)}`;
}

async function rpcCall(method, params) {
  const body = JSON.stringify({ jsonrpc: "2.0", id: 1, method, params });
  let lastErr = null;
  for (const url of RPC_URLS) {
    try {
      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body,
      });
      const json = await res.json();
      if (json.error) throw new Error(json.error.message || "RPC error");
      if (json.result === undefined || json.result === null)
        throw new Error("Empty RPC result");
      return json.result;
    } catch (e) {
      lastErr = e;
    }
  }
  throw lastErr || new Error("All BSC RPCs failed");
}

async function ethCall(to, data, from) {
  const tx = { to, data };
  if (from) tx.from = from;
  return rpcCall("eth_call", [tx, "latest"]);
}

async function getLogs(address, topics, fromBlock) {
  // Chunked so public RPCs (5k-block getLogs cap) stay happy.
  const latest = parseInt(await rpcCall("eth_blockNumber", []), 16);
  const out = [];
  const CHUNK = 4000;
  for (let from = fromBlock; from <= latest; from += CHUNK) {
    const to = Math.min(from + CHUNK - 1, latest);
    const logs = await rpcCall("eth_getLogs", [
      {
        address,
        topics,
        fromBlock: toHex(from),
        toBlock: toHex(to),
      },
    ]);
    out.push(...logs);
  }
  return out;
}

function topicAddr(addr) {
  return "0x" + addr.toLowerCase().replace(/^0x/, "").padStart(64, "0");
}

/* ---------- wallet ---------- */
function ethereum() {
  if (typeof window === "undefined" || !window.ethereum) {
    throw new Error(
      "No wallet found — open this page in a browser with a BSC wallet (e.g. Binance Wallet) installed.",
    );
  }
  return window.ethereum;
}

export async function getConnectedAccount() {
  try {
    const accounts = await ethereum().request({ method: "eth_accounts" });
    return accounts && accounts[0] ? accounts[0] : null;
  } catch {
    return null;
  }
}

export async function connectWallet() {
  const eth = ethereum();
  const accounts = await eth.request({ method: "eth_requestAccounts" });
  const account = accounts[0];
  const chainId = await eth.request({ method: "eth_chainId" });
  if (parseInt(chainId, 16) !== CHAIN_ID) {
    try {
      await eth.request({
        method: "wallet_switchEthereumChain",
        params: [{ chainId: toHex(CHAIN_ID) }],
      });
    } catch (e) {
      throw new Error(
        "Please switch your wallet to BNB Smart Chain (chain 56) and try again.",
      );
    }
  }
  return account;
}

async function sendTx({ to, data, value = "0x0" }) {
  const eth = ethereum();
  const from = (await eth.request({ method: "eth_accounts" }))[0];
  if (!from) throw new Error("Connect your wallet first.");
  return eth.request({
    method: "eth_sendTransaction",
    params: [{ from, to, data, value }],
  });
}

/* ---------- reads ---------- */
export async function getSaleState() {
  const [open, pools, sold, proceeds] = await Promise.all([
    ethCall(VEIN_CORE, SEL.saleOpen),
    ethCall(VEIN_CORE, SEL.poolsOpen),
    ethCall(VEIN_CORE, SEL.saleSold),
    ethCall(VEIN_CORE, SEL.saleProceeds),
  ]);
  return {
    saleOpen: decBool(open),
    poolsOpen: decBool(pools),
    soldWei: decUint(sold),
    proceedsWei: decUint(proceeds),
  };
}

export async function getPoolStats() {
  const [shares, paid, pools] = await Promise.all([
    ethCall(VEIN_CORE, SEL.totalShares),
    ethCall(VEIN_CORE, SEL.miningPaid),
    ethCall(VEIN_CORE, SEL.poolsOpen),
  ]);
  return {
    totalShares: Number(decUint(shares)),
    miningPaidWei: decUint(paid),
    poolsOpen: decBool(pools),
  };
}

/** Free-phase counter (v2). Throws on the v1 contract — caller falls back. */
export async function getFreePhase() {
  const claimed = await ethCall(VEIN_CORE, SEL.freeClaimed);
  return { claimed: Number(decUint(claimed)) };
}

export async function getEpochInfo() {
  const [epoch, rewardA, rewardB] = await Promise.all([
    ethCall(VEIN_CORE, SEL.epoch),
    ethCall(VEIN_CORE, SEL.rewardPerShareA),
    ethCall(VEIN_CORE, SEL.rewardPerShareB),
  ]);
  return {
    epoch: Number(decUint(epoch)) + 1, // display is 1-based
    rewardAWei: decUint(rewardA),
    rewardBWei: decUint(rewardB),
  };
}

export async function getVeinBalance(address) {
  const raw = await ethCall(VEIN_TOKEN, SEL.balanceOf + encAddress(address));
  return decUint(raw);
}

export async function getTradingOpen() {
  return decBool(await ethCall(VEIN_TOKEN, SEL.tradingOpen));
}

export async function isAgentHolder(address) {
  const raw = await ethCall(
    AGENT_ID_REGISTRY,
    SEL.balanceOf + encAddress(address),
  );
  return decUint(raw) > 0n;
}

async function readPositionA(id) {
  const raw = await ethCall(VEIN_CORE, SEL.positionsA + encUint(id));
  return {
    id,
    owner: decAddress(raw, 0),
    shares: Number(decUint(raw, 1)),
    depositTime: Number(decUint(raw, 2)),
    rewardWei: decUint(raw, 3),
    claimed: decBool(raw, 4),
  };
}

async function readPositionB(id) {
  const raw = await ethCall(VEIN_CORE, SEL.positionsB + encUint(id));
  return {
    id,
    owner: decAddress(raw, 0),
    shares: Number(decUint(raw, 1)),
    depositTime: Number(decUint(raw, 2)),
    rewardWei: decUint(raw, 3),
    rewardClaimedWei: decUint(raw, 4),
    lpTokensWei: decUint(raw, 5),
    withdrawn: decBool(raw, 6),
  };
}

async function userPositionIds(address) {
  const topicsA = [TOPIC.poolADeposited, null, topicAddr(address)];
  const topicsB = [TOPIC.poolBDeposited, null, topicAddr(address)];
  const [logsA, logsB] = await Promise.all([
    getLogs(VEIN_CORE, topicsA, DEPLOY_BLOCK),
    getLogs(VEIN_CORE, topicsB, DEPLOY_BLOCK),
  ]);
  // position id is the first indexed topic (uint256, topics[1])
  return {
    aIds: [...new Set(logsA.map((l) => Number(BigInt(l.topics[1]))))],
    bIds: [...new Set(logsB.map((l) => Number(BigInt(l.topics[1]))))],
  };
}

export async function getClaimable(address) {
  const now = Math.floor(Date.now() / 1000);
  const { aIds, bIds } = await userPositionIds(address);
  const [posA, posB] = await Promise.all([
    Promise.all(aIds.map(readPositionA)),
    Promise.all(bIds.map(readPositionB)),
  ]);
  let veinWei = 0n;
  let bnbWei = 0n;
  let vestedTotal = 0n;
  let rewardTotal = 0n;
  const claims = [];
  for (const p of posA) {
    if (p.owner.toLowerCase() !== address.toLowerCase() || p.claimed) continue;
    const matured = now >= p.depositTime + REFUND_DELAY_S;
    if (!matured) continue;
    veinWei += (p.rewardWei * 95n) / 100n;
    bnbWei += BigInt(p.shares) * SHARE_PRICE_WEI * 95n / 100n;
    claims.push({ kind: "A", id: p.id });
  }
  for (const p of posB) {
    if (p.owner.toLowerCase() !== address.toLowerCase() || p.withdrawn)
      continue;
    const elapsed = Math.min(
      Math.max(now - p.depositTime, 0),
      VEST_B_S,
    );
    const vested = (p.rewardWei * BigInt(elapsed)) / BigInt(VEST_B_S);
    vestedTotal += vested;
    rewardTotal += p.rewardWei;
    const claimable = vested - p.rewardClaimedWei;
    if (claimable > 0n) {
      veinWei += (claimable * 95n) / 100n;
      claims.push({ kind: "B", id: p.id });
    }
  }
  return {
    veinWei,
    bnbWei,
    claims,
    unlockedPct:
      rewardTotal > 0n ? Number((vestedTotal * 100n) / rewardTotal) : 0,
  };
}

export async function getReferralStats(address) {
  const [count, paid, logs] = await Promise.all([
    ethCall(VEIN_CORE, SEL.stakeCount + encAddress(address)),
    ethCall(VEIN_CORE, SEL.referralPaid + encAddress(address)),
    getLogs(VEIN_CORE, [TOPIC.referralPaid, null, topicAddr(address)], DEPLOY_BLOCK),
  ]);
  const qualified = new Set(logs.map((l) => l.topics[1].toLowerCase())).size;
  return {
    stakeCount: Number(decUint(count)),
    referralPaid: decBool(paid),
    qualified,
    earnedWei: BigInt(qualified) * 1000n * 10n ** 18n,
  };
}

/* ---------- writes (user confirms each tx in their wallet) ---------- */
export async function buyVein(bnbWei) {
  return sendTx({ to: VEIN_CORE, data: SEL.buyVein, value: toHex(bnbWei) });
}

export async function depositPool(poolId, shares, referrer) {
  const data =
    (poolId === "b" ? SEL.depositPoolB : SEL.depositPoolA) +
    encAddress(referrer || ZERO_ADDRESS);
  return sendTx({
    to: VEIN_CORE,
    data,
    value: toHex(BigInt(shares) * SHARE_PRICE_WEI),
  });
}

export async function claimAll(address) {
  const { claims } = await getClaimable(address);
  const txs = [];
  for (const c of claims) {
    const data =
      (c.kind === "A" ? SEL.claimPoolA : SEL.claimPoolBReward) + encUint(c.id);
    const hash = await sendTx({ to: VEIN_CORE, data });
    txs.push({ ...c, hash });
  }
  return txs;
}
