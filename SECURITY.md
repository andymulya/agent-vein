# Agent Vein — Security notes ("bikin yang aman")

## Admin powers — complete list (there are only these)

### VeinToken (owner = Andy's wallet)
| Power | What it can do | Limit / why it is safe |
|---|---|---|
| `setOpsWallet(address)` | Redirect FUTURE 2% tax to a new wallet | Cannot change the 2% rate, cannot touch balances, cannot mint. Only future tax flow moves. If Andy's key is lost, tax would keep going to the old wallet. |
| (none other) | — | No mint, no pause, no tax-rate setter, no exemption setter, no blacklist. Tax rate (2%) and snipe tax (99%, opening block only) are immutable constants. |

### VeinCore (owner = Andy's wallet, behind proxy)
| Power | What it can do | Limit / why it is safe |
|---|---|---|
| `enableSaleRefund()` | Open the sale-refund window | One-way only (cannot be disabled once enabled). It does NOT move any funds by itself; users must individually refund their own purchases. |
| `setOpsWallet(address)` | Redirect FUTURE fees (claim/refund/referral source) on this contract | Cannot touch user deposits, sale proceeds, or token balances. Note: the token has its own `setOpsWallet` — changing the ops wallet requires calling BOTH contracts. |
| Proxy upgrade (via ProxyAdmin) | Replace the core logic with anything | **This is the big one — see below.** No timelock, by Andy's explicit decision. |

### What the owner CANNOT do (by design — no such function exists)
- Withdraw user BNB deposits (Pool A principal, sale proceeds) or VEIN balances.
- Mint VEIN to any address (fixed 1B supply, minted once in the token constructor).
- Move tokens between user accounts or reassign positions.
- Change the sale price, share price, reward rates, halving, fees, tax, vesting schedule,
  or referral bounty (all constants).
- Re-activate the snipe tax (only `block.number == openBlock`, set once).
- Pause trading, deposits, claims, or refunds (no pause function exists).
- Approve/spend user tokens (the core only pulls VEIN via `transferFrom` with the user's
  own exact-amount approval, only inside `refundSale()`).

## The honest risk: the proxy upgrade key
- The proxy admin is a ProxyAdmin owned by the NEW project wallet (`0x72ebd7a99e416e737559206a7ee96c549b1c9210`).
  Whoever controls that key can upgrade VeinCore to ANY logic — including a version that
  drains deposits. There is NO timelock and NO multi-sig, because Andy explicitly declined
  both ("gapapa pakai proxy biar nanti saya bisa ubah logik").
- Mitigation is entirely key custody: keep that wallet's key/seed safe, never connect it to
  untrusted dApps, never sign blind transactions. The token itself is NOT upgradeable, so
  VEIN balances and the 2% tax can never be changed by an upgrade — only the core's
  sale/pool/claim logic can.
- Recommendation (for later, not blocking deploy): move the ProxyAdmin ownership to a
  hardware wallet or a 2-of-3 multi-sig once the project has real funds in it.

## Reentrancy / flow protections
- `ReentrancyGuard` (`nonReentrant`) on: buyVein, depositPoolA/B, claimPoolA,
  claimPoolBReward, withdrawPoolB, claimTeamVesting, seedLiquidity, compoundLp, refundSale.
- Checks-effects-interactions everywhere: positions/flags/balances are updated BEFORE any
  external call (token transfer, router call, BNB send). The only exception is router
  return values that are needed first (swap outputs, LP amounts) — those are guarded by
  `nonReentrant` + slippage minimums.
- `receive()` accepts BNB ONLY from the PancakeSwap router (swap outputs / LP removals).
  Direct BNB sends from anyone else revert.
- Exact-amount approvals only: the core approves the router for exactly the amount each
  operation needs and resets the allowance to 0 after `addLiquidity`. No unlimited approvals.

## Economic / operational risks (not code bugs, but Andy should know)
- Sale rate is fixed in BNB (6,874,000 VEIN/BNB, ~$0.0001 at BNB $687.40). No oracle:
  if BNB doubles, the effective USD price halves. The rate cannot be changed after deploy.
- Pool B deposits can be sandwiched (MEV) — the 3% slippage cap limits it, but a large
  deposit into a fresh pool still moves the price. Small deposits are fine.
- `seedLiquidity()` is permissionless: anyone can trigger it the moment the sale sells out.
  That is intended (it opens trading + pools), not a bug.
- Sale refunds only work while sale BNB is still in the contract (before LP seeding).
  After seeding, refunds revert (the BNB is in the LP).
- Pool A refunds and sale refunds both draw on the same BNB balance, but they are tracked
  separately (`poolABnb` vs `saleProceeds`); the contract always holds enough for both
  because each is funded by its own deposits. A tiny dust amount of BNB can accumulate
  from Pool B `addLiquidity` ratio leftovers — it stays in the contract, unowned, harmless.
- HIVE-style transfer taxes on OTHER tokens do not apply here; VEIN itself has no
  transfer tax on core/ops/router movements (they are exempt), so the core's internal
  accounting is exact.
