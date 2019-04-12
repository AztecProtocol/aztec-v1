/* global artifacts */
const { proofs } = require('@aztec/dev-utils');

const ACE = artifacts.require('./ACE.sol');
const AdjustSupply = artifacts.require('./AdjustSupply.sol');
const AdjustSupplyInterface = artifacts.require('./AdjustSupplyInterface.sol');

AdjustSupply.abi = AdjustSupplyInterface.abi;

module.exports = (deployer) => {
    return deployer.deploy(AdjustSupply).then(async ({ address: adjustSupplyAddress }) => {
        const ace = await ACE.at(ACE.address);
        await ace.setProof(proofs.MINT_PROOF, adjustSupplyAddress);
        await ace.setProof(proofs.BURN_PROOF, adjustSupplyAddress);
    });
};
