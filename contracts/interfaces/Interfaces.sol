// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/// @notice Minimal interface of the VEIN token used by VeinCore.
interface IVeinToken {
    function transfer(address to, uint256 amount) external returns (bool);
    function transferFrom(address from, address to, uint256 amount) external returns (bool);
    function approve(address spender, uint256 amount) external returns (bool);
    function balanceOf(address account) external view returns (uint256);
    function allowance(address owner, address spender) external view returns (uint256);
    function openTrading() external;
    function tradingOpen() external view returns (bool);
}

/// @notice Minimal PancakeSwap V2 router interface (only the functions VeinCore uses).
interface IPancakeRouter {
    function WETH() external pure returns (address);
    function getAmountsOut(uint256 amountIn, address[] calldata path) external view returns (uint256[] memory amounts);
    function swapExactETHForTokens(uint256 amountOutMin, address[] calldata path, address to, uint256 deadline)
        external
        payable
        returns (uint256[] memory amounts);
    function swapExactTokensForETHSupportingFeeOnTransferTokens(
        uint256 amountIn,
        uint256 amountOutMin,
        address[] calldata path,
        address to,
        uint256 deadline
    ) external;
    // NOTE: the real router returns NO data for the function above (verified against
    // the mainnet bytecode: raw eth_call returns 0x, while swapExactTokensForETH
    // returns a proper uint256[]). Declaring a return value would make every call
    // revert on ABI decoding — that is why v1's compoundLp could never succeed.
    // Callers must measure the BNB received by balance difference, not a return value.
    function addLiquidityETH(
        address token,
        uint256 amountTokenDesired,
        uint256 amountTokenMin,
        uint256 amountETHMin,
        address to,
        uint256 deadline
    ) external payable returns (uint256 amountToken, uint256 amountETH, uint256 liquidity);
    function removeLiquidityETH(
        address token,
        uint256 liquidity,
        uint256 amountTokenMin,
        uint256 amountETHMin,
        address to,
        uint256 deadline
    ) external returns (uint256 amountToken, uint256 amountETH);
}

/// @notice Minimal PancakeSwap V2 factory interface.
interface IPancakeFactory {
    function getPair(address tokenA, address tokenB) external view returns (address pair);
}

/// @notice Minimal PancakeSwap V2 pair interface (reserve reads for LP math + LP approval).
interface IPancakePair {
    function token0() external view returns (address);
    function token1() external view returns (address);
    function getReserves() external view returns (uint112 reserve0, uint112 reserve1, uint32 blockTimestampLast);
    function totalSupply() external view returns (uint256);
    function approve(address spender, uint256 amount) external returns (bool);
}

/// @notice SPACE ID Agent ID registry (ERC721, "SPACE ID Agent ID", symbol AI).
/// Verified on-chain 2026-11-10: the registry is live and the gate below works.
/// The gate uses balanceOf() > 0 (owns any Agent ID).
interface IAgentID {
    function balanceOf(address owner) external view returns (uint256);
}
