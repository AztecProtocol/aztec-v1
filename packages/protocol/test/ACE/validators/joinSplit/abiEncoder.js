/* global artifacts, expect, contract, beforeEach, it:true */
// ### External Dependencies
const { padLeft } = require('web3-utils');

// ### Internal Dependencies
const { abiEncoder, note, proof, signer } = require('aztec.js');
const devUtils = require('@aztec/dev-utils');
const secp256k1 = require('@aztec/secp256k1');

const { constants, proofs } = devUtils;
const { CRS, K_MAX } = constants;
const { outputCoder, inputCoder } = abiEncoder;

// ### Artifacts
const ABIEncoder = artifacts.require('./JoinSplitABIEncoderTest');

function randomNoteValue() {
    return Math.floor(Math.random() * Math.floor(K_MAX));
}

contract('Join-Split ABI Encoder', (accounts) => {
    let joinSplitAbiEncoder;
    let aztecAccounts = [];
    let notes = [];

    // Creating a collection of tests that should pass
    describe('Success States', () => {
        beforeEach(async () => {
            aztecAccounts = [...new Array(10)].map(() => secp256k1.generateAccount());

            notes = await Promise.all(
                aztecAccounts.map(({ publicKey }) => {
                    return note.create(publicKey, randomNoteValue());
                }),
            );

            joinSplitAbiEncoder = await ABIEncoder.new({
                from: accounts[0],
            });
        });

        it('should encode output of a join-split proof', async () => {
            const m = 2;
            const inputNotes = notes.slice(0, 2);
            const outputNotes = notes.slice(2, 4);
            const senderAddress = accounts[0];

            const { proofData, challenge } = proof.joinSplit.constructProof([...inputNotes, ...outputNotes], m, accounts[0], 0);
            const inputSignatures = inputNotes.map((inputNote, index) => {
                const domain = signer.generateAZTECDomainParams(joinSplitAbiEncoder.address, constants.eip712.ACE_DOMAIN_PARAMS);
                const schema = constants.eip712.JOIN_SPLIT_SIGNATURE;
                const message = {
                    proof: proofs.JOIN_SPLIT_PROOF,
                    noteHash: inputNote.noteHash,
                    challenge,
                    sender: senderAddress,
                };
                const { privateKey } = aztecAccounts[index];
                const { signature } = signer.signTypedData(domain, schema, message, privateKey);
                return signature;
            });
            const publicOwner = aztecAccounts[0].address;

            const outputOwners = outputNotes.map((n) => n.owner);
            const inputOwners = inputNotes.map((n) => n.owner);

            const data = inputCoder.joinSplit(
                proofData,
                m,
                challenge,
                publicOwner,
                inputSignatures,
                inputOwners,
                outputOwners,
                outputNotes,
            );

            const result = await joinSplitAbiEncoder.validateJoinSplit(data, senderAddress, CRS, {
                from: accounts[0],
                gas: 4000000,
            });

            const expected = outputCoder.encodeProofOutputs([
                {
                    inputNotes,
                    outputNotes,
                    publicOwner,
                    publicValue: 0,
                    challenge,
                },
            ]);
            const decoded = outputCoder.decodeProofOutputs(`0x${padLeft('0', 64)}${result.slice(2)}`);
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

            expect(decoded[0].publicOwner).to.equal(publicOwner.toLowerCase());
            expect(decoded[0].publicValue).to.equal(0);
            expect(decoded[0].challenge).to.equal(challenge);
            expect(result.slice(2)).to.equal(expected.slice(0x42));
            expect(result.slice(2).length / 2).to.equal(parseInt(expected.slice(0x02, 0x42), 16));
        });
    });
});
