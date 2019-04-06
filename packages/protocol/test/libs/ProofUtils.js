/* global artifacts, contract, expect, it: true */
const { proofs } = require('@aztec/dev-utils');

const ProofUtils = artifacts.require('./ProofUtilsTest');

contract('ProofUtils', async () => {
    let proofUtils;

    beforeEach(async () => {
        proofUtils = await ProofUtils.new();
    });

    it('should return the proof components', async () => {
        const components = await proofUtils.getProofComponents(proofs.JOIN_SPLIT_PROOF);
        expect(components.epoch.toNumber()).to.equal(1);
        expect(components.category.toNumber()).to.equal(1);
        expect(components.id.toNumber()).to.equal(1);
    });
});
