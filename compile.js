#!/usr/bin/env node
// Compile Vein contracts with solc-js. Resolves @openzeppelin imports from node_modules.
// Outputs ABI + bytecode + deployedBytecode size to artifacts/<Contract>.json
const fs = require("fs");
const path = require("path");
const solc = require("solc");

const ROOT = __dirname;
const CONTRACTS = [
  "contracts/VeinToken.sol",
  "contracts/VeinCore.sol",
  "@openzeppelin/contracts/proxy/transparent/TransparentUpgradeableProxy.sol",
  "@openzeppelin/contracts/proxy/transparent/ProxyAdmin.sol",
];

function findImports(importPath) {
  // OpenZeppelin + relative imports
  let full;
  if (importPath.startsWith("@openzeppelin/")) {
    full = path.join(ROOT, "node_modules", importPath);
  } else {
    // relative to the importing file is handled by solc via `contents` lookup below;
    // solc-js calls findImports with the literal string, so resolve relative to contracts/
    full = path.join(ROOT, "contracts", importPath);
    if (!fs.existsSync(full)) full = path.join(ROOT, importPath);
  }
  try {
    return { contents: fs.readFileSync(full, "utf8") };
  } catch (e) {
    return { error: "not found: " + importPath };
  }
}

const sources = {};
for (const f of CONTRACTS) {
  const full = f.startsWith("@openzeppelin/")
    ? path.join(ROOT, "node_modules", f)
    : path.join(ROOT, f);
  sources[f] = { content: fs.readFileSync(full, "utf8") };
}
// Also feed the interfaces file so relative imports resolve
sources["contracts/interfaces/Interfaces.sol"] = {
  content: fs.readFileSync(path.join(ROOT, "contracts/interfaces/Interfaces.sol"), "utf8"),
};

const input = {
  language: "Solidity",
  sources,
  settings: {
    optimizer: { enabled: true, runs: 200 },
    outputSelection: {
      "*": { "*": ["abi", "evm.bytecode.object", "evm.deployedBytecode.object"] },
    },
  },
};

const output = JSON.parse(solc.compile(JSON.stringify(input), { import: findImports }));

if (output.errors) {
  let fatal = false;
  for (const e of output.errors) {
    console.log(`[${e.severity}] ${e.formattedMessage}`);
    if (e.severity === "error") fatal = true;
  }
  if (fatal) {
    console.log("COMPILE FAILED");
    process.exit(1);
  }
}

const outDir = path.join(ROOT, "artifacts");
fs.mkdirSync(outDir, { recursive: true });
for (const file of Object.keys(output.contracts)) {
  for (const name of Object.keys(output.contracts[file])) {
    const c = output.contracts[file][name];
    const bytecode = c.evm.bytecode.object;
    const deployed = c.evm.deployedBytecode.object;
    const artifact = {
      contractName: name,
      sourceName: file,
      abi: c.abi,
      bytecode: "0x" + bytecode,
      deployedBytecode: "0x" + deployed,
      bytecodeBytes: bytecode.length / 2,
      deployedBytes: deployed.length / 2,
    };
    fs.writeFileSync(path.join(outDir, `${name}.json`), JSON.stringify(artifact, null, 2));
    console.log(`${name}: initcode ${artifact.bytecodeBytes} bytes, runtime ${artifact.deployedBytes} bytes`);
  }
}
console.log("COMPILE OK");
