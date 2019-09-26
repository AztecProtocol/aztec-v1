/* global artifacts */
const { proofs } = require('@aztec/dev-utils');

const ACE = artifacts.require('@aztec/protocol/contracts/ACE/ACE.sol');
const PublicRange = artifacts.require('@aztec/protocol/contracts/ACE/validators/publicRange/PublicRange.sol');
const PublicRangeInterface = artifacts.require('@aztec/protocol/contracts/interfaces/PublicRangeInterface.sol');

PublicRange.abi = PublicRangeInterface.abi;

module.exports = (deployer) => {
    return deployer.deploy(PublicRange).then(async ({ address: PublicRangeAddress }) => {
        const ace = await ACE.at(ACE.address);
        await ace.setProof(proofs.PUBLIC_RANGE_PROOF, PublicRangeAddress);
    });
};
