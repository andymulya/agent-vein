// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/utils/ReentrancyGuardUpgradeable.sol";
import "./interfaces/Interfaces.sol";

/// @title Agent Vein Core ($VEIN) — sale, Pool A/B mining, claims, vesting, referral, LP.
/// @notice BNB-only deposit-mining on BSC, modeled on AGC + SHADES. Upgradeable behind a
///         TransparentUpgradeableProxy whose admin is a ProxyAdmin owned by Andy's wallet.
/// @dev SECURITY (per Andy: "bikin yang aman"):
///  - NO function lets the owner/dev drain user funds or move tokens arbitrarily. There is NO
///    owner withdraw, NO mint-to-arbitrary-address, NO balance reassignment. The owner can only:
///    (1) enable the sale refund (one-way, see refundSale), (2) change the opsWallet (fee
///    recipient) on this contract. That is the ENTIRE admin surface (plus proxy upgrades,
///    which are Andy's own key by his explicit decision — see below).
///  - NO delegatecall. NO selfdestruct. The proxy admin is Andy's personal wallet (via a
///    ProxyAdmin he owns). RISK, stated honestly: whoever holds Andy's wallet key can upgrade
///    this logic to anything, including a draining version. There is NO timelock by Andy's
///    explicit decision ("gapapa pakai proxy biar nanti saya bisa ubah logik"). If that key is
///    compromised, funds are at risk. Mitigation is entirely key custody, not code.
///  - ReentrancyGuard on every deposit/withdraw/claim/refund function + checks-effects-
///    interactions throughout. All external calls (router, token) happen AFTER state updates,
///    except where the result is needed first (router quotes are view-only).
///  - Exact-amount approvals only. The core approves the router for exactly the amount each
///    operation needs, and resets the allowance to 0 after addLiquidity.
///  - All economics are integer math. No floating point anywhere.
///  - The sale rate is IMMUTABLE (6,874,000 VEIN per 1 BNB, ~$0.0001/VEIN at BNB $687.40).
///    There is no oracle: if BNB moves, the effective USD price moves. See README notes.
///  - Transfer tax (2%) and snipe tax (99%, opening block only) live in the token and are
///    immutable constants; the core cannot change them.
contract VeinCore is Initializable, OwnableUpgradeable, ReentrancyGuardUpgradeable {
    // ---------- Immutable external addresses (BSC mainnet) ----------
    address public constant ROUTER = 0x10ED43C718714eb63d5aA57B78B54704E256024E; // PancakeSwap V2
    address public constant FACTORY = 0xcA143Ce32Fe78f1f7019d7d551a6402fC5350c73; // PancakeSwap V2
    address public constant WBNB = 0xbb4CdB9CBd36B01bD1cBaEBF2De08d9173bc095c;
    address public constant AGENT_ID_REGISTRY = 0x60B9262456dE011F7d15a54CdD8c48bAaa8B022F; // SPACE ID Agent ID (ERC721)
    address public constant DEAD = 0x000000000000000000000000000000000000dEaD;

    // ---------- Economics (all fixed at deploy, none changeable by owner) ----------
    uint256 public constant SHARE_PRICE = 0.001 ether; // 1 share = 0.001 BNB
    uint256 public constant EPOCH_SHARES = 150_000; // rewards halve every 150,000 shares
    uint256 public constant REWARD_A_PER_SHARE = 750 ether; // Pool A: 750 VEIN / share
    uint256 public constant REWARD_B_PER_SHARE = 2500 ether; // Pool B: 2,500 VEIN / share
    uint256 public constant REFUND_DELAY = 1 days; // Pool A refundable after 24h
    uint256 public constant VEST_B_DURATION = 14 days; // Pool B reward vests linear 14d
    uint256 public constant TEAM_VEST_DURATION = 180 days; // team 80M vests linear 6 months
    uint256 public constant CLAIM_FEE_BPS = 500; // 5% of claimed VEIN -> opsWallet
    uint256 public constant POOL_A_FEE_BPS = 500; // 5% of Pool A BNB refund -> opsWallet
    uint256 public constant REFERRAL_BOUNTY = 1000 ether; // flat 1,000 VEIN per qualified referral
    uint256 public constant COMPOUND_THRESHOLD = 10_000 ether; // min tax VEIN to compound into LP
    uint256 public constant SWAP_SLIPPAGE_BPS = 300; // 3% max slippage on core swaps (minOut 97%)
    uint256 public constant LP_SLIPPAGE_BPS = 500; // 5% max slippage on LP add/remove (mins 95%)

    /// @notice VEIN per 1 BNB, in VEIN base units (18 decimals). 6,874,000 VEIN/BNB => 6,874
    ///         VEIN per 0.001 BNB, i.e. ~$0.0001/VEIN at BNB $687.40. Immutable, no oracle.
    uint256 public constant VEIN_PER_BNB = 6_874_000 ether;

    uint256 public constant MINING_ALLOC = 500_000_000 ether;
    uint256 public constant SALE_ALLOC = 200_000_000 ether;
    uint256 public constant LP_ALLOC = 150_000_000 ether;
    uint256 public constant COMMUNITY_ALLOC = 50_000_000 ether;
    uint256 public constant TEAM_VEST_AMT = 80_000_000 ether;

    // ---------- v2: share-based sale (1 share = 5,000 VEIN) ----------
    uint256 public constant VEIN_PER_SHARE = 5000 ether;
    uint256 public constant FREE_SHARES = 1000; // first-mint free quota (community-funded)
    uint256 public constant FREE_MINT_AMOUNT = 5000 ether; // 1 free share per wallet
    uint256 public constant MAX_MINT_SHARES = 10; // lifetime mint cap per wallet
    uint256 public constant MAX_POOL_SHARES = 10; // lifetime pool-deposit cap per wallet
    uint256 public constant SALE_THRESHOLD = 40_000_000 ether; // 20% of SALE_ALLOC: pools+LP open

    // ---------- State ----------
    IVeinToken public token;
    address public opsWallet;
    address public pair; // VEIN/WBNB pair, set when LP is seeded

    bool public saleOpen;
    bool public poolsOpen;
    bool public saleRefundEnabled;

    uint256 public saleSold; // VEIN sold (net of refunds)
    uint256 public saleProceeds; // BNB collected from the sale (net of refunds, pre-LP)
    uint256 public totalShares; // cumulative Pool A + Pool B shares (drives halving epoch)
    uint256 public poolABnb; // outstanding Pool A principal held (refundable)

    // Allocation accounting (for the tax-compounding formula; see unallocatedVein()).
    uint256 public saleRemaining;
    uint256 public lpRemaining;
    uint256 public communityRemaining;
    uint256 public teamVestingRemaining;
    uint256 public miningReserved; // rewards promised (deposited) but not yet claimed
    uint256 public miningPaid; // rewards already claimed (cumulative)
    uint256 public teamVestingClaimed;
    uint256 public vestingStart;

    struct PositionA {
        address owner;
        uint64 shares;
        uint64 depositTime;
        uint256 reward; // VEIN locked at deposit (halving applied)
        bool claimed;
    }
    struct PositionB {
        address owner;
        uint64 shares;
        uint64 depositTime;
        uint256 reward; // total VEIN reward (vests linear 14d)
        uint256 rewardClaimed;
        uint256 lpTokens; // LP tokens held for this position
        bool withdrawn;
    }

    PositionA[] public positionsA;
    PositionB[] public positionsB;

    mapping(address => uint256) public purchased; // VEIN bought in the sale (for refunds)
    mapping(address => uint256) public refunded; // VEIN refunded in the sale
    mapping(address => uint256) public stakeCount; // Pool A/B deposits (referral: 2x to qualify)
    mapping(address => address) public referrerOf; // set on first stake, immutable after
    mapping(address => bool) public referralPaid;

    // ---------- v2 state (APPENDED after all v1 state — never reorder v1) ----------
    uint256 public freeClaimed; // free shares claimed (quota FREE_SHARES)
    uint256 public lpSeeded; // VEIN actually added to LP so far (incremental seeding)
    mapping(address => bool) public freeMinted; // wallet already used its free share
    mapping(address => uint256) public mintedShares; // lifetime sale shares per wallet
    mapping(address => uint256) public poolSharesMinted; // lifetime pool shares per wallet

    // ---------- Events ----------
    event SharesMinted(address indexed buyer, uint256 shares, uint256 freeShares, uint256 bnbIn, uint256 veinOut);
    event PoolADeposited(uint256 indexed id, address indexed user, uint256 shares, uint256 reward);
    event PoolAClaimed(uint256 indexed id, address indexed user, uint256 veinOut, uint256 bnbOut);
    event PoolBDeposited(uint256 indexed id, address indexed user, uint256 shares, uint256 reward, uint256 lpTokens);
    event PoolBRewardClaimed(uint256 indexed id, address indexed user, uint256 veinOut);
    event PoolBWithdrawn(uint256 indexed id, address indexed user, uint256 veinOut, uint256 bnbOut, uint256 rewardOut);
    event TeamVestingClaimed(address indexed team, uint256 amount);
    event LiquiditySeeded(address indexed pair, uint256 veinIn, uint256 bnbIn, uint256 lpBurned);
    event TaxCompounded(uint256 veinIn, uint256 bnbIn, uint256 lpBurned);
    event ReferralPaid(address indexed referred, address indexed referrer, uint256 amount);
    event SaleRefundEnabled();
    event SaleRefunded(address indexed buyer, uint256 veinIn, uint256 bnbOut);
    event OpsWalletUpdated(address indexed oldWallet, address indexed newWallet);

    // ---------- Errors ----------
    error ZeroAddress();
    error NotAgentHolder();
    error SaleClosed();
    error ThresholdNotReached();
    error PoolsNotOpen();
    error BadAmount();
    error ExceedsShareCap();
    error ExceedsRemaining();
    error NoReward();
    error MiningExhausted();
    error NotOwner();
    error AlreadyClaimed();
    error StillLocked();
    error NothingToClaim();
    error NotTeam();
    error AlreadyEnabled();
    error AlreadyOpen();
    error RefundNotEnabled();
    error ExceedsPurchased();
    error InsufficientProceeds();
    error BelowThreshold();
    error NoProceeds();
    error BnbSendFailed();
    error OnlyRouter();

    /// @custom:oz-upgrades-unsafe-allow constructor
    constructor() {
        _disableInitializers();
    }

    /// @notice One-time setup, called by the deployer (Andy) via the proxy after the token
    ///         is deployed. Owner = deployer.
    function initialize(address token_, address opsWallet_) external initializer {
        __Ownable_init(msg.sender);
        __ReentrancyGuard_init();
        if (token_ == address(0) || opsWallet_ == address(0)) revert ZeroAddress();
        token = IVeinToken(token_);
        opsWallet = opsWallet_;
        vestingStart = block.timestamp;
        saleOpen = true;
        saleRemaining = SALE_ALLOC;
        lpRemaining = LP_ALLOC;
        communityRemaining = COMMUNITY_ALLOC;
        teamVestingRemaining = TEAM_VEST_AMT;
    }

    /// @notice Only the PancakeSwap router may send BNB (swap outputs / LP removals).
    ///         Plain BNB transfers from anyone else revert.
    receive() external payable {
        if (msg.sender != ROUTER) revert OnlyRouter();
    }

    // ---------- Views ----------

    function _isAgent(address user) internal view returns (bool) {
        return IAgentID(AGENT_ID_REGISTRY).balanceOf(user) > 0;
    }

    /// @notice Current halving epoch (total shares / 150,000).
    function epoch() public view returns (uint256) {
        return totalShares / EPOCH_SHARES;
    }

    function rewardPerShareA() public view returns (uint256) {
        return REWARD_A_PER_SHARE >> epoch();
    }

    function rewardPerShareB() public view returns (uint256) {
        return REWARD_B_PER_SHARE >> epoch();
    }

    /// @notice VEIN that is NOT earmarked for any allocation: the accumulated 1% LP tax share
    ///         from token transfers. This is the only VEIN compoundLp() may spend.
    /// @dev X = balance + miningPaid - (saleRem + lpRem + communityRem + teamRem + MINING_ALLOC).
    ///      The miningReserved term cancels out (reserved rewards are still in the balance and
    ///      inside MINING_ALLOC), so the formula needs only miningPaid. Defensive: 0 if negative.
    function unallocatedVein() public view returns (uint256) {
        uint256 reserved = saleRemaining + lpRemaining + communityRemaining + teamVestingRemaining + MINING_ALLOC;
        uint256 available = token.balanceOf(address(this)) + miningPaid;
        if (available <= reserved) return 0;
        return available - reserved;
    }

    function _vestedB(PositionB storage pos) internal view returns (uint256) {
        uint256 elapsed = block.timestamp - pos.depositTime;
        if (elapsed > VEST_B_DURATION) elapsed = VEST_B_DURATION;
        return (pos.reward * elapsed) / VEST_B_DURATION;
    }

    function _lpUnderlying(uint256 lpTokens) internal view returns (uint256 tokenAmt, uint256 bnbAmt) {
        IPancakePair p = IPancakePair(pair);
        (uint112 r0, uint112 r1,) = p.getReserves();
        uint256 total = p.totalSupply();
        uint256 reserveVein = p.token0() == address(token) ? uint256(r0) : uint256(r1);
        uint256 reserveBnb = p.token0() == address(token) ? uint256(r1) : uint256(r0);
        tokenAmt = (reserveVein * lpTokens) / total;
        bnbAmt = (reserveBnb * lpTokens) / total;
    }

    /// @notice Current (VEIN, BNB) reserves of the pair. Only valid once the pair exists.
    function _pairReserves() internal view returns (uint256 reserveVein, uint256 reserveBnb) {
        IPancakePair p = IPancakePair(pair);
        (uint112 r0, uint112 r1,) = p.getReserves();
        reserveVein = p.token0() == address(token) ? uint256(r0) : uint256(r1);
        reserveBnb = p.token0() == address(token) ? uint256(r1) : uint256(r0);
    }

    // ---------- Internal helpers ----------

    function _sendBnb(address to, uint256 amount) internal {
        (bool ok,) = to.call{value: amount}("");
        if (!ok) revert BnbSendFailed();
    }

    function _payVein(address to, uint256 amount) internal {
        if (amount > 0) token.transfer(to, amount);
    }

    /// @dev Records the referrer on first stake (immutable after) and pays the flat 1,000
    ///      VEIN bounty when the user reaches their 2nd stake. Bounty comes from the community
    ///      allocation; if it is exhausted the bounty is skipped (never blocks the deposit).
    function _recordStake(address user, address referrer) internal {
        if (stakeCount[user] == 0 && referrer != address(0) && referrer != user) {
            referrerOf[user] = referrer;
        }
        stakeCount[user] += 1;
        if (stakeCount[user] == 2) {
            address ref = referrerOf[user];
            if (ref != address(0) && !referralPaid[user]) {
                referralPaid[user] = true;
                if (communityRemaining >= REFERRAL_BOUNTY) {
                    communityRemaining -= REFERRAL_BOUNTY;
                    token.transfer(ref, REFERRAL_BOUNTY);
                    emit ReferralPaid(user, ref, REFERRAL_BOUNTY);
                }
            }
        }
    }

    // ---------- Token sale: share-based mint (Agent ID holders only, no time limit) ----------

    /// @notice Mint n shares (1 share = 5,000 VEIN, ≈ $0.50 at the fixed rate).
    ///         The FIRST mint of a wallet is free for 1 share while the 1,000-share free
    ///         quota lasts; minting more than 1 share on the first mint pays for n-1 shares.
    ///         Free VEIN comes from the community allocation and NEVER counts toward
    ///         `purchased` / `saleSold` (audit C1/C3: otherwise it could be refunded for
    ///         BNB, or inflate the 20% threshold). Lifetime cap: 10 shares per wallet.
    ///         Cost is ceiling division so the contract never shorts a share; excess BNB
    ///         is refunded. If the free quota is exhausted between the UI read and the tx,
    ///         the mint charges full price for all n shares (msg.value must cover it).
    function mintShares(uint256 n) external payable nonReentrant {
        if (!saleOpen) revert SaleClosed();
        if (!_isAgent(msg.sender)) revert NotAgentHolder();
        if (n == 0 || n > MAX_MINT_SHARES) revert BadAmount();
        if (mintedShares[msg.sender] + n > MAX_MINT_SHARES) revert ExceedsShareCap();
        uint256 freeShares = 0;
        if (!freeMinted[msg.sender] && freeClaimed < FREE_SHARES) {
            freeShares = 1;
        }
        uint256 paidShares = n - freeShares;
        uint256 paidVein = paidShares * VEIN_PER_SHARE;
        uint256 freeVein = freeShares * VEIN_PER_SHARE;
        if (paidVein > saleRemaining) revert ExceedsRemaining();
        if (freeVein > communityRemaining) revert ExceedsRemaining();
        uint256 cost = (paidVein * 1 ether + VEIN_PER_BNB - 1) / VEIN_PER_BNB;
        if (msg.value < cost) revert BadAmount();
        // Effects.
        mintedShares[msg.sender] += n;
        if (freeShares > 0) {
            freeMinted[msg.sender] = true;
            freeClaimed += 1;
            communityRemaining -= freeVein;
        }
        if (paidVein > 0) {
            saleRemaining -= paidVein;
            saleSold += paidVein;
            saleProceeds += cost;
            purchased[msg.sender] += paidVein;
            if (saleSold >= SALE_ALLOC) saleOpen = false;
        }
        // Interactions.
        token.transfer(msg.sender, paidVein + freeVein);
        uint256 excess = msg.value - cost;
        if (excess > 0) _sendBnb(msg.sender, excess);
        emit SharesMinted(msg.sender, n, freeShares, cost, paidVein + freeVein);
    }

    // ---------- Pool A: refundable BNB deposit, 750 VEIN/share, refund after 24h ----------

    function depositPoolA(address referrer) external payable nonReentrant {
        if (!poolsOpen) revert PoolsNotOpen();
        if (!_isAgent(msg.sender)) revert NotAgentHolder();
        if (msg.value < SHARE_PRICE || msg.value % SHARE_PRICE != 0) revert BadAmount();
        uint256 shares = msg.value / SHARE_PRICE;
        if (shares > type(uint64).max) revert BadAmount();
        if (poolSharesMinted[msg.sender] + shares > MAX_POOL_SHARES) revert ExceedsShareCap();
        uint256 reward = shares * rewardPerShareA();
        if (reward == 0) revert NoReward();
        if (miningReserved + miningPaid + reward > MINING_ALLOC) revert MiningExhausted();
        // Effects.
        uint256 id = positionsA.length;
        positionsA.push(PositionA({
            owner: msg.sender,
            shares: uint64(shares),
            depositTime: uint64(block.timestamp),
            reward: reward,
            claimed: false
        }));
        totalShares += shares;
        poolABnb += msg.value;
        miningReserved += reward;
        poolSharesMinted[msg.sender] += shares;
        _recordStake(msg.sender, referrer);
        emit PoolADeposited(id, msg.sender, shares, reward);
    }

    /// @notice After 24h: claim the VEIN reward (5% claim fee) + 95% of the BNB principal
    ///         (5% refund fee). Both fees go to opsWallet.
    function claimPoolA(uint256 positionId) external nonReentrant {
        PositionA storage pos = positionsA[positionId];
        if (pos.owner != msg.sender) revert NotOwner();
        if (pos.claimed) revert AlreadyClaimed();
        if (block.timestamp < pos.depositTime + REFUND_DELAY) revert StillLocked();
        uint256 principal = uint256(pos.shares) * SHARE_PRICE;
        uint256 reward = pos.reward;
        // Effects.
        pos.claimed = true;
        poolABnb -= principal;
        miningReserved -= reward;
        miningPaid += reward;
        uint256 rewardFee = (reward * CLAIM_FEE_BPS) / 10000;
        uint256 refundFee = (principal * POOL_A_FEE_BPS) / 10000;
        // Interactions.
        _payVein(opsWallet, rewardFee);
        _payVein(msg.sender, reward - rewardFee);
        _sendBnb(opsWallet, refundFee);
        _sendBnb(msg.sender, principal - refundFee);
        emit PoolAClaimed(positionId, msg.sender, reward - rewardFee, principal - refundFee);
    }

    // ---------- Pool B: half swaps to VEIN + half LP, 2,500 VEIN/share, 14d vesting ----------

    function depositPoolB(address referrer) external payable nonReentrant {
        if (!poolsOpen) revert PoolsNotOpen();
        if (!_isAgent(msg.sender)) revert NotAgentHolder();
        if (msg.value < SHARE_PRICE || msg.value % SHARE_PRICE != 0) revert BadAmount();
        uint256 shares = msg.value / SHARE_PRICE;
        if (shares > type(uint64).max) revert BadAmount();
        if (poolSharesMinted[msg.sender] + shares > MAX_POOL_SHARES) revert ExceedsShareCap();
        uint256 reward = shares * rewardPerShareB();
        if (reward == 0) revert NoReward();
        if (miningReserved + miningPaid + reward > MINING_ALLOC) revert MiningExhausted();
        // Effects (before external calls).
        uint256 id = positionsB.length;
        positionsB.push(PositionB({
            owner: msg.sender,
            shares: uint64(shares),
            depositTime: uint64(block.timestamp),
            reward: reward,
            rewardClaimed: 0,
            lpTokens: 0,
            withdrawn: false
        }));
        totalShares += shares;
        miningReserved += reward;
        poolSharesMinted[msg.sender] += shares;
        _recordStake(msg.sender, referrer);
        // Interactions: swap half the BNB -> VEIN, then add LP with the other half.
        uint256 halfBnb = msg.value / 2;
        address[] memory path = new address[](2);
        path[0] = WBNB;
        path[1] = address(token);
        uint256[] memory quoted = IPancakeRouter(ROUTER).getAmountsOut(halfBnb, path);
        uint256 minOut = (quoted[1] * (10000 - SWAP_SLIPPAGE_BPS)) / 10000;
        uint256[] memory swapped = IPancakeRouter(ROUTER).swapExactETHForTokens{value: halfBnb}(
            minOut, path, address(this), block.timestamp + 600
        );
        uint256 veinReceived = swapped[1];
        token.approve(ROUTER, veinReceived);
        (,, uint256 liquidity) = IPancakeRouter(ROUTER).addLiquidityETH{value: halfBnb}(
            address(token),
            veinReceived,
            (veinReceived * (10000 - LP_SLIPPAGE_BPS)) / 10000,
            (halfBnb * (10000 - LP_SLIPPAGE_BPS)) / 10000,
            address(this),
            block.timestamp + 600
        );
        token.approve(ROUTER, 0);
        positionsB[id].lpTokens = liquidity;
        emit PoolBDeposited(id, msg.sender, shares, reward, liquidity);
    }

    /// @notice Claim the currently vested part of the Pool B reward (linear 14 days).
    ///         5% claim fee applies. Callable any time; unvested part stays locked.
    function claimPoolBReward(uint256 positionId) external nonReentrant {
        PositionB storage pos = positionsB[positionId];
        if (pos.owner != msg.sender) revert NotOwner();
        if (pos.withdrawn) revert AlreadyClaimed();
        uint256 claimable = _vestedB(pos) - pos.rewardClaimed;
        if (claimable == 0) revert NothingToClaim();
        // Effects.
        pos.rewardClaimed += claimable;
        miningReserved -= claimable;
        miningPaid += claimable;
        // Interactions.
        uint256 fee = (claimable * CLAIM_FEE_BPS) / 10000;
        _payVein(opsWallet, fee);
        _payVein(msg.sender, claimable - fee);
        emit PoolBRewardClaimed(positionId, msg.sender, claimable - fee);
    }

    /// @notice After 14 days: remove the position's LP and return its VEIN + BNB proceeds,
    ///         plus any remaining vested reward (5% claim fee on the reward only).
    function withdrawPoolB(uint256 positionId) external nonReentrant {
        PositionB storage pos = positionsB[positionId];
        if (pos.owner != msg.sender) revert NotOwner();
        if (pos.withdrawn) revert AlreadyClaimed();
        if (block.timestamp < pos.depositTime + VEST_B_DURATION) revert StillLocked();
        uint256 lpTokens = pos.lpTokens;
        uint256 remainingReward = _vestedB(pos) - pos.rewardClaimed;
        // Effects.
        pos.withdrawn = true;
        if (remainingReward > 0) {
            pos.rewardClaimed += remainingReward;
            miningReserved -= remainingReward;
            miningPaid += remainingReward;
        }
        // Interactions: remove LP (proceeds come back to this contract), then pay the user.
        (uint256 expToken, uint256 expBnb) = _lpUnderlying(lpTokens);
        IPancakePair(pair).approve(ROUTER, lpTokens);
        (uint256 amountToken, uint256 amountETH) = IPancakeRouter(ROUTER).removeLiquidityETH(
            address(token),
            lpTokens,
            (expToken * (10000 - LP_SLIPPAGE_BPS)) / 10000,
            (expBnb * (10000 - LP_SLIPPAGE_BPS)) / 10000,
            address(this),
            block.timestamp + 600
        );
        IPancakePair(pair).approve(ROUTER, 0);
        if (remainingReward > 0) {
            uint256 fee = (remainingReward * CLAIM_FEE_BPS) / 10000;
            _payVein(opsWallet, fee);
            _payVein(msg.sender, remainingReward - fee);
        }
        _payVein(msg.sender, amountToken);
        if (amountETH > 0) _sendBnb(msg.sender, amountETH);
        emit PoolBWithdrawn(positionId, msg.sender, amountToken, amountETH, remainingReward);
    }

    // ---------- Team vesting: 80M VEIN, linear 6 months, opsWallet only ----------

    function claimTeamVesting() external nonReentrant {
        if (msg.sender != opsWallet) revert NotTeam();
        uint256 elapsed = block.timestamp - vestingStart;
        if (elapsed > TEAM_VEST_DURATION) elapsed = TEAM_VEST_DURATION;
        uint256 releasable = (TEAM_VEST_AMT * elapsed) / TEAM_VEST_DURATION;
        uint256 claimable = releasable - teamVestingClaimed;
        if (claimable == 0) revert NothingToClaim();
        teamVestingClaimed += claimable;
        teamVestingRemaining -= claimable;
        token.transfer(msg.sender, claimable);
        emit TeamVestingClaimed(msg.sender, claimable);
    }

    // ---------- LP seeding: opens trading + pools (permissionless, repeatable) ----------

    /// @notice OWNER-ONLY (Andy's decision 2026-11-11: when the sale reaches 20%, do NOT
    ///         open pools/LP automatically — notify Andy first and let him decide when to
    ///         seed). Seeds the LP incrementally: each call adds only the not-yet-seeded
    ///         share of the 150M VEIN allocation (LP_ALLOC x saleSold / SALE_ALLOC) paired
    ///         with ALL sale BNB collected since the last seed, and burns the LP tokens to
    ///         DEAD. The first call also opens trading (sets the snipe-tax block) and opens
    ///         the pools (one-way). Only callable once PAID sales reach 20% (40M VEIN).
    ///         price moves between seeds leave the remainder earmarked for the next seed
    ///         instead of leaking it into the tax-compound pool (audit C2).
    /// @dev Slippage mins are computed from the CURRENT pair ratio when the pair exists.
    ///      The sale ratio (5,155,500 VEIN/BNB) and the market ratio drift apart as soon
    ///      as trading opens, so fixed mins anchored to the sale ratio would brick later
    ///      seeds (revert) once the price moves >5% — stranding the remaining LP + all
    ///      later proceeds. The 5% band still applies, to the current market ratio, which
    ///      is what the router executes against.
    function seedLiquidity() external nonReentrant onlyOwner {
        if (saleSold < SALE_THRESHOLD) revert ThresholdNotReached();
        uint256 target = (LP_ALLOC * saleSold) / SALE_ALLOC;
        if (target <= lpSeeded) revert NoProceeds();
        uint256 veinToSeed = target - lpSeeded;
        uint256 bnbToSeed = saleProceeds;
        if (bnbToSeed == 0) revert NoProceeds();
        // Mins from the current pair ratio (or the desired amounts on the first seed).
        uint256 amountTokenMin;
        uint256 amountETHMin;
        if (pair != address(0)) {
            (uint256 reserveVein, uint256 reserveBnb) = _pairReserves();
            uint256 optToken = (bnbToSeed * reserveVein) / reserveBnb;
            uint256 optBnb = (veinToSeed * reserveBnb) / reserveVein;
            if (optToken <= veinToSeed) {
                amountTokenMin = (optToken * (10000 - LP_SLIPPAGE_BPS)) / 10000;
                amountETHMin = (bnbToSeed * (10000 - LP_SLIPPAGE_BPS)) / 10000;
            } else {
                amountTokenMin = (veinToSeed * (10000 - LP_SLIPPAGE_BPS)) / 10000;
                amountETHMin = (optBnb * (10000 - LP_SLIPPAGE_BPS)) / 10000;
            }
        } else {
            amountTokenMin = (veinToSeed * (10000 - LP_SLIPPAGE_BPS)) / 10000;
            amountETHMin = (bnbToSeed * (10000 - LP_SLIPPAGE_BPS)) / 10000;
        }
        // Interactions (router returns the amounts actually taken).
        token.approve(ROUTER, veinToSeed);
        (uint256 amountToken, uint256 amountETH, uint256 liquidity) = IPancakeRouter(ROUTER).addLiquidityETH{value: bnbToSeed}(
            address(token),
            veinToSeed,
            amountTokenMin,
            amountETHMin,
            DEAD,
            block.timestamp + 600
        );
        token.approve(ROUTER, 0);
        // Effects (actual amounts used).
        lpSeeded += amountToken;
        lpRemaining = LP_ALLOC - lpSeeded;
        saleProceeds -= amountETH;
        if (!poolsOpen) {
            poolsOpen = true;
            pair = IPancakeFactory(FACTORY).getPair(address(token), WBNB);
            if (!token.tradingOpen()) token.openTrading();
        }
        emit LiquiditySeeded(pair, amountToken, amountETH, liquidity);
    }

    // ---------- Tax compounding: accumulated 1% LP tax -> LP, LP tokens burned ----------

    /// @notice Permissionless. Swaps half the accumulated LP-tax VEIN to BNB and adds LP
    ///         with the other half. LP tokens go to DEAD (burned). Only the unallocated
    ///         (tax) VEIN can be spent here — allocations are protected by unallocatedVein().
    function compoundLp() external nonReentrant {
        if (pair == address(0)) revert PoolsNotOpen();
        uint256 amount = unallocatedVein();
        if (amount < COMPOUND_THRESHOLD) revert BelowThreshold();
        uint256 half = amount / 2;
        address[] memory path = new address[](2);
        path[0] = address(token);
        path[1] = WBNB;
        uint256[] memory quoted = IPancakeRouter(ROUTER).getAmountsOut(half, path);
        uint256 minOut = (quoted[1] * (10000 - SWAP_SLIPPAGE_BPS)) / 10000;
        token.approve(ROUTER, half);
        // NOTE: the router returns NO data for this function (see Interfaces.sol), so
        // the BNB received is measured by balance difference, not a return value.
        uint256 bnbBefore = address(this).balance;
        IPancakeRouter(ROUTER).swapExactTokensForETHSupportingFeeOnTransferTokens(
            half, minOut, path, address(this), block.timestamp + 600
        );
        uint256 bnbReceived = address(this).balance - bnbBefore;
        uint256 otherHalf = amount - half;
        token.approve(ROUTER, otherHalf);
        (,, uint256 liquidity) = IPancakeRouter(ROUTER).addLiquidityETH{value: bnbReceived}(
            address(token),
            otherHalf,
            (otherHalf * (10000 - LP_SLIPPAGE_BPS)) / 10000,
            (bnbReceived * (10000 - LP_SLIPPAGE_BPS)) / 10000,
            DEAD,
            block.timestamp + 600
        );
        token.approve(ROUTER, 0);
        emit TaxCompounded(amount, bnbReceived, liquidity);
    }

    // ---------- Sale refund (exists, not publicized; trigger decided by Andy later) ----------

    /// @notice Owner-only, one-way. Once enabled it cannot be disabled.
    function enableSaleRefund() external onlyOwner {
        if (saleRefundEnabled) revert AlreadyEnabled();
        saleRefundEnabled = true;
        emit SaleRefundEnabled();
    }

    /// @notice Return bought VEIN (exact-amount approval first) and get the BNB back at the
    ///         sale rate. Only works while the sale BNB is still held here (before LP seeding).
    ///         The returned VEIN goes back into the sale allocation and can be resold.
    function refundSale(uint256 veinAmount) external nonReentrant {
        if (!saleRefundEnabled) revert RefundNotEnabled();
        if (veinAmount == 0) revert BadAmount();
        uint256 refundable = purchased[msg.sender] - refunded[msg.sender];
        if (veinAmount > refundable) revert ExceedsPurchased();
        uint256 bnbOut = (veinAmount * 1 ether) / VEIN_PER_BNB;
        if (bnbOut > saleProceeds) revert InsufficientProceeds();
        // Effects.
        refunded[msg.sender] += veinAmount;
        saleSold -= veinAmount;
        saleRemaining += veinAmount;
        saleProceeds -= bnbOut;
        if (saleSold < SALE_ALLOC && !poolsOpen) saleOpen = true;
        // Interactions.
        token.transferFrom(msg.sender, address(this), veinAmount);
        _sendBnb(msg.sender, bnbOut);
        emit SaleRefunded(msg.sender, veinAmount, bnbOut);
    }

    // ---------- Owner (minimal admin surface) ----------

    /// @notice Owner-only. Changes the fee recipient on THIS contract. The token contract has
    ///         its own setOpsWallet — changing the ops wallet requires calling both.
    function setOpsWallet(address newOpsWallet) external onlyOwner {
        if (newOpsWallet == address(0)) revert ZeroAddress();
        address oldWallet = opsWallet;
        opsWallet = newOpsWallet;
        emit OpsWalletUpdated(oldWallet, newOpsWallet);
    }

    /// @dev Storage gap for future upgrades (v2 used 5 slots: freeClaimed, lpSeeded,
    ///      freeMinted, mintedShares, poolSharesMinted).
    uint256[45] private __gap;
}
