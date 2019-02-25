/* global artifacts, expect, contract, beforeEach, it:true */
// ### External Dependencies
const { proof: { joinSplit } } = require('aztec.js');
const { constants: { GROUP_MODULUS, t2 }, exceptions } = require('@aztec/dev-utils');
const BN = require('bn.js');
const crypto = require('crypto');
const { padLeft, sha3 } = require('web3-utils');

// ### Artifacts
const AZTEC = artifacts.require('./contracts/AZTEC/AZTEC');
const AZTECInterface = artifacts.require('./contracts/AZTEC/AZTECInterface');


AZTEC.abi = AZTECInterface.abi;

contract('AZTEC join split tests', (accounts) => {
    let aztecContract;
    describe('success states', () => {
        beforeEach(async () => {
            aztecContract = await AZTEC.new(accounts[0]);
        });

        it('succesfully validates an AZTEC JOIN-SPLIT zero-knowledge proof', async () => {
            const {
                commitments,
                m,
            } = joinSplit.helpers.generateCommitmentSet({
                kIn: [11, 22],
                kOut: [5, 28],
            });

            const {
                proofData,
                challenge,
            } = joinSplit.constructProof(commitments, m, accounts[0], 0);
            const result = await aztecContract.validateJoinSplit(proofData, m, challenge, t2, {
                from: accounts[0],
                gas: 4000000,
            });
            const gasUsed = await aztecContract.validateJoinSplit.estimateGas(proofData, m, challenge, t2, {
                from: accounts[0],
                gas: 4000000,
            });

            console.log('gas used = ', gasUsed);
            expect(result).to.equal(true);
        });

        it('validates proof where kPublic > 0 and kPublic < GROUP_MODULUS/2', async () => {
            const kPublic = 101;
            const {
                commitments,
                m,
            } = await joinSplit.helpers.generateCommitmentSet({
                kIn: [113, 2212],
                kOut: [2222, 2],
            });
            const {
                proofData,
                challenge,
            } = joinSplit.constructProof(commitments, m, accounts[0], kPublic);
            const result = await aztecContract.validateJoinSplit(proofData, m, challenge, t2, {
                from: accounts[0],
                gas: 4000000,
            });
            const gasUsed = await aztecContract.validateJoinSplit.estimateGas(proofData, m, challenge, t2, {
                from: accounts[0],
                gas: 4000000,
            });

            console.log('gas used = ', gasUsed);
            expect(result).to.equal(true);
        });

        it('validates proof where kPublic > GROUP_MODULUS/2', async () => {
            let kPublic = 523;
            kPublic = GROUP_MODULUS.sub(new BN(kPublic));
            const {
                commitments,
                m,
            } = await joinSplit.helpers.generateCommitmentSet({
                kIn: [2513, 800, 100],
                kOut: [3936],
            });
            const {
                proofData,
                challenge,
            } = joinSplit.constructProof(commitments, m, accounts[0], kPublic);
            const result = await aztecContract.validateJoinSplit(proofData, m, challenge, t2, {
                from: accounts[0],
                gas: 4000000,
            });
            const gasUsed = await aztecContract.validateJoinSplit.estimateGas(proofData, m, challenge, t2, {
                from: accounts[0],
                gas: 4000000,
            });
            console.log('gas used = ', gasUsed);
            expect(result).to.equal(true);
        });

        it('validates that large numbers of input/output notes work', async () => {
            const kPublic = 0;
            const {
                commitments,
                m,
            } = await joinSplit.helpers.generateCommitmentSet({
                kIn: [200, 50, 400, 250, 600],
                kOut: [350, 150, 700, 150, 150],
            });
            const {
                proofData,
                challenge,
            } = joinSplit.constructProof(commitments, m, accounts[0], kPublic);
            const result = await aztecContract.validateJoinSplit(proofData, m, challenge, t2, {
                from: accounts[0],
                gas: 4000000,
            });
            const gasUsed = await aztecContract.validateJoinSplit.estimateGas(proofData, m, challenge, t2, {
                from: accounts[0],
                gas: 4000000,
            });

            console.log('gas used = ', gasUsed);
            expect(result).to.equal(true);
        });

        it('validate that zero quantity of input notes works', async () => {
            let kPublic = 33;

            kPublic = GROUP_MODULUS.sub(new BN(kPublic));
            const {
                commitments,
                m,
            } = await joinSplit.helpers.generateCommitmentSet({
                kIn: [],
                kOut: [5, 28],
            });
            const {
                proofData,
                challenge,
            } = joinSplit.constructProof(commitments, m, accounts[0], kPublic);
            const result = await aztecContract.validateJoinSplit(proofData, m, challenge, t2, {
                from: accounts[0],
                gas: 4000000,
            });
            const gasUsed = await aztecContract.validateJoinSplit.estimateGas(proofData, m, challenge, t2, {
                from: accounts[0],
                gas: 4000000,
            });

            console.log('gas used = ', gasUsed);
            expect(result).to.equal(true);
        });

        it('validate that zero quantity of output notes works', async () => {
            const kPublic = 33;

            const {
                commitments,
                m,
            } = await joinSplit.helpers.generateCommitmentSet({
                kIn: [5, 28],
                kOut: [0],
            });
            const {
                proofData,
                challenge,
            } = joinSplit.constructProof(commitments, m, accounts[0], kPublic);
            const result = await aztecContract.validateJoinSplit(proofData, m, challenge, t2, {
                from: accounts[0],
                gas: 4000000,
            });
            const gasUsed = await aztecContract.validateJoinSplit.estimateGas(proofData, m, challenge, t2, {
                from: accounts[0],
                gas: 4000000,
            });

            console.log('gas used = ', gasUsed);
            expect(result).to.equal(true);
        });

        it('validate that notes of zero value work', async () => {
            const kPublic = 0;

            const {
                commitments,
                m,
            } = joinSplit.helpers.generateCommitmentSet({
                kIn: [5, 28, 0],
                kOut: [5, 0, 28],
            });
            const {
                proofData,
                challenge,
            } = joinSplit.constructProof(commitments, m, accounts[0], kPublic);
            const result = await aztecContract.validateJoinSplit(proofData, m, challenge, t2, {
                from: accounts[0],
                gas: 4000000,
            });
            const gasUsed = await aztecContract.validateJoinSplit.estimateGas(proofData, m, challenge, t2, {
                from: accounts[0],
                gas: 4000000,
            });

            console.log('gas used = ', gasUsed);
            expect(result).to.equal(true);
        });

        it('validate that zero quantity of output notes works', async () => {
            const kPublic = 33;

            const {
                commitments,
                m,
            } = joinSplit.helpers.generateCommitmentSet({
                kIn: [5, 28],
                kOut: [],
            });
            const {
                proofData,
                challenge,
            } = joinSplit.constructProof(commitments, m, accounts[0], kPublic);
            const result = await aztecContract.validateJoinSplit(proofData, m, challenge, t2, {
                from: accounts[0],
                gas: 4000000,
            });
            const gasUsed = await aztecContract.validateJoinSplit.estimateGas(proofData, m, challenge, t2, {
                from: accounts[0],
                gas: 4000000,
            });

            console.log('gas used = ', gasUsed);
            expect(result).to.equal(true);
        });
    });

    describe('failure states', () => {
        beforeEach(async () => {
            aztecContract = await AZTEC.new(accounts[0]);
        });

        it('validates failure when using a fake challenge', async () => {
            const {
                commitments,
                m,
            } = joinSplit.helpers.generateCommitmentSet({
                kIn: [11, 22],
                kOut: [5, 28],
            });

            const {
                proofData,
            } = joinSplit.constructProof(commitments, m, accounts[0], 0);
            const fakeChallenge = new BN(crypto.randomBytes(32), 16).umod(GROUP_MODULUS).toString(10);

            exceptions.catchRevert(aztecContract.validateJoinSplit(proofData, m, fakeChallenge, t2, {
                from: accounts[0],
                gas: 4000000,
            }));
        });

        it('validates failure for random proof data', async () => {
            const {
                commitments,
                m,
            } = joinSplit.helpers.generateCommitmentSet({
                kIn: [11, 22],
                kOut: [5, 28],
            });

            const {
                challenge,
            } = joinSplit.constructProof(commitments, m, accounts[0], 0);
            const fakeProofData = [...Array(4)]
                .map(() => [...Array(6)]
                    .map(() => `0x${padLeft(crypto.randomBytes(32).toString('hex'), 64)}`));
            exceptions.catchRevert(aztecContract.validateJoinSplit(fakeProofData, m, challenge, t2, {
                from: accounts[0],
                gas: 4000000,
            }));
        });

        it('validate failure for zero input note value', async () => {
            const {
                commitments,
                m,
            } = joinSplit.helpers.generateCommitmentSet({
                kIn: [0, 0],
                kOut: [5, 28],
            });

            const {
                proofData,
                challenge,
            } = joinSplit.constructProof(commitments, m, accounts[0], 0);

            exceptions.catchRevert(aztecContract.validateJoinSplit(proofData, m, challenge, t2, {
                from: accounts[0],
                gas: 4000000,
            }));
        });

        it('validate failure for zero ouput note value', async () => {
            const {
                commitments,
                m,
            } = joinSplit.helpers.generateCommitmentSet({
                kIn: [11, 22],
                kOut: [0, 0],
            });

            const {
                proofData,
                challenge,
            } = joinSplit.constructProof(commitments, m, accounts[0], 0);

            exceptions.catchRevert(aztecContract.validateJoinSplit(proofData, m, challenge, t2, {
                from: accounts[0],
                gas: 4000000,
            }));
        });

        it('validate failure when using a fake trusted setup key', async () => {
            const {
                commitments,
                m,
            } = joinSplit.helpers.generateFakeCommitmentSet({
                kIn: [11, 22],
                kOut: [5, 28],
            });

            const {
                proofData,
                challenge,
            } = joinSplit.constructProof(commitments, m, accounts[0], 0);

            exceptions.catchRevert(aztecContract.validateJoinSplit(proofData, m, challenge, t2, {
                from: accounts[0],
                gas: 4000000,
            }));
        });

        it('validate failure when points not on curve', async () => {
            const zeroes = `${padLeft('0', 64)}`;
            const noteString = `${zeroes}${zeroes}${zeroes}${zeroes}${zeroes}${zeroes}`;
            const challengeString = `0x${padLeft(accounts[0].slice(2), 64)}${padLeft('132', 64)}${padLeft('1', 64)}${noteString}`;
            const challenge = sha3(challengeString, 'hex');
            const m = 1;
            const proofData = [[`0x${padLeft('132', 64)}`, '0x0', '0x0', '0x0', '0x0', '0x0']];

            await exceptions.catchRevert(aztecContract.validateJoinSplit(proofData, m, challenge, t2, {
                from: accounts[0],
                gas: 4000000,
            }));
        });
    });
});
