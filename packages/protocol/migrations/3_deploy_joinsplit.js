/* global artifacts */
const JoinSplit = artifacts.require('./JoinSplit.sol');
const JoinSplitInterface = artifacts.require('./JoinSplitInterface.sol');

JoinSplit.abi = JoinSplitInterface.abi;

module.exports = (deployer) => {
    // just a bytecode switcheroo, nothing to see here...
    // JoinSplit.bytecode = JoinSplit.bytecode.replace('JoinSplitInterface', 'JoinSplit');
    // JoinSplit.deployedBytecode = JoinSplit.deployedBytecode.replace('JoinSplitInterface', 'JoinSplit');
    return deployer.deploy(JoinSplit, deployer.network_id);
};
