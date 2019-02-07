/* global artifacts */
const { NetworkId } = require('@aztec/contract-addresses');
const { constants: { FAKE_NETWORK_ID } } = require('@aztec/dev-utils');

const JoinSplit = artifacts.require('./JoinSplit.sol');
const JoinSplitInterface = artifacts.require('./JoinSplitInterface.sol');

JoinSplit.abi = JoinSplitInterface.abi;

const getNetworkId = (network) => {
    const capitalisedNetwork = network.charAt(0).toUpperCase() + network.slice(1);
    return NetworkId[capitalisedNetwork] || FAKE_NETWORK_ID;
};

module.exports = (deployer, network) => {
    // just a bytecode switcheroo, nothing to see here...
    // JoinSplit.bytecode = JoinSplit.bytecode.replace('JoinSplitInterface', 'JoinSplit');
    // JoinSplit.deployedBytecode = JoinSplit.deployedBytecode.replace('JoinSplitInterface', 'JoinSplit');
    const networkId = getNetworkId(network);
    return deployer.deploy(JoinSplit, networkId);
};
