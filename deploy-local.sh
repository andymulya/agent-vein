#!/bin/bash
# Deploy Vein contracts on a local anvil chain and measure REAL deployment gas.
# Uses anvil's unlocked account 0 (deployer). Usage: bash deploy-local.sh
set -e
export PATH="$PATH:/home/hatch/.foundry/bin"
cd ~/workspace/vein-contracts
RPC="http://127.0.0.1:8545"
DEPLOYER="0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266"

bc() { python3 -c "import json,sys; print(json.load(open('artifacts/$1.json'))['bytecode'])"; }

send_create() { # $1 = initcode, $2 = outfile
  cast send --unlocked --from $DEPLOYER --rpc-url $RPC --gas-limit 10000000 --create "$1" --json > "$2"
}
gas_of() { python3 -c "import json; d=json.load(open('$1')); print(int(d['gasUsed'],16))"; }
addr_of() { python3 -c "import json; d=json.load(open('$1')); print(d['contractAddress'])"; }

echo "--- VeinCore implementation ---"
send_create "$(bc VeinCore)" /tmp/tx_core.json
CORE_IMPL=$(addr_of /tmp/tx_core.json)
echo "impl: $CORE_IMPL gas: $(gas_of /tmp/tx_core.json)"

echo "--- ProxyAdmin (owner=deployer) ---"
ARGS=$(cast abi-encode "f(address)" $DEPLOYER)
send_create "$(bc ProxyAdmin)${ARGS#0x}" /tmp/tx_admin.json
ADMIN=$(addr_of /tmp/tx_admin.json)
echo "admin: $ADMIN gas: $(gas_of /tmp/tx_admin.json)"

echo "--- TransparentUpgradeableProxy ---"
ARGS=$(cast abi-encode "f(address,address,bytes)" $CORE_IMPL $ADMIN 0x)
send_create "$(bc TransparentUpgradeableProxy)${ARGS#0x}" /tmp/tx_proxy.json
PROXY=$(addr_of /tmp/tx_proxy.json)
echo "proxy: $PROXY gas: $(gas_of /tmp/tx_proxy.json)"

echo "--- VeinToken (core=proxy, ops=deployer) ---"
ARGS=$(cast abi-encode "f(address,address)" $PROXY $DEPLOYER)
send_create "$(bc VeinToken)${ARGS#0x}" /tmp/tx_token.json
TOKEN=$(addr_of /tmp/tx_token.json)
echo "token: $TOKEN gas: $(gas_of /tmp/tx_token.json)"

echo "--- initialize(proxy) ---"
cast send --unlocked --from $DEPLOYER --rpc-url $RPC --gas-limit 10000000 $PROXY "initialize(address,address)" $TOKEN $DEPLOYER --json > /tmp/tx_init.json
echo "init gas: $(gas_of /tmp/tx_init.json)"

echo "--- verify state ---"
echo "saleOpen: $(cast call --rpc-url $RPC $PROXY 'saleOpen()(bool)')"
echo "token totalSupply: $(cast call --rpc-url $RPC $TOKEN 'totalSupply()(uint256)')"
echo "token core: $(cast call --rpc-url $RPC $TOKEN 'core()(address)')"
echo "core token: $(cast call --rpc-url $RPC $PROXY 'token()(address)')"
echo "core owner: $(cast call --rpc-url $RPC $PROXY 'owner()(address)')"
echo "core VEIN balance: $(cast call --rpc-url $RPC $TOKEN 'balanceOf(address)(uint256)' $PROXY)"
echo "ops VEIN balance: $(cast call --rpc-url $RPC $TOKEN 'balanceOf(address)(uint256)' $DEPLOYER)"
echo "ADDRESSES core_impl=$CORE_IMPL admin=$ADMIN proxy=$PROXY token=$TOKEN"
