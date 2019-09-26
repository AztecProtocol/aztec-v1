/* global artifacts */
const { proofs } = require('@aztec/dev-utils');

const ACE = artifacts.require('@aztec/protocol/contracts/ACE/ACE.sol');
const JoinSplitFluid = artifacts.require('@aztec/protocol/contracts/ACE/validators/joinSplitFluid/JoinSplitFluid.sol');
const JoinSplitFluidInterface = artifacts.require('@aztec/protocol/contracts/interfaces/JoinSplitFluidInterface.sol');

JoinSplitFluid.abi = JoinSplitFluidInterface.abi;

module.exports = (deployer) => {
    return deployer.deploy(JoinSplitFluid).then(async ({ address: joinSplitFluidAddress }) => {
        const ace = await ACE.at(ACE.address);
        await ace.setProof(proofs.MINT_PROOF, joinSplitFluidAddress);
        await ace.setProof(proofs.BURN_PROOF, joinSplitFluidAddress);
    });
};
