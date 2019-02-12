/* global artifacts */
const AZTECJoinSplit = artifacts.require('./AZTECJoinSplit.sol');
const AZTECJoinSplitInterface = artifacts.require('./AZTECJoinSplitInterface.sol');

AZTECJoinSplit.abi = AZTECJoinSplitInterface.abi;

module.exports = (deployer) => {
    return deployer.deploy(AZTECJoinSplit, deployer.network_id);
};
