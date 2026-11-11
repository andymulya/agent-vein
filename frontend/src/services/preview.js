/**
 * Live data service — real on-chain reads against the deployed VeinCore /
 * VeinToken contracts (BSC mainnet), via services/chain.js.
 *
 * The pages consume these functions; every read is async and fails soft
 * (returns the last-known zero state) so the page never breaks when the
 * RPC is unreachable or no wallet is connected. Writes go through the
 * user's own wallet and always need their in-wallet confirmation.
 */
import { SALE_ALLOCATION, FREE_SHARES } from "../constants/vein";
import {
  getSaleState,
  getPoolStats as chainPoolStats,
  getFreePhase as chainFreePhase,
  getEpochInfo,
  getClaimable as chainClaimable,
  getReferralStats as chainReferralStats,
  formatVein,
  formatBnb,
} from "./chain";

export {
  connectWallet,
  getConnectedAccount,
  isAgentHolder,
  buyVein,
  depositPool,
  claimAll,
  shortAddress,
  parseBnb,
} from "./chain";

export async function getSaleStatus() {
  try {
    const s = await getSaleState();
    const sold = formatVein(s.soldWei);
    const pct = (sold / SALE_ALLOCATION) * 100;
    return {
      sold,
      allocation: SALE_ALLOCATION,
      pct,
      status: s.poolsOpen
        ? "POOLS OPEN"
        : s.saleOpen
          ? pct >= 100
            ? "SOLD OUT"
            : "LIVE"
          : "CLOSED",
      poolsOpen: s.poolsOpen,
      proceedsBnb: formatBnb(s.proceedsWei),
    };
  } catch {
    return {
      sold: 0,
      allocation: SALE_ALLOCATION,
      pct: 0,
      status: "OFFLINE",
      poolsOpen: false,
      proceedsBnb: 0,
    };
  }
}

/** Free-phase progress. On the v1 contract the read reverts → COMING SOON. */
export async function getFreePhase() {
  try {
    const f = await chainFreePhase();
    const claimed = f.claimed;
    return {
      claimed,
      total: FREE_SHARES,
      pct: (claimed / FREE_SHARES) * 100,
      status: claimed >= FREE_SHARES ? "ENDED" : "LIVE",
      live: true,
    };
  } catch {
    return {
      claimed: 0,
      total: FREE_SHARES,
      pct: 0,
      status: "COMING SOON",
      live: false,
    };
  }
}

export async function getPoolStats() {
  try {
    const s = await chainPoolStats();
    return {
      sharesMined: s.totalShares,
      veinFound: formatVein(s.miningPaidWei),
      locked: !s.poolsOpen,
    };
  } catch {
    return { sharesMined: 0, veinFound: 0, locked: true };
  }
}

export async function getClaimable(address) {
  if (!address) return { vein: 0, bnbReturned: 0, unlockedPct: 0, claims: [] };
  try {
    const c = await chainClaimable(address);
    return {
      vein: formatVein(c.veinWei),
      bnbReturned: formatBnb(c.bnbWei),
      unlockedPct: c.unlockedPct,
      claims: c.claims,
    };
  } catch {
    return { vein: 0, bnbReturned: 0, unlockedPct: 0, claims: [] };
  }
}

export async function getReferralStats(address) {
  if (!address) return { qualified: 0, earned: 0 };
  try {
    const r = await chainReferralStats(address);
    return { qualified: r.qualified, earned: formatVein(r.earnedWei) };
  } catch {
    return { qualified: 0, earned: 0 };
  }
}

export async function getEpoch() {
  try {
    const e = await getEpochInfo();
    return { epoch: e.epoch, poolAReward: formatVein(e.rewardAWei) };
  } catch {
    return { epoch: 1, poolAReward: 750 };
  }
}
