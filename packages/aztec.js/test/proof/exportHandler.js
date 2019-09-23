/* eslint-disable new-cap */
const secp256k1 = require('@aztec/secp256k1');
const { expect } = require('chai');
const sinon = require('sinon');
const { randomHex } = require('web3-utils');

const helpers = require('../../src/proof/exportHandler/helpers');
const JoinSplitProof65793 = require('../../src/proof/proofs/BALANCED/epoch0/joinSplit');
const { JoinSplitProof, proofHandler } = require('../../src/proof');
const note = require('../../src/note');

const { publicKey } = secp256k1.generateAccount();

describe('Export handler', () => {
    let inputNotes;
    let outputNotes;
    const sender = randomHex(20);
    const publicValue = 0;
    const publicOwner = randomHex(20);
    let numNotes;

    beforeEach(async () => {
        const inputNote = await note.create(publicKey, 100);
        inputNotes = [inputNote];

        const outputNote1 = await note.create(publicKey, 40);
        const outputNote2 = await note.create(publicKey, 60);
        outputNotes = [outputNote1, outputNote2];

        numNotes = inputNotes.length + outputNotes.length;
    });

    describe('Success states', () => {
        it('should create a proof', () => {
            const proof = new JoinSplitProof(inputNotes, outputNotes, sender, publicValue, publicOwner);
            expect(proof.data.length).to.equal(numNotes);
            expect(proof.challengeHex.length).to.equal(66);
        });

        it('should call a proof with custom epoch number', () => {
            const latestEpochStub = sinon.stub(helpers, 'validateEpochNum').callsFake(() => {
                return 2;
            });

            const trueLocalEpochProofVersions = proofHandler.catalogue.versions;

            // Add a dummy epoch2 proof
            const dummyProof = JoinSplitProof65793;
            const dummyEpochProofVersions = {
                JOIN_SPLIT: {
                    1: JoinSplitProof65793,
                    2: dummyProof,
                },
            };
            proofHandler.catalogue.versions = dummyEpochProofVersions;

            const proof = new JoinSplitProof.epoch(2)(inputNotes, outputNotes, sender, publicValue, publicOwner);
            expect(proof.data.length).to.equal(numNotes);
            expect(proof.challengeHex.length).to.equal(66);

            latestEpochStub.restore();
            proofHandler.catalogue.versions = trueLocalEpochProofVersions;
        });

        it('should set a default epoch number and then create a proof with this epoch number', () => {
            const latestEpochStub = sinon.stub(helpers, 'validateEpochNum').callsFake(() => {
                return 2;
            });

            expect(proofHandler.catalogue.defaultEpochNum).to.equal(1);

            class MockProof {
                constructor() {
                    this.mock = 'mockProof';
                }
            }

            const trueLocalEpochProofVersions = proofHandler.catalogue.versions;

            // Add a dummy epoch2 proof
            const dummyEpochProofVersions = {
                JOIN_SPLIT: {
                    1: JoinSplitProof65793,
                    2: MockProof,
                },
            };
            proofHandler.catalogue.versions = dummyEpochProofVersions;

            // Create a proof and set the default epoch to 2
            new JoinSplitProof.epoch(2, true)(inputNotes, outputNotes, sender, publicValue, publicOwner);

            // Check that the default proof epoch has been set to 2
            expect(proofHandler.catalogue.defaultEpochNum).to.equal(2);

            const mockProofResult = new JoinSplitProof();
            expect(mockProofResult.mock).to.equal('mockProof');

            latestEpochStub.restore();

            // Reset proofHandler variables back to defaults
            proofHandler.catalogue.versions = trueLocalEpochProofVersions;
            proofHandler.catalogue.defaultEpochNum = 1;
        });
    });

    describe('Failure states', () => {
        it('should fail to call a proof with an out of bounds epoch number', () => {
            try {
                const _ = new JoinSplitProof.epoch(2)(inputNotes, outputNotes, sender, publicValue, publicOwner);
            } catch (err) {
                expect(err.message).to.equal('EPOCH_DOES_NOT_EXIST');
            }
        });

        it('should fail to set a default epoch number that is out of bounds', () => {
            try {
                const _ = new JoinSplitProof.epoch(2, true)(inputNotes, outputNotes, sender, publicValue, publicOwner);
            } catch (err) {
                expect(err.message).to.equal('EPOCH_DOES_NOT_EXIST');
            }
        });
    });
});
