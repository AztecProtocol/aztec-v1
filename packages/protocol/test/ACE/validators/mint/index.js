/* global artifacts, expect, contract, beforeEach, it:true */
// ### External Dependencies
const {
    abiEncoder: { outputCoder, inputCoder },
    secp256k1,
    note,
    proof,
} = require('aztec.js');

const { constants: { CRS }, exceptions } = require('@aztec/dev-utils');
const crypto = require('crypto');
const { padLeft, sha3 } = require('web3-utils');

const mintInputEncode = inputCoder.mint;


// ### Artifacts
const Mint = artifacts.require('./contracts/ACE/validators/mint/Mint');
const MintInterface = artifacts.require('./contracts/ACE/validators/mint/Mint/MintInterface');

Mint.abi = MintInterface.abi;

function encodeMintTransaction({
    inputNotes,
    outputNotes,
    senderAddress,
}) {
    const {
        proofData: proofDataRaw,
        challenge,
    } = proof.mint.constructProof([...inputNotes, ...outputNotes], senderAddress);

    const inputOwners = inputNotes.map(m => m.owner);
    const outputOwners = outputNotes.map(n => n.owner);
    const publicOwner = '0x0000000000000000000000000000000000000000';
    const publicValue = 0;

    // const proofDataRawFormatted = [proofDataRaw.slice(0, 6)].concat([proofDataRaw.slice(6, 12), proofDataRaw.slice(12, 18)]);

    const proofData = mintInputEncode(
        proofDataRaw,
        challenge,
        inputOwners,
        outputOwners,
        outputNotes
    );

    const expectedOutput = `0x${outputCoder.encodeProofOutputs([{
        inputNotes,
        outputNotes,
        publicOwner,
        publicValue,
    }]).slice(0x42)}`;
    return { proofData, expectedOutput, challenge };
}

contract('Mint', (accounts) => {
    let mintContract;
    describe('success states', () => {
        let aztecAccounts = [];

        beforeEach(async () => {
            mintContract = await Mint.new({
                from: accounts[0],
            });
            const numNotes = 4;
            aztecAccounts = [...new Array(numNotes)].map(() => secp256k1.generateAccount());
        });

        it.only('validate smart contract verification algo', async () => {
            const noteValues = [50, 30, 10, 10];
            const notes = aztecAccounts.map(({ publicKey }, i) => {
                return note.create(publicKey, noteValues[i]);
            });

            const inputNotes = notes.slice(0, 1);
            const outputNotes = notes.slice(1, 4);

            const { proofData, challenge } = mint.encodeMintTransaction({
                inputNotes,
                outputNotes,
                senderAddress: accounts[0],
            });

            const result = await mintContract.validateMint(proofData, accounts[0], CRS, {
                from: accounts[0],
                gas: 4000000,
            });


            const gasUsed = await mintContract.validateMint.estimateGas(proofData, accounts[0], CRS, {
                from: accounts[0],
                gas: 4000000,
            });
            console.log('gas used = ', gasUsed);

            expect(result).to.equal(challenge);
        });

        it('successfully validates encoding of a mint proof zero-knowledge proof', async () => {
            const noteValues = [50, 30, 10, 10];
            const notes = aztecAccounts.map(({ publicKey }, i) => {
                return note.create(publicKey, noteValues[i]);
            });

            const inputNotes = notes.slice(0, 1);
            const outputNotes = notes.slice(1, 4);

            const inputOwners = inputNotes.map(n => n.owner);

            const { proofData, expectedOutput, challenge } = encodeMintTransaction({
                inputNotes,
                outputNotes,
                senderAddress: accounts[0],
                inputNoteOwners: inputOwners,
                validatorAddress: mintContract.address,
            });

            const result = await mintContract.validateMint(proofData, accounts[0], CRS, {
                from: accounts[0],
                gas: 4000000,
            });
            console.log('result: ', result);

            const decoded = outputCoder.decodeProofOutputs(`0x${padLeft('0', 64)}${result.slice(2)}`);
            console.log('decoded: ', decoded);

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

            expect(decoded[0].publicValue).to.equal(40);
            expect(result).to.equal(expectedOutput);

            const gasUsed = await mintContract.validateMint.estimateGas(proofData, accounts[0], CRS, {
                from: accounts[0],
                gas: 4000000,
            });
            console.log('gas used = ', gasUsed);
        });

        it('validates proof where kPublic > 0 and kPublic < GROUP_MODULUS/2', async () => {
            const inputNotes = notes.slice(2, 5);
            const outputNotes = notes.slice(0, 2);
            const kPublic = 80;
            const publicOwner = aztecAccounts[0].address;
            const { proofData, expectedOutput } = encodeMintTransaction({
                inputNotes,
                outputNotes,
                senderAddress: accounts[0],
                inputNoteOwners: aztecAccounts.slice(2, 5),
                publicOwner,
                kPublic,
                validatorAddress: mintContract.address,
            });

            const result = await mintContract.validateMint(proofData, accounts[0], CRS, {
                from: accounts[0],
                gas: 4000000,
            });

            expect(result).to.equal(expectedOutput);

            const gasUsed = await mintContract.validateMint.estimateGas(proofData, accounts[0], CRS, {
                from: accounts[0],
                gas: 4000000,
            });
            console.log('gas used = ', gasUsed);
        });

        it('validates proof where kPublic > GROUP_MODULUS/2', async () => {
            const inputNotes = notes.slice(0, 2);
            const outputNotes = notes.slice(2, 4);
            const kPublic = -40;
            const publicOwner = aztecAccounts[0].address;
            const senderAddress = accounts[0];
            const { proofData, expectedOutput } = encodeMintTransaction({
                inputNotes,
                outputNotes,
                senderAddress,
                inputNoteOwners: aztecAccounts.slice(0, 2),
                publicOwner,
                kPublic,
                validatorAddress: mintContract.address,
            });

            const result = await mintContract.validateMint(proofData, senderAddress, CRS, {
                from: senderAddress,
                gas: 4000000,
            });
            expect(result).to.equal(expectedOutput);
            const decoded = aztec.abiEncoder.outputCoder.decodeProofOutputs(`0x${padLeft('0', 64)}${result.slice(2)}`);
            expect(decoded[0].publicValue).to.equal(-40);


            const gasUsed = await mintContract.validateMint.estimateGas(proofData, senderAddress, CRS, {
                from: senderAddress,
                gas: 4000000,
            });
            console.log('gas used = ', gasUsed);
        });

        it('validates that large numbers of input/output notes work', async () => {
            const inputNotes = notes.slice(0, 10);
            const outputNotes = notes.slice(10, 20);
            const kPublic = 0;
            const publicOwner = aztecAccounts[0].address;
            const senderAddress = accounts[0];
            const { proofData, expectedOutput } = encodeMintTransaction({
                inputNotes,
                outputNotes,
                senderAddress,
                inputNoteOwners: aztecAccounts.slice(0, 10),
                publicOwner,
                kPublic,
                validatorAddress: mintContract.address,
            });

            const result = await mintContract.validateMint(proofData, senderAddress, CRS, {
                from: senderAddress,
                gas: 4000000,
            });
            expect(result).to.equal(expectedOutput);

            const gasUsed = await mintContract.validateMint.estimateGas(proofData, senderAddress, CRS, {
                from: senderAddress,
                gas: 4000000,
            });

            console.log('gas used = ', gasUsed);
        });

        it('validate that zero quantity of input notes works', async () => {
            const outputNotes = notes.slice(0, 10);
            const kPublic = -450;
            const publicOwner = aztecAccounts[0].address;
            const senderAddress = accounts[0];
            const { proofData, expectedOutput } = encodeMintTransaction({
                inputNotes: [],
                outputNotes,
                senderAddress,
                inputNoteOwners: [],
                publicOwner,
                kPublic,
                validatorAddress: mintContract.address,
            });

            const result = await mintContract.validateMint(proofData, senderAddress, CRS, {
                from: senderAddress,
                gas: 4000000,
            });
            expect(result).to.equal(expectedOutput);

            const gasUsed = await mintContract.validateMint.estimateGas(proofData, senderAddress, CRS, {
                from: senderAddress,
                gas: 4000000,
            });

            console.log('gas used = ', gasUsed);
        });

        it('validate that zero quantity of output notes works', async () => {
            const inputNotes = notes.slice(0, 10);
            const kPublic = 450;
            const publicOwner = aztecAccounts[0].address;
            const senderAddress = accounts[0];
            const { proofData, expectedOutput } = encodeMintTransaction({
                inputNotes,
                outputNotes: [],
                senderAddress,
                inputNoteOwners: aztecAccounts.slice(0, 10),
                publicOwner,
                kPublic,
                validatorAddress: mintContract.address,
            });

            const result = await mintContract.validateMint(proofData, senderAddress, CRS, {
                from: senderAddress,
                gas: 4000000,
            });
            expect(result).to.equal(expectedOutput);

            const gasUsed = await mintContract.validateMint.estimateGas(proofData, senderAddress, CRS, {
                from: senderAddress,
                gas: 4000000,
            });

            console.log('gas used = ', gasUsed);
        });

        it('validate that input notes of zero value work', async () => {
            const inputNotes = [
                aztec.note.create(aztecAccounts[0].publicKey, 0),
                aztec.note.create(aztecAccounts[1].publicKey, 0),
            ];
            const outputNotes = notes.slice(0, 2);
            const kPublic = -10;
            const publicOwner = aztecAccounts[0].address;
            const senderAddress = accounts[0];
            const { proofData, expectedOutput } = encodeMintTransaction({
                inputNotes,
                outputNotes,
                senderAddress,
                inputNoteOwners: aztecAccounts.slice(0, 10),
                publicOwner,
                kPublic,
                validatorAddress: mintContract.address,
            });

            const result = await mintContract.validateMint(proofData, senderAddress, CRS, {
                from: senderAddress,
                gas: 4000000,
            });
            expect(result).to.equal(expectedOutput);

            const gasUsed = await mintContract.validateMint.estimateGas(proofData, senderAddress, CRS, {
                from: senderAddress,
                gas: 4000000,
            });

            console.log('gas used = ', gasUsed);
        });

        it('validate that output notes of zero value work', async () => {
            const inputNotes = notes.slice(0, 2);
            const outputNotes = [
                aztec.note.create(aztecAccounts[0].publicKey, 0),
                aztec.note.create(aztecAccounts[1].publicKey, 0),
            ];
            const kPublic = 10;
            const publicOwner = aztecAccounts[0].address;
            const senderAddress = accounts[0];
            const { proofData, expectedOutput } = encodeMintTransaction({
                inputNotes,
                outputNotes,
                senderAddress,
                inputNoteOwners: aztecAccounts.slice(0, 10),
                publicOwner,
                kPublic,
                validatorAddress: mintContract.address,
            });

            const result = await mintContract.validateMint(proofData, senderAddress, CRS, {
                from: senderAddress,
                gas: 4000000,
            });
            expect(result).to.equal(expectedOutput);

            const gasUsed = await mintContract.validateMint.estimateGas(proofData, senderAddress, CRS, {
                from: senderAddress,
                gas: 4000000,
            });

            console.log('gas used = ', gasUsed);
        });
    });

    describe('failure states', () => {
        let aztecAccounts = [];
        let notes = [];
        beforeEach(async () => {
            mintContract = await Mint.new({
                from: accounts[0],
            });
            aztecAccounts = [...new Array(10)].map(() => aztec.secp256k1.generateAccount());
            notes = [
                ...aztecAccounts.map(({ publicKey }, i) => aztec.note.create(publicKey, i * 10)),
                ...aztecAccounts.map(({ publicKey }, i) => aztec.note.create(publicKey, i * 10)),
            ];
        });

        it('validates failure when using a fake challenge', async () => {
            const inputNotes = notes.slice(0, 2);
            const outputNotes = [
                aztec.note.create(aztecAccounts[0].publicKey, 0),
                aztec.note.create(aztecAccounts[1].publicKey, 0),
            ];
            const kPublic = 10;
            const publicOwner = aztecAccounts[0].address;
            const senderAddress = accounts[0];
            const { proofData } = encodeMintTransaction({
                inputNotes,
                outputNotes,
                senderAddress,
                inputNoteOwners: aztecAccounts.slice(0, 10),
                publicOwner,
                kPublic,
                validatorAddress: mintContract.address,
            });
            const fakeChallenge = padLeft(crypto.randomBytes(32).toString('hex'), 64);

            const fakeProofData = `0x${proofData.slice(0x02, 0x42)}${fakeChallenge}${proofData.slice(0x82)}`;

            exceptions.catchRevert(mintContract.validateMint(fakeProofData, senderAddress, CRS, {
                from: accounts[0],
                gas: 4000000,
            }));
        });

        it('validates failure for random proof data', async () => {
            const inputNotes = notes.slice(0, 2);
            const outputNotes = [
                aztec.note.create(aztecAccounts[0].publicKey, 0),
                aztec.note.create(aztecAccounts[1].publicKey, 0),
            ];
            const kPublic = 10;
            const publicOwner = aztecAccounts[0].address;
            const senderAddress = accounts[0];
            const m = inputNotes.length;
            const {
                proofData: proofDataRaw,
                challenge,
            } = aztec.proof.mint.constructMintModified(
                [...inputNotes, ...outputNotes], m, senderAddress, kPublic, publicOwner
            );

            const inputSignatures = inputNotes.map((inputNote, index) => {
                const { privateKey } = aztecAccounts[index];
                return aztec.sign.signACENote(
                    proofDataRaw[index],
                    challenge,
                    senderAddress,
                    mintContract.address,
                    privateKey
                );
            });
            const outputOwners = outputNotes.map(n => n.owner);
            const fakeProofData = [...Array(4)]
                .map(() => [...Array(6)]
                    .map(() => `0x${padLeft(crypto.randomBytes(32).toString('hex'), 64)}`));

            const proofData = mintInputEncode(
                fakeProofData,
                m,
                challenge,
                publicOwner,
                inputSignatures,
                outputOwners,
                outputNotes
            );

            exceptions.catchRevert(mintContract.validateMint(proofData, senderAddress, CRS, {
                from: accounts[0],
                gas: 4000000,
            }));
        });

        it('validate failure for zero input note value', async () => {
            const inputNotes = [
                aztec.note.create(aztecAccounts[0].publicKey, 0),
                aztec.note.create(aztecAccounts[1].publicKey, 0),
            ];
            const outputNotes = notes.slice(0, 2);
            const kPublic = 0;
            const publicOwner = aztecAccounts[0].address;
            const senderAddress = accounts[0];
            const m = inputNotes.length;
            const {
                proofData: proofDataRaw,
                challenge,
            } = aztec.proof.mint.constructMintModified(
                [...inputNotes, ...outputNotes], m, senderAddress, kPublic, publicOwner
            );

            const inputSignatures = inputNotes.map((inputNote, index) => {
                const { privateKey } = aztecAccounts[index];
                return aztec.sign.signACENote(
                    proofDataRaw[index],
                    challenge,
                    senderAddress,
                    mintContract.address,
                    privateKey
                );
            });
            const outputOwners = outputNotes.map(n => n.owner);

            const proofData = mintInputEncode(
                proofDataRaw,
                m,
                challenge,
                publicOwner,
                inputSignatures,
                outputOwners,
                outputNotes
            );

            exceptions.catchRevert(mintContract.validateMint(proofData, senderAddress, CRS, {
                from: accounts[0],
                gas: 4000000,
            }));
        });

        it('validate failure for zero ouput note value', async () => {
            const inputNotes = notes.slice(0, 2);
            const outputNotes = [
                aztec.note.create(aztecAccounts[0].publicKey, 0),
                aztec.note.create(aztecAccounts[1].publicKey, 0),
            ];
            const kPublic = 0;
            const publicOwner = aztecAccounts[0].address;
            const senderAddress = accounts[0];
            const m = inputNotes.length;
            const {
                proofData: proofDataRaw,
                challenge,
            } = aztec.proof.mint.constructMintModified(
                [...inputNotes, ...outputNotes], m, senderAddress, kPublic, publicOwner
            );

            const inputSignatures = inputNotes.map((inputNote, index) => {
                const { privateKey } = aztecAccounts[index];
                return aztec.sign.signACENote(
                    proofDataRaw[index],
                    challenge,
                    senderAddress,
                    mintContract.address,
                    privateKey
                );
            });
            const outputOwners = outputNotes.map(n => n.owner);
            const proofData = mintInputEncode(
                proofDataRaw,
                m,
                challenge,
                publicOwner,
                inputSignatures,
                outputOwners,
                outputNotes
            );

            exceptions.catchRevert(mintContract.validateMint(proofData, senderAddress, CRS, {
                from: accounts[0],
                gas: 4000000,
            }));
        });

        it('validate failure when using a fake trusted setup key', async () => {
            const {
                commitments,
                m,
            } = aztec.proof.mint.helpers.generateFakeCommitmentSet({
                kIn: [11, 22],
                kOut: [5, 28],
            });
            const publicOwner = aztecAccounts[0].address;
            const senderAddress = accounts[0];

            const {
                proofData: proofDataRaw,
                challenge,
            } = aztec.proof.mint.constructMintModified(commitments, m, accounts[0], 0, publicOwner);

            const inputSignatures = commitments.slice(0, 2).map((inputNote, index) => {
                const { privateKey } = aztecAccounts[index];
                return aztec.sign.signACENote(
                    proofDataRaw[index],
                    challenge,
                    senderAddress,
                    mintContract.address,
                    privateKey
                );
            });
            const outputOwners = aztecAccounts.slice(2, 4).map(a => a.address);
            const proofData = mintInputEncode(
                proofDataRaw,
                m,
                challenge,
                publicOwner,
                inputSignatures,
                outputOwners,
                notes.slice(0, 2)
            );

            exceptions.catchRevert(mintContract.validateMint(proofData, senderAddress, CRS, {
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
                    mintContract.address,
                    aztecAccounts[0].privateKey
                ),
            ];
            const outputOwners = [];
            const publicOwner = aztecAccounts[0].address;
            const proofData = mintInputEncode(
                proofDataRaw,
                m,
                challenge,
                publicOwner,
                inputSignatures,
                outputOwners,
                []
            );
            await exceptions.catchRevert(mintContract.validateMint(proofData, senderAddress, CRS, {
                from: senderAddress,
                gas: 4000000,
            }));
        });
    });
});
