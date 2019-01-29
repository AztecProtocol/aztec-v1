/* global artifacts, expect, contract, beforeEach, it:true */
// ### External Dependencies
const BN = require('bn.js');
const { padLeft } = require('web3-utils');

// ### Internal Dependencies
const aztec = require('aztec.js');
const { params: { t2, K_MAX } } = require('aztec.js');

// ### Artifacts
const ABIEncoder = artifacts.require('./contracts/ACE/validators/AZTECJoinSplit/JoinSplitABIEncoderTest');


function randomNoteValue() {
    return Math.floor(Math.random() * Math.floor(K_MAX));
}

const fakeNetworkId = 100;
contract('JoinSplit ABI Encoder', (accounts) => {
    let aztecAbiEncoder;
    let aztecAccounts = [];
    let notes = [];

    // Creating a collection of tests that should pass
    describe('success states', () => {
        let crs;
        beforeEach(async () => {
            aztecAccounts = [...new Array(10)].map(() => aztec.secp256k1.generateAccount());
            notes = aztecAccounts.map(({ publicKey }) => {
                return aztec.note.create(publicKey, randomNoteValue());
            });

            aztecAbiEncoder = await ABIEncoder.new(fakeNetworkId, {
                from: accounts[0],
            });
            const hx = new BN('7673901602397024137095011250362199966051872585513276903826533215767972925880', 10);
            const hy = new BN('8489654445897228341090914135473290831551238522473825886865492707826370766375', 10);
            crs = [
                `0x${padLeft(hx.toString(16), 64)}`,
                `0x${padLeft(hy.toString(16), 64)}`,
                ...t2,
            ];
        });

        it('succesfully encodes output of a join split proof', async () => {
            const m = 2;
            const inputNotes = notes.slice(0, 2);
            const outputNotes = notes.slice(2, 4);
            const senderAddress = accounts[0];
            const {
                proofData,
                challenge,
            } = aztec.proof.joinSplit.constructJoinSplit([...inputNotes, ...outputNotes], m, accounts[0], 0);
            const inputSignatures = inputNotes.map((inputNote, index) => {
                const { privateKey } = aztecAccounts[index];
                return aztec.sign.signACENote(
                    proofData[index],
                    challenge,
                    senderAddress,
                    aztecAbiEncoder.address,
                    privateKey,
                    fakeNetworkId
                );
            });
            const publicOwner = aztecAccounts[0].address;
            const outputOwners = outputNotes.map(n => n.owner);
            console.log('output owners: ', outputOwners);

            const data = aztec.abiEncoder.joinSplit.encode(
                proofData,
                m,
                challenge,
                publicOwner,
                inputSignatures,
                outputOwners,
                outputNotes
            );

            const result = await aztecAbiEncoder.validateJoinSplit(data, senderAddress, crs, {
                from: accounts[0],
                gas: 4000000,
            });

            const expected = aztec.abiEncoder.joinSplit.outputCoder.encodeProofOutputs([{
                inputNotes,
                outputNotes,
                publicOwner,
                publicValue: 0,
            }]);

            const decoded = aztec.abiEncoder.joinSplit.outputCoder.decodeProofOutputs(`0x${padLeft('0', 64)}${result.slice(2)}`);
            console.log(decoded[0].inputNotes[0].owner);
            console.log(decoded[0].inputNotes[1].owner);

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
            expect(result.slice(2)).to.equal(expected.slice(0x42));
            expect(result.slice(2).length / 2).to.equal(parseInt(expected.slice(0x02, 0x42), 16));
            const gasUsed = await aztecAbiEncoder.validateJoinSplit.estimateGas(data, senderAddress, crs, {
                from: accounts[0],
                gas: 4000000,
            });

            console.log('gas used = ', gasUsed);
        });
    });
});
