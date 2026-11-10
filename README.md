# Agent Vein ($VEIN)

BNB-only deposit-mining project on BSC (chain 56), modeled on AGC + SHADES.
Agent ID holders only. Token sale at $0.0001/VEIN with no time limit; pools
open only after the 200M VEIN sale allocation sells out.

## Structure

- `contracts/VeinToken.sol` — BEP-20 token (1,000,000,000 VEIN), 2% transfer tax
- `contracts/VeinCore.sol` — sale, Pool A (refundable BNB deposits), Pool B
  (half buys VEIN + half LP, 14-day vesting), claims, referrals, team vesting
- `contracts/interfaces/Interfaces.sol` — external interfaces
- `artifacts/` — compiled ABIs + bytecode (solc 0.8.28, OpenZeppelin 5.0.2)
- `compile.js` — local compile script
- `deploy-local.sh` — local Anvil deploy + real gas measurement
- `DEPLOY.md` — deployment order and gas estimates
- `VERIFICATION.md` — design verification notes
- `SECURITY.md` — security notes and admin powers

## Deploy

See `DEPLOY.md`. Estimated deploy cost: 5,754,843 gas (~0.000288 BNB at
0.05 gwei) for 4 deploys + 1 initialize. Private repo — do not share.
