// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

// Remix-only helper: this file exists ONLY so Remix compiles the two
// OpenZeppelin proxy contracts needed for the manual deploy.
// It is NEVER deployed itself. VeinCore / VeinToken do not import these,
// so without this file Remix would not list them in the Deploy panel.
import "@openzeppelin/contracts/proxy/transparent/TransparentUpgradeableProxy.sol";
import "@openzeppelin/contracts/proxy/transparent/ProxyAdmin.sol";
