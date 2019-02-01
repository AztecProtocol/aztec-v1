/* global, beforeEach, it:true */
const BN = require('bn.js');
const chai = require('chai');
const crypto = require('crypto');
const { padLeft, randomHex } = require('web3-utils');

const bn128 = require('../../src/bn128');
const bilateralProof = require('../../src/proof/bilateralSwap');
const helpers = require('../../src/proof/bilateralSwap/helpers');
const Keccak = require('../../src/keccak');
const { K_MAX } = require('../../src/params');


const { expect } = chai;


function generateNoteValue() {
    return new BN(crypto.randomBytes(32), 16).umod(new BN(K_MAX)).toNumber();
}


describe('AZTEC bilateral swap verifier tests', () => {
    describe('success states', () => {
        let testNotes;
        let sender;

        beforeEach(() => {
            testNotes = helpers.makeTestNotes([10, 20], [10, 20]);

            // Dummy, random sender address for proof of concept
            sender = randomHex(20);
        });

        it('bilateralProof.constructBilateralSwap creates a valid bilateral swap proof', () => {
            const { proofData, challenge } = bilateralProof.constructBilateralSwap(testNotes, sender);
            const result = bilateralProof.verifier.verifyBilateralSwap(proofData, challenge, sender);

            expect(result).to.equal(true);
        });

        it('validate that the kbar relations are satisfied i.e. kbar1 = kbar3 and kbar2 = kbar4', () => {
            const { proofData, challenge } = bilateralProof.constructBilateralSwap(testNotes, sender);
            const proofDataBn = helpers.toBnAndAppendPoints(proofData);
            const formattedChallenge = new BN(challenge.slice(2), 16);

            const finalHash = new Keccak();

            proofDataBn.forEach((proofElement) => {
                finalHash.append(proofElement[6]);
                finalHash.append(proofElement[7]);
            });

            const { recoveredBlindingFactors } = helpers.recoverBlindingFactorsAndChallenge(proofDataBn,
                formattedChallenge,
                finalHash);

            const testkBar1 = (recoveredBlindingFactors[0].kBar).toString(16);
            const testkBar2 = (recoveredBlindingFactors[1].kBar).toString(16);
            const testkBar3 = (recoveredBlindingFactors[2].kBar).toString(16);
            const testkBar4 = (recoveredBlindingFactors[3].kBar).toString(16);

            expect(testkBar1).to.equal(testkBar3);
            expect(testkBar2).to.equal(testkBar4);
        });
    });

    describe('failure states', () => {
        let testNotes;
        let sender;

        beforeEach(() => {
            testNotes = helpers.makeTestNotes([10, 20], [10, 20]);

            // Dummy, random sender address for proof of concept
            sender = randomHex(20);
        });

        it('will REJECT if malformed challenge', () => {
            const { proofData } = bilateralProof.constructBilateralSwap(testNotes, sender);
            const fakeChallenge = `0x${crypto.randomBytes(31).toString('hex')}`;

            try {
                bilateralProof.verifier.verifyBilateralSwap(proofData, fakeChallenge, sender);
            } catch (err) {
                console.log('malformed challenge');
            }
        });

        it('will REJECT for random note values', () => {
            const randomNotes = helpers.makeTestNotes(
                [generateNoteValue(), generateNoteValue()], [generateNoteValue(), generateNoteValue()]
            );
            const { proofData, challenge } = bilateralProof.constructBilateralSwap(randomNotes, sender);

            try {
                bilateralProof.verifier.verifyBilateralSwap(proofData, challenge, sender);
            } catch (err) {
                console.log('random note values');
            }
        });

        it('will REJECT if bilateral swap note balancing relationship not satisfied', () => {
            const unbalancedNotes = helpers.makeTestNotes([10, 19], [10, 20]); // k_2 != k_4
            const { proofData, challenge } = bilateralProof.constructBilateralSwap(unbalancedNotes, sender);

            try {
                bilateralProof.verifier.verifyBilateralSwap(proofData, challenge, sender);
            } catch (err) {
                console.log('malformed challenge');
            }
        });

        it('will REJECT for random proof data', () => {
            const proofData = [...Array(4)]
                .map(() => [...Array(6)]
                    .map(() => `0x${padLeft(crypto.randomBytes(32).toString('hex'), 64)}`));

            const { challenge } = bilateralProof.constructBilateralSwap(testNotes, sender);

            try {
                bilateralProof.verifier.verifyBilateralSwap(proofData, challenge, sender);
            } catch (err) {
                console.log('malformed proof data');
            }
        });

        it('will REJECT if blinding factor is at infinity', () => {
            const { proofData } = bilateralProof.constructBilateralSwap(testNotes, sender);
            proofData[0][0] = `0x${padLeft('05', 64)}`;
            proofData[0][1] = `0x${padLeft('05', 64)}`;
            proofData[0][2] = `0x${padLeft(bn128.h.x.fromRed().toString(16), 64)}`;
            proofData[0][3] = `0x${padLeft(bn128.h.y.fromRed().toString(16), 64)}`;
            proofData[0][4] = `0x${padLeft(bn128.h.x.fromRed().toString(16), 64)}`;
            proofData[0][5] = `0x${padLeft(bn128.h.y.fromRed().toString(16), 64)}`;
            const challenge = `0x${padLeft('0a', 64)}`;

            try {
                bilateralProof.verifier.verifyBilateralSwap(proofData, challenge, sender);
            } catch (err) {
                console.log('blinding factor at infinity created');
            }
        });

        it('will REJECT if blinding factor computed from invalid point', () => {
            const { proofData } = bilateralProof.constructBilateralSwap(testNotes, sender);
            proofData[0][0] = `0x${padLeft('', 64)}`;
            proofData[0][1] = `0x${padLeft('', 64)}`;
            proofData[0][2] = `09x${padLeft('', 64)}`;
            proofData[0][3] = `0x${padLeft('', 64)}`;
            proofData[0][4] = `0x${padLeft('', 64)}`;
            proofData[0][5] = `0x${padLeft('', 64)}`;
            const challenge = `0x${padLeft('', 64)}`;

            try {
                bilateralProof.verifier.verifyBilateralSwap(proofData, challenge, sender);
            } catch (err) {
                console.log('blinding factor computed from invalid point');
            }
        });
    });
});
