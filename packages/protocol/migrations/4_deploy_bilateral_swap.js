/* global artifacts */
const { proofs } = require('@aztec/dev-utils');

const ACE = artifacts.require('./ACE.sol');
const BilateralSwap = artifacts.require('./BilateralSwap.sol');
const BilateralSwapInterface = artifacts.require('./BilateralSwapInterface.sol');

BilateralSwap.abi = BilateralSwapInterface.abi;

module.exports = (deployer) => {
    return deployer.deploy(BilateralSwap).then(async ({ address: bilateralSwapAddress }) => {
        const ace = await ACE.at(ACE.address);
        await ace.setProof(proofs.BILATERAL_SWAP_PROOF, bilateralSwapAddress);
    });
};
