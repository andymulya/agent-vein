/**
 * Preview-mode data service.
 *
 * The contract is not deployed yet, so every figure below is the static
 * preview state from the final $VEIN design draft. When the contracts go
 * live, replace these functions with real on-chain reads (VeinCore /
 * VeinToken) — the pages only consume this service, so the swap is local
 * to this file.
 */

export function getSaleStatus() {
  return {
    sold: 0,
    allocation: 200_000_000,
    pct: 0,
    status: "AWAITING LAUNCH",
  };
}

export function getPoolStats() {
  return { sharesMined: 0, veinFound: 0, locked: true };
}

export function getClaimable() {
  return { vein: 0, bnbReturned: 0, unlockedPct: 0 };
}

export function getReferralStats() {
  return { qualified: 0, earned: 0 };
}

export function getEpoch() {
  return { epoch: 1, poolAReward: 750 };
}
