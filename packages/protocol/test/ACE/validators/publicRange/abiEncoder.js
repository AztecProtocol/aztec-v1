/* global artifacts, expect, contract, beforeEach, it:true */
// ### External Dependencies
const {
    constants: { CRS },
} = require('@aztec/dev-utils');
const { padLeft } = require('web3-utils');

// ### Internal Dependencies
const { constants } = require('@aztec/dev-utils');

const {
    abiEncoder: { inputCoder, outputCoder },
    secp256k1,
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
            const noteValues = [10, 0];
            const kPublic = 10;
            const numNotes = noteValues.length;
            const aztecAccounts = [...new Array(numNotes)].map(() => secp256k1.generateAccount());
            const notes = aztecAccounts.map(({ publicKey }, i) => {
                return note.create(publicKey, noteValues[i]);
            });

            const inputNotes = notes.slice(0, 1);
            const outputNotes = notes.slice(1, 2);
            const senderAddress = accounts[0];

            const { proofData: proofDataRaw, challenge } = publicRange.constructProof(
                [...inputNotes, ...outputNotes],
                kPublic,
                senderAddress,
            );

            const inputOwners = inputNotes.map((m) => m.owner);
            const outputOwners = outputNotes.map((n) => n.owner);

            const proofData = inputCoder.publicRange(proofDataRaw, challenge, kPublic, inputOwners, outputOwners, outputNotes);

            const publicValue = kPublic;
            const publicOwner = constants.addresses.ZERO_ADDRESS;

            const result = await publicRangeAbiEncoder.validatePublicRange(proofData, senderAddress, CRS, {
                from: accounts[0],
                gas: 4000000,
            });

            const expected = outputCoder.encodeProofOutputs([
                {
                    inputNotes,
                    outputNotes,
                    publicOwner,
                    publicValue,
                    challenge,
                },
            ]);

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
            expect(decoded[0].publicValue).to.equal(kPublic);
            expect(decoded[0].challenge).to.equal(challenge);
            expect(result.slice(2)).to.equal(expected.slice(0x42));
            expect(result.slice(2).length / 2).to.equal(parseInt(expected.slice(0x02, 0x42), 16));
        });
    });
});
