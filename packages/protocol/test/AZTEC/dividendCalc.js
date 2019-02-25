/* global artifacts, expect, contract, beforeEach, it:true */
// ### External Dependencies
const BN = require('bn.js');
const crypto = require('crypto');
const web3Utils = require('web3-utils');

// ### Internal Dependencies
const { params: { t2, GROUP_MODULUS, K_MAX }, proof: { dividendComputation, proofUtils } } = require('aztec.js');
const { exceptions } = require('@aztec/dev-utils');


// ### Artifacts
const DividendCalc = artifacts.require('./contracts/AZTEC/DividendCalc');
const DividendCalcInterface = artifacts.require('./contracts/AZTEC/DividendCalcInterface');


DividendCalc.abi = DividendCalcInterface.abi;

contract('DividendCalc', (accounts) => {
    let dividendCalcContract;

    // Creating a collection of tests that should pass
    describe('success states', () => {
        let testNotes;
        let za;
        let zb;

        beforeEach(async () => {
            dividendCalcContract = await DividendCalc.new(accounts[0]);
            const makerNoteValues = [90];
            const takerNoteValues = [4, 50];

            testNotes = proofUtils.makeTestNotes(makerNoteValues, takerNoteValues);

            za = 100;
            zb = 5;
        });

        it('validate Javascript based zk dividend computation', () => {
            const { proofDataUnformatted, challenge } = dividendComputation.constructProof(
                testNotes,
                za,
                zb,
                accounts[0]
            );

            const { valid, errors } = dividendComputation.verifier.verifyProof(
                proofDataUnformatted,
                challenge,
                accounts[0],
                za,
                zb
            );

            expect(valid).to.equal(true);
            expect(errors.length).to.equal(0);
        });


        it('validate smart contract based zk dividend computation', async () => {
            const { proofData, challenge } = dividendComputation.constructProof(testNotes, za, zb, accounts[0]);

            const result = await dividendCalcContract.validateDividendCalc(proofData, challenge, za, zb, t2, {
                from: accounts[0],
                gas: 4000000,
            });

            const gasUsed = await dividendCalcContract.validateDividendCalc.estimateGas(proofData, challenge, za, zb, t2, {
                from: accounts[0],
                gas: 4000000,
            });

            console.log('gas used = ', gasUsed);

            expect(result).to.equal(true);
        });
    });

    describe('failure states', () => {
        let testNotes;
        let za;
        let zb;

        beforeEach(async () => {
            dividendCalcContract = await DividendCalc.new(accounts[0]);
            const makerNoteValues = [90];
            const takerNoteValues = [4, 50];
            testNotes = proofUtils.makeTestNotes(makerNoteValues, takerNoteValues);

            za = 100;
            zb = 5;
        });

        it('validate failure for residual commitment message that does not satisfy proof relation', async () => {
            const wrongRelationship = proofUtils.makeTestNotes([90], [4, 49]);
            const { proofData, challenge } = dividendComputation.constructProof(
                wrongRelationship,
                za,
                zb,
                accounts[0]
            );

            await exceptions.catchRevert(dividendCalcContract.validateDividendCalc(proofData, challenge, za, zb, t2, {
                from: accounts[0],
                gas: 4000000,
            }));
        });

        it('validates failure when using a fake challenge', async () => {
            const { proofData } = dividendComputation.constructProof(testNotes, za, zb, accounts[0]);
            const fakeChallenge = new BN(crypto.randomBytes(32), 16).umod(GROUP_MODULUS).toString(10);

            await exceptions.catchRevert(dividendCalcContract.validateDividendCalc(proofData, fakeChallenge, za, zb, t2, {
                from: accounts[0],
                gas: 4000000,
            }));
        });

        it('validates failure for random proof data', async () => {
            const { challenge } = dividendComputation.constructProof(testNotes, za, zb, accounts[0]);

            const fakeProofData = Array.from({ length: 18 }, () => web3Utils.randomHex(32));

            await exceptions.catchRevert(dividendCalcContract.validateDividendCalc(fakeProofData, challenge, za, zb, t2, {
                from: accounts[0],
                gas: 4000000,
            }));
        });

        it('validates failure for zero input note value', async () => {
            const zeroInputValue = proofUtils.makeTestNotes([0], [4, 50]);
            const { proofData, challenge } = dividendComputation.constructProof(zeroInputValue, za, zb, accounts[0]);

            await exceptions.catchRevert(dividendCalcContract.validateDividendCalc(proofData, challenge, za, zb, t2, {
                from: accounts[0],
                gas: 4000000,
            }));
        });

        it('validates failure for zero output note value', async () => {
            const zeroOutputValue = proofUtils.makeTestNotes([90], [0, 50]);
            const { proofData, challenge } = dividendComputation.constructProof(zeroOutputValue, za, zb, accounts[0]);

            await exceptions.catchRevert(dividendCalcContract.validateDividendCalc(proofData, challenge, za, zb, t2, {
                from: accounts[0],
                gas: 4000000,
            }));
        });

        it('validates failure for zero residual note value', async () => {
            const zeroResidualValue = proofUtils.makeTestNotes([90], [4, 0]);
            const { proofData, challenge } = dividendComputation.constructProof(
                zeroResidualValue,
                za,
                zb,
                accounts[0]
            );

            await exceptions.catchRevert(dividendCalcContract.validateDividendCalc(proofData, challenge, za, zb, t2, {
                from: accounts[0],
                gas: 4000000,
            }));
        });

        it('validates failure for fake trusted setup key', async () => {
            const { proofData, challenge } = dividendComputation.constructProof(testNotes, za, zb, accounts[0]);

            const fakeTrustedSetupKey = [
                web3Utils.randomHex(32),
                web3Utils.randomHex(32),
                web3Utils.randomHex(32),
                web3Utils.randomHex(32),
            ];

            await exceptions.catchRevert(dividendCalcContract.validateDividendCalc(
                proofData,
                challenge,
                za,
                zb,
                fakeTrustedSetupKey,
                {
                    from: accounts[0],
                    gas: 4000000,
                }
            ));
        });

        it('validates failure for z_a, z_b > kMax', async () => {
            const zaHigh = K_MAX + za;
            const zbHigh = K_MAX + zb;

            const { proofData, challenge } = dividendComputation.constructProof(
                testNotes,
                zaHigh,
                zbHigh,
                accounts[0]
            );

            await exceptions.catchRevert(dividendCalcContract.validateDividendCalc(proofData, challenge, zaHigh, zbHigh, t2, {
                from: accounts[0],
                gas: 4000000,
            }));
        });
    });
});
