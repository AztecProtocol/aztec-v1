/* eslint-disable new-cap */
import secp256k1 from '@aztec/secp256k1';

import { expect } from 'chai';
import sinon from 'sinon';
import { randomHex } from 'web3-utils';
import helpers from '../../src/proof/exportHandler/helpers';
import JoinSplitProof65793 from '../../src/proof/proofs/BALANCED/epoch0/joinSplit';
import { JoinSplitProof, proofHandler } from '../../src/proof';
import note from '../../src/note';
import ProofType from '../../src/proof/base/types';

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

        it('should set a default epoch number for joinSplit, create a proof with this epoch, other defaults constant', () => {
            const latestEpochStub = sinon.stub(helpers, 'validateEpochNum').callsFake(() => {
                return 2;
            });

            expect(proofHandler.catalogue.defaultProofEpochNums[ProofType.JOIN_SPLIT.name]).to.equal(1);

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
            expect(proofHandler.catalogue.defaultProofEpochNums[ProofType.JOIN_SPLIT.name]).to.equal(2);

            // Check that default proof epochs of other proofs have not changed
            const typesWithoutJoinSplit = ['BURN', 'DIVIDEND', 'MINT', 'PRIVATE_RANGE', 'PUBLIC_RANGE', 'SWAP'];
            typesWithoutJoinSplit.forEach((type) => {
                expect(proofHandler.catalogue.defaultProofEpochNums[type]).to.equal(1);
            });

            const mockProofResult = new JoinSplitProof();
            expect(mockProofResult.mock).to.equal('mockProof');

            latestEpochStub.restore();

            // Reset proofHandler variables back to defaults
            proofHandler.catalogue.versions = trueLocalEpochProofVersions;
            proofHandler.catalogue.defaultProofEpochNums[ProofType.JOIN_SPLIT.name] = 1;
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
