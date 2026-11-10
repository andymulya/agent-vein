# Agent Vein — Logic verification note

Compiled clean (solc 0.8.28, optimizer 200). Deployed + initialized on a local anvil chain;
state verified: saleOpen true, totalSupply 1e27, proxy holds 980M VEIN, opsWallet holds 20M.
Math below was re-checked in Python (integer math, no floating point).

## Sale — `VeinCore.buyVein()` (VeinCore.sol)
- Price: `veinOut = msg.value * VEIN_PER_BNB / 1 ether`, VEIN_PER_BNB = 6,874,000 ether.
  Verified: 0.001 BNB -> 6,874 VEIN; 1 BNB -> 6,874,000 VEIN. No floating point.
- Agent ID gate: `_isAgent()` = `IAgentID(0x60B926...).balanceOf(msg.sender) > 0`.
  Registry verified on-chain 2026-11-10: "SPACE ID Agent ID" (AI), ERC721,
  balanceOf(Andy) == 1, ownerOf(keccak256("andymulya")) == Andy's wallet.
- No time limit: `saleOpen` stays true until `saleSold >= SALE_ALLOC` (200M). Excess BNB refunded.
- Proceeds held as `saleProceeds`, used only by `seedLiquidity()` (LP) or `refundSale()`.

## Pools open only after sale sells out — `seedLiquidity()`
- Requires `saleSold >= SALE_ALLOC` (200M) and `!poolsOpen`. Permissionless, once.
- Pairs 150M VEIN + all sale BNB (~29.1 BNB), LP tokens -> DEAD (burned), then
  `token.openTrading()` (sets snipe block) and `poolsOpen = true`.

## Pool A — `depositPoolA()` / `claimPoolA()`
- Deposit: multiples of 0.001 BNB (`SHARE_PRICE`), Agent ID-gated, pools must be open.
- Reward: `shares * (750 ether >> epoch)`, epoch = `totalShares / 150,000`. Verified halvings:
  750 -> 375 -> 187 -> 93 -> 46 -> 23. Reward reserved at deposit (mining cap enforced).
- Claim: requires 24h (`REFUND_DELAY`). Pays reward minus 5% claim fee + 95% of principal;
  5% of principal -> opsWallet. ReentrancyGuard + checks-effects-interactions.

## Pool B — `depositPoolB()` / `claimPoolBReward()` / `withdrawPoolB()`
- Deposit: half BNB swaps to VEIN (minOut 97% of quote), other half + VEIN -> LP.
  LP tokens held per position. Reward: `shares * (2500 ether >> epoch)`.
- Reward vests linear 14 days: `vested = reward * min(elapsed, 14d) / 14d`. Claimable any time.
- Withdraw: requires 14 days. Removes exactly the position's LP tokens (mins 95% of
  reserve-implied value via `_lpUnderlying()`), returns VEIN + BNB proceeds + remaining
  vested reward (5% claim fee on the reward only, not on LP proceeds).

## Halving + mining cap
- Epoch = total shares (A + B) / 150,000. Rewards use `base >> epoch` (0 if epoch >= 256).
- Cap enforced at deposit: `miningReserved + miningPaid + reward <= 500M` else revert.
  Verified: Pool B-only exhausts at ~250k shares; Pool A-only never exhausts (converges,
  ~276M of 500M remains). Mixed use is between.

## Fees / tax
- Claim fee 5% of claimed VEIN -> opsWallet (`CLAIM_FEE_BPS = 500`). Pool A refund fee
  5% of BNB principal -> opsWallet. Both fixed constants.
- Transfer tax 2% (token, immutable `TAX_BPS = 200`): 1% -> opsWallet, 1% -> core.
  Core compounds it via `compoundLp()` (threshold 10,000 VEIN, LP tokens -> DEAD).
  `unallocatedVein()` formula verified: only the tax accumulation is spendable, never
  allocations. Formula: balance + miningPaid - (saleRem + lpRem + communityRem + teamRem
  + MINING_ALLOC); 0 if negative.
- Snipe tax 99% (token, immutable `SNIPE_BPS = 9900`): only when
  `block.number == openBlock`, 100% to opsWallet. Cannot be re-activated.

## Team vesting — `claimTeamVesting()`
- 20M VEIN minted direct to opsWallet at deploy (token constructor).
- 80M vests linear 6 months: `releasable = 80M * min(elapsed, 180d) / 180d - claimed`.
  Only opsWallet can call. ~444,444 VEIN/day, ~13.33M/month. Start = initialize time.

## Referral — `_recordStake()` / `_maybePayReferral()`
- Referrer recorded on first Pool A/B stake (immutable after; self-referral blocked).
- Bounty paid when `stakeCount == 2`: flat 1,000 VEIN from the community allocation
  (50M -> max 50,000 referrals). If the community allocation is exhausted the bounty is
  skipped (deposit never reverts because of it). Paid once per user.

## Sale refund (exists, not publicized) — `enableSaleRefund()` / `refundSale()`
- `enableSaleRefund()` is owner-only and one-way (cannot be disabled once enabled).
- `refundSale(amount)`: returns bought VEIN (exact-amount approval first), gets BNB back
  at the sale rate; VEIN goes back into the sale allocation. Only while sale BNB is still
  held (before LP seeding); otherwise reverts. Trigger decision is Andy's (later).

## Upgradability
- VeinCore behind TransparentUpgradeableProxy; admin = ProxyAdmin owned by Andy's wallet.
  Token is NOT upgradeable (plain ERC20, immutable logic).
