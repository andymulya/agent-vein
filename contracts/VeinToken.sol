// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/// @title Agent Vein ($VEIN)
/// @notice BEP-20 token for the Agent Vein project (BSC). Fixed 1B supply, minted once.
/// @dev SECURITY (per Andy: "bikin yang aman"):
///  - Transfer tax is an IMMUTABLE constant: 2% total (1% -> opsWallet, 1% -> core for LP
///    compounding). The owner CANNOT change the tax rate. No tax-rate setter exists.
///  - Snipe tax 99% applies ONLY on the block where trading opens (openBlock). It can never
///    be re-activated: openBlock is set once by openTrading() and the check is
///    `block.number == openBlock`.
///  - No mint function. No delegatecall. No selfdestruct. No unlimited approvals.
///  - Transfers are locked until trading opens, EXCEPT for the core, the opsWallet and the
///    PancakeSwap router (which only moves tokens on behalf of the core during LP operations).
///    The trading pair itself is NOT exempt, so buys/sells on the pair are always taxed.
///  - Owner powers (minimal): only `setOpsWallet` (redirect future tax). The core address,
///    the router and the tax rate are immutable.
contract VeinToken is ERC20, Ownable {
    uint256 public constant TOTAL_SUPPLY = 1_000_000_000 ether;

    /// @notice Fixed 2% transfer tax (200 bps). Immutable.
    uint256 public constant TAX_BPS = 200;
    /// @notice 99% snipe tax, opening block only. Immutable.
    uint256 public constant SNIPE_BPS = 9900;

    /// @notice Core contract (sale / pools / claims). Immutable. Receives the 1% LP tax share.
    address public immutable core;
    /// @notice PancakeSwap V2 router. Immutable. Exempt so core LP operations are untaxed.
    address public constant ROUTER = 0x10ED43C718714eb63d5aA57B78B54704E256024E;
    /// @notice Receives the 1% ops tax share. Changeable by owner only.
    address public opsWallet;

    /// @notice True once the core seeds LP and opens trading. One-way.
    bool public tradingOpen;
    /// @notice Block number where trading opened. Snipe tax applies ONLY on this block.
    uint256 public openBlock;

    event OpsWalletUpdated(address indexed oldWallet, address indexed newWallet);
    event TradingOpened(uint256 indexed blockNumber);

    error ZeroAddress();
    error TradingNotOpen();
    error AlreadyOpen();
    error NotCore();

    modifier onlyCore() {
        if (msg.sender != core) revert NotCore();
        _;
    }

    /// @param core_ VeinCore proxy address. Receives 980M VEIN (mining 500M + sale 200M +
    ///        liquidity 150M + team vesting 80M + community 50M).
    /// @param opsWallet_ Team/ops wallet. Receives 20M VEIN (team TGE).
    constructor(address core_, address opsWallet_) ERC20("Agent Vein", "VEIN") Ownable(msg.sender) {
        if (core_ == address(0) || opsWallet_ == address(0)) revert ZeroAddress();
        core = core_;
        opsWallet = opsWallet_;
        _mint(core_, 980_000_000 ether);
        _mint(opsWallet_, 20_000_000 ether);
    }

    /// @notice Called once by the core when LP is seeded. Sets the opening block.
    function openTrading() external onlyCore {
        if (tradingOpen) revert AlreadyOpen();
        tradingOpen = true;
        openBlock = block.number;
        emit TradingOpened(block.number);
    }

    /// @notice Owner-only. Redirects FUTURE tax to a new ops wallet. Cannot change the rate.
    function setOpsWallet(address newOpsWallet) external onlyOwner {
        if (newOpsWallet == address(0)) revert ZeroAddress();
        address oldWallet = opsWallet;
        opsWallet = newOpsWallet;
        emit OpsWalletUpdated(oldWallet, newOpsWallet);
    }

    function _isExempt(address account) internal view returns (bool) {
        return account == core || account == opsWallet || account == ROUTER;
    }

    /// @dev Tax + trading gate enforced here. Mint/burn (zero address) bypasses both.
    function _update(address from, address to, uint256 value) internal override {
        if (from == address(0) || to == address(0)) {
            super._update(from, to, value);
            return;
        }
        if (_isExempt(from) || _isExempt(to)) {
            super._update(from, to, value);
            return;
        }
        if (!tradingOpen) revert TradingNotOpen();

        uint256 taxBps = (block.number == openBlock) ? SNIPE_BPS : TAX_BPS;
        uint256 tax = (value * taxBps) / 10000;
        if (tax == 0) {
            super._update(from, to, value);
            return;
        }
        if (taxBps == SNIPE_BPS) {
            // Opening block only: entire 99% to opsWallet (penalty, not a fee split).
            super._update(from, opsWallet, tax);
        } else {
            // Normal 2% tax: 1% opsWallet, 1% core (core compounds it into LP).
            uint256 opsShare = tax / 2;
            uint256 lpShare = tax - opsShare;
            super._update(from, opsWallet, opsShare);
            super._update(from, core, lpShare);
        }
        super._update(from, to, value - tax);
    }
}
