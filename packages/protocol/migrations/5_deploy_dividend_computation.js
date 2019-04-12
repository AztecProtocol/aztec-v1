/* global artifacts */
const { proofs } = require('@aztec/dev-utils');

const ACE = artifacts.require('./ACE.sol');
const DividendComputation = artifacts.require('./DividendComputation.sol');
const DividendComputationInterface = artifacts.require('./DividendComputationInterface.sol');

DividendComputation.abi = DividendComputationInterface.abi;

module.exports = (deployer) => {
    return deployer.deploy(DividendComputation).then(async ({ address: dividendComputationAddress }) => {
        const ace = await ACE.at(ACE.address);
        await ace.setProof(proofs.DIVIDEND_PROOF, dividendComputationAddress);
    });
};
