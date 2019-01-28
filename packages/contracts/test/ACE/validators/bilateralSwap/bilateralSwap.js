/* global artifacts, expect, contract, beforeEach, it:true */
// ### External Dependencies
const BN = require('bn.js');
const crypto = require('crypto');
const { padLeft, sha3 } = require('web3-utils');

// ### Internal Dependencies
const aztec = require('aztec.js');
const { params: { t2 } } = require('aztec.js');
const { proof: { bilateralSwap } } = require('aztec.js');

const exceptions = require('../../../../utils/exceptions');

// ### Artifacts
const BilateralSwap = artifacts.require('./contracts/ACE/validators/AZTECBilateralSwap');
const BilateralSwapInterface = artifacts.require('./contracts/ACE/validators/AZTECBilateralSwapInterface');


BilateralSwap.abi = BilateralSwapInterface.abi;

const fakeNetworkId = 100;

function encodeBilateralSwapTransaction({
    inputNotes,
    outputNotes,
    senderAddress,
}) {
    const {
        proofData: proofDataRaw,
        challenge,
    } = bilateralSwap.constructBilateralSwap([...inputNotes, ...outputNotes], senderAddress);

    const outputOwners = outputNotes.map(n => n.owner);
    const proofData = aztec.abiEncoder.bilateralSwap.encode(
        proofDataRaw,
        challenge,
        outputOwners,
        outputNotes
    );

    const publicOwner = '0x00';
    const publicValue = new BN(0);

    const expectedOutput = `0x${aztec.abiEncoder.bilateralSwap.outputCoder.encodeProofOutputs([{
        inputNotes,
        outputNotes,
        publicOwner,
        publicValue,
    }]).slice(0x42)}`;
    return { proofData, expectedOutput };
}

contract('Bilateral Swap', (accounts) => {
    let bilateralSwapContract;
    // Creating a collection of tests that should pass
    describe('success states', () => {
        let crs;
        let bilateralSwapAccounts = [];
        let notes = [];

        beforeEach(async () => {
            bilateralSwapContract = await BilateralSwap.new(fakeNetworkId, {
                from: accounts[0],
            });
            // Need to set the value of the notes created, to be consistent with the 
            // bilateral swap condition

            const noteValues = [10, 20, 10, 20];

            bilateralSwapAccounts = [...new Array(4)].map(() => aztec.secp256k1.generateAccount());
            notes = [
                ...bilateralSwapAccounts.map(({ publicKey }, i) => aztec.note.create(publicKey, noteValues[i])),
            ];

            const hx = new BN('7673901602397024137095011250362199966051872585513276903826533215767972925880', 10);
            const hy = new BN('8489654445897228341090914135473290831551238522473825886865492707826370766375', 10);
            crs = [
                `0x${padLeft(hx.toString(16), 64)}`,
                `0x${padLeft(hy.toString(16), 64)}`,
                ...t2,
            ];
        });

        it('validate that the input ABI encoding has worked correctly and that the contract can validate proof', async () => {
            const inputNotes = notes.slice(0, 2);
            const outputNotes = notes.slice(2, 4);

            const { proofData } = encodeBilateralSwapTransaction({
                inputNotes,
                outputNotes,
                senderAddress: accounts[0],
            });

            const result = await bilateralSwapContract.validateBilateralSwap(proofData, accounts[0], crs, {
                from: accounts[0],
                gas: 4000000,
            });

            const gasUsed = await bilateralSwapContract.validateBilateralSwap.estimateGas(proofData, accounts[0], crs, {
                from: accounts[0],
                gas: 4000000,
            });

            console.log('gas used = ', gasUsed);
            expect(result).to.equal(true);
        });

        it('succesfully validate output encoding for bilateral proof in zero-knowledge', async () => {
            const inputNotes = notes.slice(0, 2);
            const outputNotes = notes.slice(2, 4);
            const { proofData, expectedOutput } = encodeBilateralSwapTransaction({
                inputNotes,
                outputNotes,
                senderAddress: accounts[0],
            });

            const result = await bilateralSwapContract.validateBilateralSwap(proofData, accounts[0], crs, {
                from: accounts[0],
                gas: 4000000,
            });
            const decoded = aztec.abiEncoder.bilateralSwap.outputCoder.decodeProofOutputs(`0x${padLeft('0', 64)}${result.slice(2)}`);
            expect(decoded[0].outputNotes[0].gamma.eq(outputNotes[0].gamma)).to.equal(true);
            expect(decoded[0].outputNotes[0].sigma.eq(outputNotes[0].sigma)).to.equal(true);
            expect(decoded[0].outputNotes[0].noteHash).to.equal(outputNotes[0].noteHash);
            expect(decoded[0].outputNotes[0].owner).to.equal(outputNotes[0].owner.toLowerCase());
            expect(decoded[0].outputNotes[1].gamma.eq(outputNotes[1].gamma)).to.equal(true);
            expect(decoded[0].outputNotes[1].sigma.eq(outputNotes[1].sigma)).to.equal(true);
            expect(decoded[0].outputNotes[1].noteHash).to.equal(outputNotes[1].noteHash);
            expect(decoded[0].outputNotes[1].owner).to.equal(outputNotes[1].owner.toLowerCase());

            expect(decoded[0].inputNotes[0].gamma.eq(inputNotes[0].gamma)).to.equal(true);
            expect(decoded[0].inputNotes[0].sigma.eq(inputNotes[0].sigma)).to.equal(true);
            expect(decoded[0].inputNotes[0].noteHash).to.equal(inputNotes[0].noteHash);
            expect(decoded[0].inputNotes[0].owner).to.equal(inputNotes[0].owner.toLowerCase());
            expect(decoded[0].inputNotes[1].gamma.eq(inputNotes[1].gamma)).to.equal(true);
            expect(decoded[0].inputNotes[1].sigma.eq(inputNotes[1].sigma)).to.equal(true);
            expect(decoded[0].inputNotes[1].noteHash).to.equal(inputNotes[1].noteHash);
            expect(decoded[0].inputNotes[1].owner).to.equal(inputNotes[1].owner.toLowerCase());

            expect(result).to.equal(expectedOutput);

            const gasUsed = await bilateralSwapContract.validateBilateralSwap.estimateGas(proofData, accounts[0], crs, {
                from: accounts[0],
                gas: 4000000,
            });
            console.log('gas used = ', gasUsed);
        });

        it('validate that zero quantity of input notes works', async () => {
            const outputNotes = notes.slice(0, 10);
            const kPublic = -450;
            const publicOwner = bilateralSwapAccounts[0].address;
            const senderAddress = accounts[0];
            const { proofData, expectedOutput } = encodeBilateralSwapTransaction({
                inputNotes: [],
                outputNotes,
                senderAddress,
                inputNoteOwners: [],
                publicOwner,
                kPublic,
                bilateralSwapAddress: bilateralSwapContract.address,
            });

            const result = await bilateralSwapContract.validateBilateralSwap(proofData, senderAddress, crs, {
                from: senderAddress,
                gas: 4000000,
            });
            expect(result).to.equal(expectedOutput);

            const gasUsed = await bilateralSwapContract.validateBilateralSwap.estimateGas(proofData, senderAddress, crs, {
                from: senderAddress,
                gas: 4000000,
            });

            console.log('gas used = ', gasUsed);
        });

        it('validate that zero quantity of output notes works', async () => {
            const inputNotes = notes.slice(0, 10);
            const kPublic = 450;
            const publicOwner = bilateralSwapAccounts[0].address;
            const senderAddress = accounts[0];
            const { proofData, expectedOutput } = encodeBilateralSwapTransaction({
                inputNotes,
                outputNotes: [],
                senderAddress,
                inputNoteOwners: bilateralSwapAccounts.slice(0, 10),
                publicOwner,
                kPublic,
                bilateralSwapAddress: bilateralSwapContract.address,
            });

            const result = await bilateralSwapContract.validateBilateralSwap(proofData, senderAddress, crs, {
                from: senderAddress,
                gas: 4000000,
            });
            expect(result).to.equal(expectedOutput);

            const gasUsed = await bilateralSwapContract.validateBilateralSwap.estimateGas(proofData, senderAddress, crs, {
                from: senderAddress,
                gas: 4000000,
            });

            console.log('gas used = ', gasUsed);
        });

        it('validate that input notes of zero value work', async () => {
            const inputNotes = [
                aztec.note.create(bilateralSwapAccounts[0].publicKey, 0),
                aztec.note.create(bilateralSwapAccounts[1].publicKey, 0),
            ];
            const outputNotes = notes.slice(0, 2);
            const kPublic = -10;
            const publicOwner = bilateralSwapAccounts[0].address;
            const senderAddress = accounts[0];
            const { proofData, expectedOutput } = encodeBilateralSwapTransaction({
                inputNotes,
                outputNotes,
                senderAddress,
                inputNoteOwners: bilateralSwapAccounts.slice(0, 10),
                publicOwner,
                kPublic,
                bilateralSwapAddress: bilateralSwapContract.address,
            });

            const result = await bilateralSwapContract.validateBilateralSwap(proofData, senderAddress, crs, {
                from: senderAddress,
                gas: 4000000,
            });
            expect(result).to.equal(expectedOutput);

            const gasUsed = await bilateralSwapContract.validateBilateralSwap.estimateGas(proofData, senderAddress, crs, {
                from: senderAddress,
                gas: 4000000,
            });

            console.log('gas used = ', gasUsed);
        });

        it('validate that output notes of zero value work', async () => {
            const inputNotes = notes.slice(0, 2);
            const outputNotes = [
                aztec.note.create(bilateralSwapAccounts[0].publicKey, 0),
                aztec.note.create(bilateralSwapAccounts[1].publicKey, 0),
            ];
            const kPublic = 10;
            const publicOwner = bilateralSwapAccounts[0].address;
            const senderAddress = accounts[0];
            const { proofData, expectedOutput } = encodeBilateralSwapTransaction({
                inputNotes,
                outputNotes,
                senderAddress,
                inputNoteOwners: bilateralSwapAccounts.slice(0, 10),
                publicOwner,
                kPublic,
                bilateralSwapAddress: bilateralSwapContract.address,
            });

            const result = await bilateralSwapContract.validateBilateralSwap(proofData, senderAddress, crs, {
                from: senderAddress,
                gas: 4000000,
            });
            expect(result).to.equal(expectedOutput);

            const gasUsed = await bilateralSwapContract.validateBilateralSwap.estimateGas(proofData, senderAddress, crs, {
                from: senderAddress,
                gas: 4000000,
            });

            console.log('gas used = ', gasUsed);
        });
    });

    describe('failure states', () => {
        let crs;
        let bilateralSwapAccounts = [];
        let notes = [];
        beforeEach(async () => {
            bilateralSwapContract = await BilateralSwap.new(fakeNetworkId, {
                from: accounts[0],
            });
            bilateralSwapAccounts = [...new Array(10)].map(() => aztec.secp256k1.generateAccount());
            notes = [
                ...bilateralSwapAccounts.map(({ publicKey }, i) => aztec.note.create(publicKey, i * 10)),
                ...bilateralSwapAccounts.map(({ publicKey }, i) => aztec.note.create(publicKey, i * 10)),
            ];
            const hx = new BN('7673901602397024137095011250362199966051872585513276903826533215767972925880', 10);
            const hy = new BN('8489654445897228341090914135473290831551238522473825886865492707826370766375', 10);
            crs = [
                `0x${padLeft(hx.toString(16), 64)}`,
                `0x${padLeft(hy.toString(16), 64)}`,
                ...t2,
            ];
        });

        it('validates failure when using a fake challenge', async () => {
            const inputNotes = notes.slice(0, 2);
            const outputNotes = [
                aztec.note.create(bilateralSwapAccounts[0].publicKey, 0),
                aztec.note.create(bilateralSwapAccounts[1].publicKey, 0),
            ];
            const kPublic = 10;
            const publicOwner = bilateralSwapAccounts[0].address;
            const senderAddress = accounts[0];
            const { proofData } = encodeBilateralSwapTransaction({
                inputNotes,
                outputNotes,
                senderAddress,
                inputNoteOwners: bilateralSwapAccounts.slice(0, 10),
                publicOwner,
                kPublic,
                bilateralSwapAddress: bilateralSwapContract.address,
            });
            const fakeChallenge = padLeft(crypto.randomBytes(32).toString('hex'), 64);

            const fakeProofData = `0x${proofData.slice(0x02, 0x42)}${fakeChallenge}${proofData.slice(0x82)}`;

            exceptions.catchRevert(bilateralSwapContract.validateBilateralSwap(fakeProofData, senderAddress, crs, {
                from: accounts[0],
                gas: 4000000,
            }));
        });

        it('validates failure for random proof data', async () => {
            const inputNotes = notes.slice(0, 2);
            const outputNotes = [
                aztec.note.create(bilateralSwapAccounts[0].publicKey, 0),
                aztec.note.create(bilateralSwapAccounts[1].publicKey, 0),
            ];
            const kPublic = 10;
            const publicOwner = bilateralSwapAccounts[0].address;
            const senderAddress = accounts[0];
            const m = inputNotes.length;
            const {
                proofData: proofDataRaw,
                challenge,
            } = bilateralSwap.constructBilateralSwap([...inputNotes, ...outputNotes], m, senderAddress, kPublic, publicOwner);

            const inputSignatures = inputNotes.map((inputNote, index) => {
                const { privateKey } = bilateralSwapAccounts[index];
                return aztec.sign.signACENote(
                    proofDataRaw[index],
                    challenge,
                    senderAddress,
                    bilateralSwapContract.address,
                    privateKey,
                    fakeNetworkId
                );
            });
            const outputOwners = outputNotes.map(n => n.owner);
            const fakeProofData = [...Array(4)]
                .map(() => [...Array(6)]
                    .map(() => `0x${padLeft(crypto.randomBytes(32).toString('hex'), 64)}`));

            const proofData = aztec.abiEncoder.bilateralSwap.encode(
                fakeProofData,
                m,
                challenge,
                publicOwner,
                inputSignatures,
                outputOwners,
                outputNotes
            );

            exceptions.catchRevert(bilateralSwapContract.validateBilateralSwap(proofData, senderAddress, crs, {
                from: accounts[0],
                gas: 4000000,
            }));
        });

        it('validate failure for zero input note value', async () => {
            const inputNotes = [
                aztec.note.create(bilateralSwapAccounts[0].publicKey, 0),
                aztec.note.create(bilateralSwapAccounts[1].publicKey, 0),
            ];
            const outputNotes = notes.slice(0, 2);
            const kPublic = 0;
            const publicOwner = bilateralSwapAccounts[0].address;
            const senderAddress = accounts[0];
            const m = inputNotes.length;
            const {
                proofData: proofDataRaw,
                challenge,
            } = bilateralSwap.constructBilateralSwap([...inputNotes, ...outputNotes], m, senderAddress, kPublic, publicOwner);

            const inputSignatures = inputNotes.map((inputNote, index) => {
                const { privateKey } = bilateralSwapAccounts[index];
                return aztec.sign.signACENote(
                    proofDataRaw[index],
                    challenge,
                    senderAddress,
                    bilateralSwapContract.address,
                    privateKey,
                    fakeNetworkId
                );
            });
            const outputOwners = outputNotes.map(n => n.owner);

            const proofData = aztec.abiEncoder.bilateralSwap.encode(
                proofDataRaw,
                m,
                challenge,
                publicOwner,
                inputSignatures,
                outputOwners,
                outputNotes
            );

            exceptions.catchRevert(bilateralSwapContract.validateBilateralSwap(proofData, senderAddress, crs, {
                from: accounts[0],
                gas: 4000000,
            }));
        });

        it('validate failure for zero ouput note value', async () => {
            const inputNotes = notes.slice(0, 2);
            const outputNotes = [
                aztec.note.create(bilateralSwapAccounts[0].publicKey, 0),
                aztec.note.create(bilateralSwapAccounts[1].publicKey, 0),
            ];
            const kPublic = 0;
            const publicOwner = bilateralSwapAccounts[0].address;
            const senderAddress = accounts[0];
            const m = inputNotes.length;
            const {
                proofData: proofDataRaw,
                challenge,
            } = bilateralSwap.constructBilateralSwap([...inputNotes, ...outputNotes], m, senderAddress, kPublic, publicOwner);

            const inputSignatures = inputNotes.map((inputNote, index) => {
                const { privateKey } = bilateralSwapAccounts[index];
                return aztec.sign.signACENote(
                    proofDataRaw[index],
                    challenge,
                    senderAddress,
                    bilateralSwapContract.address,
                    privateKey,
                    fakeNetworkId
                );
            });
            const outputOwners = outputNotes.map(n => n.owner);
            const proofData = aztec.abiEncoder.bilateralSwap.encode(
                proofDataRaw,
                m,
                challenge,
                publicOwner,
                inputSignatures,
                outputOwners,
                outputNotes
            );

            exceptions.catchRevert(bilateralSwapContract.validateBilateralSwap(proofData, senderAddress, crs, {
                from: accounts[0],
                gas: 4000000,
            }));
        });

        it('validate failure when using a fake trusted setup key', async () => {
            const {
                commitments,
                m,
            } = bilateralSwap.helpers.generateFakeCommitmentSet({
                kIn: [11, 22],
                kOut: [5, 28],
            });
            const publicOwner = bilateralSwapAccounts[0].address;
            const senderAddress = accounts[0];

            const {
                proofData: proofDataRaw,
                challenge,
            } = bilateralSwap.constructBilateralSwap(commitments, m, accounts[0], 0, publicOwner);

            const inputSignatures = commitments.slice(0, 2).map((inputNote, index) => {
                const { privateKey } = bilateralSwapAccounts[index];
                return aztec.sign.signACENote(
                    proofDataRaw[index],
                    challenge,
                    senderAddress,
                    bilateralSwapContract.address,
                    privateKey,
                    fakeNetworkId
                );
            });
            const outputOwners = bilateralSwapAccounts.slice(2, 4).map(a => a.address);
            const proofData = aztec.abiEncoder.bilateralSwap.encode(
                proofDataRaw,
                m,
                challenge,
                publicOwner,
                inputSignatures,
                outputOwners,
                notes.slice(0, 2)
            );

            exceptions.catchRevert(bilateralSwapContract.validateBilateralSwap(proofData, senderAddress, crs, {
                from: senderAddress,
                gas: 4000000,
            }));
        });

        it('validate failure when points not on curve', async () => {
            const zeroes = `${padLeft('0', 64)}`;
            const noteString = `${zeroes}${zeroes}${zeroes}${zeroes}${zeroes}${zeroes}`;
            const challengeString = `0x${padLeft(accounts[0].slice(2), 64)}${padLeft('132', 64)}${padLeft('1', 64)}${noteString}`;
            const challenge = sha3(challengeString, 'hex');
            const m = 1;
            const proofDataRaw = [[`0x${padLeft('132', 64)}`, '0x0', '0x0', '0x0', '0x0', '0x0']];
            const senderAddress = accounts[0];
            const inputSignatures = [
                aztec.sign.signACENote(
                    proofDataRaw[0],
                    challenge,
                    senderAddress,
                    bilateralSwapContract.address,
                    bilateralSwapAccounts[0].privateKey,
                    fakeNetworkId
                ),
            ];
            const outputOwners = [];
            const publicOwner = bilateralSwapAccounts[0].address;
            const proofData = aztec.abiEncoder.bilateralSwap.encode(
                proofDataRaw,
                m,
                challenge,
                publicOwner,
                inputSignatures,
                outputOwners,
                []
            );
            await exceptions.catchRevert(bilateralSwapContract.validateBilateralSwap(proofData, senderAddress, crs, {
                from: senderAddress,
                gas: 4000000,
            }));
        });
    });
});
