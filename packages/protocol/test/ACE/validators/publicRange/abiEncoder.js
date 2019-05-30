/* global artifacts, expect, contract, beforeEach, it:true */
// ### External Dependencies
const { padLeft } = require('web3-utils');
const {
    constants: { CRS },
} = require('@aztec/dev-utils');
const secp256k1 = require('@aztec/secp256k1');

// ### Internal Dependencies
const { constants } = require('@aztec/dev-utils');

const {
    abiEncoder: { inputCoder, outputCoder },
    note,
    proof: { publicRange },
} = require('aztec.js');

// ### Artifacts
const ABIEncoder = artifacts.require('./PublicRangeABIEncoderTest');

contract('Public range ABI encoder', (accounts) => {
    let publicRangeAbiEncoder;

    describe('Success States', () => {
        beforeEach(async () => {
            publicRangeAbiEncoder = await ABIEncoder.new({
                from: accounts[0],
            });
        });

        it('should encode output of a public range proof', async () => {
            const originalNoteValue = 10;
            const utilityNoteValue = 0;
            const publicComparison = 10;
            const numNotes = 2;

            const aztecAccounts = [...new Array(numNotes)].map(() => secp256k1.generateAccount());
            const originalNote = await note.create(aztecAccounts[0].publicKey, originalNoteValue);
            const utilityNote = await note.create(aztecAccounts[1].publicKey, utilityNoteValue);
            const senderAddress = accounts[0];
            const notes = [originalNote, utilityNote];

            const { proofData: proofDataRaw, challenge } = publicRange.constructProof(notes, publicComparison, senderAddress);

            const inputNotes = [originalNote];
            const inputOwners = [originalNote.owner];
            const outputNotes = [utilityNote];
            const outputOwners = [utilityNote.owner];

            const proofData = inputCoder.publicRange(
                proofDataRaw,
                challenge,
                publicComparison,
                inputOwners,
                outputOwners,
                outputNotes,
            );

            const publicOwner = constants.addresses.ZERO_ADDRESS;
            const publicValue = 0;

            const expectedOutput = `0x${outputCoder
                .encodeProofOutputs([
                    {
                        inputNotes,
                        outputNotes,
                        publicOwner,
                        publicValue,
                        challenge,
                    },
                ])
                .slice(0x42)}`;

            const result = await publicRangeAbiEncoder.validatePublicRange(proofData, senderAddress, CRS, {
                from: accounts[0],
                gas: 4000000,
            });

            const decoded = outputCoder.decodeProofOutputs(`0x${padLeft('0', 64)}${result.slice(2)}`);

            expect(decoded[0].outputNotes[0].gamma.eq(outputNotes[0].gamma)).to.equal(true);
            expect(decoded[0].outputNotes[0].sigma.eq(outputNotes[0].sigma)).to.equal(true);
            expect(decoded[0].outputNotes[0].noteHash).to.equal(outputNotes[0].noteHash);
            expect(decoded[0].outputNotes[0].owner).to.equal(outputNotes[0].owner.toLowerCase());
            expect(decoded[0].outputNotes[1]).to.equal(undefined);

            expect(decoded[0].inputNotes[0].gamma.eq(inputNotes[0].gamma)).to.equal(true);
            expect(decoded[0].inputNotes[0].sigma.eq(inputNotes[0].sigma)).to.equal(true);
            expect(decoded[0].inputNotes[0].noteHash).to.equal(inputNotes[0].noteHash);
            expect(decoded[0].inputNotes[0].owner).to.equal(inputNotes[0].owner.toLowerCase());

            expect(decoded[0].inputNotes[1]).to.equal(undefined);

            expect(decoded[0].publicOwner).to.equal(publicOwner.toLowerCase());
            expect(decoded[0].publicValue).to.equal(publicValue);
            expect(decoded[0].challenge).to.equal(challenge);
            expect(result).to.equal(expectedOutput);
        });
    });
});
