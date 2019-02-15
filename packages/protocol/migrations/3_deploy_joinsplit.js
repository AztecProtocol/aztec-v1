/* global artifacts */
const ACE = artifacts.require('./ACE.sol');
const JoinSplit = artifacts.require('./JoinSplit.sol');
const JoinSplitInterface = artifacts.require('./JoinSplitInterface.sol');

JoinSplit.abi = JoinSplitInterface.abi;

module.exports = (deployer) => {
    return deployer.deploy(JoinSplit).then(async ({ address: joinSplitAddress }) => {
        const proofId = 1;
        const isBalanced = true;
        const ace = await ACE.at(ACE.address);
        await ace.setProof(proofId, joinSplitAddress, isBalanced);
    });
};
