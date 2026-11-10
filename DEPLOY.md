# Agent Vein ($VEIN) — Deployment Guide

> DO NOT deploy yet. This is the build + compile + gas-estimate package. Deployment needs
> Andy's explicit "Ya" + enough BNB (see gas section). No transaction has been broadcast.

## Contracts (compiled, solc 0.8.28, optimizer 200 runs)

| Contract | File | Initcode | Runtime |
|---|---|---|---|
| VeinToken | contracts/VeinToken.sol | 5,019 B | 3,255 B |
| VeinCore (implementation) | contracts/VeinCore.sol | 16,443 B | 16,229 B |
| TransparentUpgradeableProxy | @openzeppelin/contracts | 3,529 B | 1,115 B |
| ProxyAdmin | @openzeppelin/contracts | 1,254 B | 1,018 B |

Artifacts (ABI + bytecode): `artifacts/<Contract>.json`. Compile: `node compile.js`.
Local deploy test: `bash deploy-local.sh` (needs anvil running).

## Deployment order (BSC mainnet, chain 56, deployer = Andy's wallet)

| Step | Contract | Constructor args | Gas (measured on anvil) |
|---|---|---|---|
| 1 | VeinCore implementation | — (none) | 3,588,229 |
| 2 | ProxyAdmin | owner = `0xD1402b47621ee4e3106442BF36fFafF85c9E6A44` | 301,043 |
| 3 | TransparentUpgradeableProxy | implementation = step 1, admin = step 2, data = `0x` | 643,754 |
| 4 | VeinToken | core = step 3 (proxy), opsWallet = `0xD1402b47621ee4e3106442BF36fFafF85c9E6A44` | 946,936 |
| 5 | `initialize` on the proxy | token = step 4, opsWallet = `0xD1402b47621ee4e3106442BF36fFafF85c9E6A44` | 274,881 |
| **Total** | | | **5,754,843 gas** |

Notes:
- Step 5 must be called by the deployer (it sets owner = deployer). Verify after: `saleOpen() == true`,
  `token() == <step 4>`, `owner() == <deployer>`, token `totalSupply() == 1e27`,
  proxy VEIN balance `980M`, opsWallet VEIN balance `20M`.
- After deploy: verify all 4 contracts on Sourcify/BscScan (source in `contracts/`).
- The proxy admin is the ProxyAdmin (step 2), owned by Andy. Upgrades go through it.
  Andy's EOA can still use the core normally (buy/deposit/claim) because the proxy admin
  is the ProxyAdmin contract, not his EOA.

## Gas / BNB cost (gas price read live from BSC: 0.05 gwei, 2026-11-10 ~21:40 WIB)

| Gas price | Total deploy cost |
|---|---|
| 0.05 gwei (current) | **0.000288 BNB** |
| 0.10 gwei | 0.000575 BNB |
| 0.30 gwei | 0.001726 BNB |
| 1.00 gwei | 0.005755 BNB |

- BNB now: **0.0000768** — NOT enough (needs 0.000288 at current gas price).
- After pending HONGBAO swap: ~0.000139 — still NOT enough.
- **Minimum for deploy: ~0.00029 BNB at 0.05 gwei.** Recommended top-up target: **0.001 BNB**
  (covers gas spikes + leaves gas for the post-deploy steps + BAGENT claim 07:00 + AGC auto-claim 04:11).
- Deploy txs are sequential (each step needs the previous address). Keep ~0.0001 BNB spare
  after deploy for the first user-facing txs.

## Post-deploy (not part of deploy gas)

- `seedLiquidity()` is permissionless and called once the sale sells out (200M VEIN).
  It pairs 150M VEIN + all sale BNB (~29.1 BNB), burns the LP tokens to DEAD, opens
  trading (sets the snipe-tax block) and opens the pools. Gas ~300–500k (depends on pair state).
- `compoundLp()` is permissionless, callable once unallocated tax VEIN >= 10,000.

## Fixed parameters (set at deploy, cannot be changed later)

- Sale rate: 6,874,000 VEIN per 1 BNB (~$0.0001/VEIN at BNB $687.40). No oracle.
- Share price 0.001 BNB; halving every 150,000 shares; Pool A 750 / Pool B 2,500 VEIN per share.
- Fees: Pool A refund 5%, claim 5%, transfer tax 2% (fixed), snipe tax 99% opening block only.
- Team: 20M VEIN direct + 80M vested linear 6 months. Referral: 1,000 VEIN flat, 2x-stake rule.
- Router / factory / WBNB / Agent ID registry: hardcoded BSC mainnet addresses (see VERIFICATION.md).
