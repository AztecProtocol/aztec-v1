/* global artifacts */
const { proofs } = require('@aztec/dev-utils');

const ACE = artifacts.require('./ACE.sol');
const PublicRange = artifacts.require('./PublicRange.sol');
const PublicRangeInterface = artifacts.require('./PublicRangeInterface.sol');

PublicRange.abi = PublicRangeInterface.abi;

module.exports = (deployer) => {
    return deployer.deploy(PublicRange).then(async ({ address: PublicRangeAddress }) => {
        const ace = await ACE.at(ACE.address);
        await ace.setProof(proofs.PUBLIC_RANGE_PROOF, PublicRangeAddress);
    });
};
