# Agent Vein ($VEIN) — Deployment Guide

> MANUAL DEPLOY by Andy (2026-11-10 ~23:12 WIB): deployer + opsWallet = NEW wallet
> `0x72ebd7a99e416e737559206a7ee96c549b1c9210` (NOT the main wallet — baw cannot use it,
> the agentic wallet is always the main wallet). Deploy via Remix (remix.ethereum.org),
> connect the new wallet via WalletConnect (Binance app) or MetaMask. No transaction
> has been broadcast yet.

## Contracts (compiled, solc 0.8.28, optimizer 200 runs)

| Contract | File | Initcode | Runtime |
|---|---|---|---|
| VeinToken | contracts/VeinToken.sol | 5,019 B | 3,255 B |
| VeinCore (implementation) | contracts/VeinCore.sol | 16,443 B | 16,229 B |
| TransparentUpgradeableProxy | @openzeppelin/contracts | 3,529 B | 1,115 B |
| ProxyAdmin | @openzeppelin/contracts | 1,254 B | 1,018 B |

Artifacts (ABI + bytecode): `artifacts/<Contract>.json`. Compile: `node compile.js`.
Local deploy test: `bash deploy-local.sh` (needs anvil running).

## Remix manual deploy — NO re-coding, just copy-paste

1. Buka remix.ethereum.org. Di File Explorer buat 4 file ini (isi copy-paste dari repo,
   path sama): `contracts/VeinCore.sol`, `contracts/VeinToken.sol`,
   `contracts/interfaces/Interfaces.sol`, `contracts/RemixDeploy.sol`.
2. Solidity Compiler: pilih **0.8.28**, centang **optimizer ON, 200 runs**, lalu Compile.
   Import `@openzeppelin/...` di-resolve otomatis oleh Remix. `RemixDeploy.sol` hanya
   supaya `ProxyAdmin` + `TransparentUpgradeableProxy` muncul di panel Deploy —
   file itu sendiri JANGAN di-deploy.
3. Deploy & Run Transactions: Environment = **WalletConnect** (Binance app) atau
   **Injected Provider** (MetaMask), connect wallet BARU `0x72eb...9210`, network
   **BSC mainnet (chain 56)**. Pastikan gas price ≤ 0.14 gwei sebelum tiap tx.
4. Deploy berurutan sesuai tabel di bawah. Untuk langkah 5: di panel Deploy pilih
   contract **VeinCore**, paste alamat proxy di **At Address**, lalu panggil
   `initialize(token, opsWallet)`.

## Deployment order (BSC mainnet, chain 56, deployer = NEW wallet 0x72ebd7a99e416e737559206a7ee96c549b1c9210)

| Step | Contract | Constructor args | Gas (measured on anvil) |
|---|---|---|---|
| 1 | VeinCore implementation | — (none) | 3,588,229 |
| 2 | ProxyAdmin | owner = `0x72ebd7a99e416e737559206a7ee96c549b1c9210` | 301,043 |
| 3 | TransparentUpgradeableProxy | implementation = step 1, admin = step 2, data = `0x` | 643,754 |
| 4 | VeinToken | core = step 3 (proxy), opsWallet = `0x72ebd7a99e416e737559206a7ee96c549b1c9210` | 946,936 |
| 5 | `initialize` on the proxy | token = step 4, opsWallet = `0x72ebd7a99e416e737559206a7ee96c549b1c9210` | 274,881 |
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

- BNB in the NEW deployer wallet: **0.00041** (verified 2026-11-10 ~23:08 WIB) — enough for
  the 0.000288 deploy gas at 0.05 gwei, with ~0.00012 spare. Do NOT deploy if gas price
  spikes above ~0.14 gwei (cost would exceed the balance). Main wallet BNB 0.000652 is
  NOT used for this deploy.
- **Minimum for deploy: ~0.00029 BNB at 0.05 gwei.**
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

## LIVE DEPLOYMENT — BSC mainnet, 2026-11-11 (manual, Remix + WalletConnect)

Deployer/opsWallet (NEW wallet, never the agentic or second wallet):
`0x72ebd7a99e416e737559206a7ee96c549b1c9210`

| Step | Contract | Address | Tx | Block |
|---|---|---|---|---|
| 1 | VeinCore (implementation) | `0xb7bd9d17e6800744a263ef8fac4cf21b3519f4e2` | `0x1e686826aec10e375dc37f90f4403922b69c44145aa2947e2e6a687578066c14` | 132892743 |
| 2 | ProxyAdmin (standalone, unused) | `0xc7aa4405741da617422961fba69c3bc3589dc3ad` | `0x3e10ad9218c792b6d82c50eca3254beed81a6c2507ffc8da7da2bcef601f8b9e` | 132895115 |
| 3 | TransparentUpgradeableProxy (redo) | `0x869d0edf28cc79b16c1b6f8fb3b399edcbe539f6` | `0x1a128d28020f5e27f75ee00389c3cbca2690f1d4c929f785b2da1026442111df` | 132897127 |
| 4 | VeinToken ($VEIN) | `0x17ccdcd9763e824a59c78f60c10e6976d5663479` | `0x5f43fe0d644a53b01865256c8b85ceb7f11d88004947af7ed1f5e9df302bed07` | 132898487 |
| 5 | initialize() on the live proxy | — | `0x2715a2b243c14df44556f2fc31c81cb417c08870233e28b0dcad83f5670399b5` | 132901298 |

Live proxy admin (auto-deployed ProxyAdmin, owner = deployer wallet):
`0xe73a2630b544bd8c757364c1d71c00a2aae0273c`

Final on-chain checks (all pass): `token()` == VeinToken, `saleOpen()` == true,
`owner()` == deployer wallet, `opsWallet()` == deployer wallet,
`totalSupply()` == 1e27, proxy holds 980,000,000 VEIN, wallet holds 20,000,000 VEIN,
`tradingOpen()` == false.

Abandoned, never use: old proxy `0x927bedf8005a65a55c1ff56de7a25847df11698f`
(initialized by mistake, tx `0x461f8e225910252760f2d951edee02d07db2a527150cd522d758c7292e86ac12`,
holds 0 VEIN, upgrade path bricked), old admin
`0xba425431a38cfe37229cbd74091e06a551e21417`, standalone ProxyAdmin above.

Notes: Remix auto gas estimation fails via WalletConnect — use a manual gas limit
per step. Remix compiles latest OpenZeppelin (5.1+): TransparentUpgradeableProxy's
constructor is `(implementation, initialOwner, _data)` and deploys its own
ProxyAdmin — the 2nd argument is an OWNER (EOA), never a ProxyAdmin contract.
