/* global artifacts */
const { proofs } = require('@aztec/dev-utils');

const ACE = artifacts.require('./ACE.sol');
const PrivateRange = artifacts.require('./PrivateRange.sol');
const PrivateRangeInterface = artifacts.require('./PrivateRangeInterface.sol');

PrivateRange.abi = PrivateRangeInterface.abi;

module.exports = (deployer) => {
    return deployer.deploy(PrivateRange).then(async ({ address: privateRangeAddress }) => {
        const ace = await ACE.at(ACE.address);
        await ace.setProof(proofs.PRIVATE_RANGE, privateRangeAddress);
    });
};
