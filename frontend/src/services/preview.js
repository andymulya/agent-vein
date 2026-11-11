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
  getMintState as chainMintState,
  getPoolBWithdrawable as chainPoolBWithdrawable,
  formatVein,
  formatBnb,
} from "./chain";

export {
  connectWallet,
  getConnectedAccount,
  isAgentHolder,
  mintShares,
  depositPool,
  claimAll,
  withdrawPoolB,
  captureReferrerFromUrl,
  getStoredReferrer,
  addVeinToWallet,
  shortAddress,
  parseBnb,
} from "./chain";

export async function getSaleStatus() {
  try {
    const s = await getSaleState();
    const sold = formatVein(s.soldWei);
    const pct = (sold / SALE_ALLOCATION) * 100;
    // Pools can open at 20% while the sale is still live — the status
    // must say so instead of hiding the sale behind "POOLS OPEN" (M11).
    const status = !s.saleOpen
      ? "CLOSED"
      : pct >= 100
        ? "SOLD OUT"
        : s.poolsOpen
          ? "LIVE · POOLS OPEN"
          : "LIVE";
    return {
      sold,
      allocation: SALE_ALLOCATION,
      pct,
      status,
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
  if (!address)
    return { vein: 0, bnbReturned: 0, unlockedPct: 0, claims: [], withdrawable: [], error: false };
  try {
    const [c, w] = await Promise.all([
      chainClaimable(address),
      chainPoolBWithdrawable(address),
    ]);
    return {
      vein: formatVein(c.veinWei),
      bnbReturned: formatBnb(c.bnbWei),
      unlockedPct: c.unlockedPct,
      claims: c.claims,
      // Matured Pool B positions ready for LP withdrawal (H3).
      withdrawable: w.map((p) => ({
        id: p.id,
        shares: p.shares,
        lpTokens: formatVein(p.lpTokensWei),
        reward: formatVein(p.rewardWei),
        matured: p.matured,
        unlocksAt: p.unlocksAt,
      })),
      error: false,
    };
  } catch {
    // M6: never show a wrong zero when the reads fail — flag the error.
    return { vein: 0, bnbReturned: 0, unlockedPct: 0, claims: [], withdrawable: [], error: true };
  }
}

/** v2 mint state for the connected wallet. Fails soft on v1 (reads revert). */
export async function getMintState(address) {
  if (!address)
    return { freeMinted: false, mintedShares: 0, poolSharesMinted: 0, freeClaimed: 0, freeAvailable: false, remainingMint: 10, remainingPool: 10, live: false };
  try {
    const s = await chainMintState(address);
    return { ...s, live: true };
  } catch {
    return { freeMinted: false, mintedShares: 0, poolSharesMinted: 0, freeClaimed: 0, freeAvailable: false, remainingMint: 10, remainingPool: 10, live: false };
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
    return {
      epoch: e.epoch,
      poolAReward: formatVein(e.rewardAWei),
      poolBReward: formatVein(e.rewardBWei),
    };
  } catch {
    return { epoch: 1, poolAReward: 750, poolBReward: 2500 };
  }
}
