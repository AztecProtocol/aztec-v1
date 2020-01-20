/* global artifacts */
const { proofs } = require('@aztec/dev-utils');

const ACE = artifacts.require('@aztec/protocol/contracts/ACE/ACE.sol');
const JoinSplit = artifacts.require('@aztec/protocol/contracts/ACE/validators/joinSplit/JoinSplit.sol');
const JoinSplitInterface = artifacts.require('@aztec/protocol/contracts/interfaces/JoinSplitInterface.sol');

JoinSplit.abi = JoinSplitInterface.abi;

module.exports = (deployer) => {
    if (process.env.NODE_ENV === 'integration') {
        return deployer.deploy(JoinSplit, {overwrite: false}).then(async ({ address: joinSplitAddress }) => {
            const ace = await ACE.at(ACE.address);
            try {
                await ace.setProof(proofs.JOIN_SPLIT_PROOF, joinSplitAddress);
            } catch (e) {}
        });
    }

    return deployer.deploy(JoinSplit).then(async ({ address: joinSplitAddress }) => {
        const ace = await ACE.at(ACE.address);
        try {
            await ace.setProof(proofs.JOIN_SPLIT_PROOF, joinSplitAddress);
        } catch (e) {}
    });
};
