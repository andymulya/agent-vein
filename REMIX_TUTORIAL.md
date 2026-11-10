# Tutorial Deploy Agent Vein ($VEIN) di Remix — HP

> Deployer + opsWallet = wallet BARU `0x72ebd7a99e416e737559206a7ee96c549b1c9210`
> (BUKAN main wallet). Saldo: 0,00041 BNB. Deploy butuh ~0,00029 BNB di gas 0,05 gwei.
> JANGAN deploy kalau gas price di atas 0,14 gwei.

## 0. Buka Remix

Buka **app.remix.live** di browser HP (Remix pindah ke domain baru;
remix.ethereum.org masih bisa tapi akan diarahkan). Tampilan di HP sempit —
putar HP landscape kalau perlu, atau kerjakan per panel (Files → Compile → Deploy).

## 1. Buat 4 file (copy-paste, tanpa coding ulang)

Di **File Explorer > default_workspace > contracts**, buat file-file ini:

| File di Remix | Isi dari repo `andymulya/agent-vein` |
|---|---|
| `contracts/VeinCore.sol` | `contracts/VeinCore.sol` |
| `contracts/VeinToken.sol` | `contracts/VeinToken.sol` |
| `contracts/RemixDeploy.sol` | `contracts/RemixDeploy.sol` |
| `contracts/interfaces/Interfaces.sol` | `contracts/interfaces/Interfaces.sol` |

Cara copy (di browser HP, login GitHub dulu sebagai andymulya):
buka file di github.com/andymulya/agent-vein → tap tombol **Raw** → Select All →
Copy → paste ke file Remix. Pastikan tidak ada baris yang kepotong; nama file
harus sama persis (huruf besar-kecil penting).

## 2. Compile

1. Tap ikon **Compile** (logo S di sidebar kiri).
2. Compiler: pilih **0.8.28**.
3. Centang **Enable optimization**, Runs: **200**.
4. Tap **Compile**. Tunggu sampai selesai tanpa error merah.
   (Warning kuning boleh diabaikan.)

## 3. Connect wallet

1. Tap ikon **Deploy & Run Transactions** (logo panah di sidebar kiri).
2. **ENVIRONMENT**: pilih **WalletConnect** (di HP ini cara paling gampang).
3. Pilih Binance / WalletConnect, approve di aplikasi Binance.
4. Pastikan wallet yang connect adalah `0x72eb...9210` (wallet BARU).
   Kalau yang connect main wallet `0xD140...`, disconnect lalu connect ulang
   dan pilih wallet baru di aplikasi Binance.
5. Network harus **BSC Mainnet (Chain ID 56)**. Kalau masih Ethereum, ganti
   network ke BNB Smart Chain di aplikasi Binance.
6. Cek gas price di panel deploy: jangan deploy kalau di atas **0,14 gwei**.

## 4. Deploy — 5 langkah berurutan

Di panel Deploy, pilih **CONTRACT** di dropdown, isi constructor, tap **Deploy**,
confirm di aplikasi Binance. **Tunggu tiap tx confirmed** sebelum lanjut.
Catat alamat tiap contract yang muncul di **Deployed Contracts**.

| # | Contract | Constructor (isi persis) | Catat sebagai |
|---|---|---|---|
| 1 | `VeinCore` | — (kosong) | IMPLEMENTATION |
| 2 | `ProxyAdmin` | `0x72ebd7a99e416e737559206a7ee96c549b1c9210` | ADMIN |
| 3 | `TransparentUpgradeableProxy` | `0x<langkah 1>, 0x<langkah 2>, 0x` | PROXY (alamat utama) |
| 4 | `VeinToken` | `0x<proxy langkah 3>, 0x72ebd7a99e416e737559206a7ee96c549b1c9210` | TOKEN |
| 5 | `initialize` (lihat bawah) | `0x<token langkah 4>, 0x72ebd7a99e416e737559206a7ee96c549b1c9210` | — |

**Langkah 5 (initialize):** di panel Deploy, ganti CONTRACT ke **VeinCore**,
paste alamat **PROXY (langkah 3)** di kolom **At Address**, tap **At Address**.
Di bawah akan muncul fungsi-fungsi VeinCore lewat proxy. Panggil
`initialize` dengan 2 argumen di atas, confirm di Binance.

## 5. Cek hasil

- Di proxy (VeinCore via At Address): `saleOpen()` harus **true**,
  `token()` harus = alamat langkah 4, `owner()` harus = `0x72eb...9210`.
- Di VeinToken (At Address alamat langkah 4): `totalSupply()` =
  `1000000000000000000000000000` (1e27), `balanceOf(proxy)` = 980M VEIN,
  `balanceOf(0x72eb...)` = 20M VEIN.
- Kalau semua cocok → kirim 4 alamat itu ke Muse, nanti diverifikasi on-chain
  + frontend di-update + contract di-verify di Sourcify/BscScan.

## Kalau ada masalah

- **Insufficient funds** → gas price ketinggian atau saldo kurang; tunggu gas turun.
- **Wallet yang connect salah** → disconnect di Remix, connect ulang, pilih wallet baru.
- **Compile error merah** → cek 4 file lengkap, tidak kepotong saat copy-paste.
- **Remix minta pindah ke app.remix.live** → ikuti saja, workspace ikut pindah.
- **Tx stuck / pending lama** → jangan deploy ulang langkah yang sama; cek dulu
  di BscScan apakah tx sudah masuk.
