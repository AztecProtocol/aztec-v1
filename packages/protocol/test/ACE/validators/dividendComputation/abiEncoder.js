/* global artifacts, expect, contract, beforeEach, it:true */
// ### External Dependencies
const BN = require('bn.js');
const { padLeft } = require('web3-utils');

// ### Internal Dependencies
const aztec = require('aztec.js');
const { params: { t2 } } = require('aztec.js');

// ### Artifacts
const ABIEncoder = artifacts.require('./contracts/ACE/validators/DividendComputation/DividendComputationABIEncoderTest');


const fakeNetworkId = 100;
contract('Dividend Computation ABI Encoder', (accounts) => {
    let DividendComputationAbiEncoder;
    let dividendAccounts = [];
    let notes = [];

    describe('success states', () => {
        let crs;
        let za;
        let zb;

        beforeEach(async () => {
            const noteValues = [90, 4, 50];
            za = 100;
            zb = 5;

            dividendAccounts = [...new Array(3)].map(() => aztec.secp256k1.generateAccount());
            notes = dividendAccounts.map(({ publicKey }, i) => {
                return aztec.note.create(publicKey, noteValues[i]);
            });

            DividendComputationAbiEncoder = await ABIEncoder.new(fakeNetworkId, {
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
            const inputNotes = notes.slice(0, 1);
            const outputNotes = notes.slice(1, 3);
            const senderAddress = accounts[0];
            const {
                proofData,
                challenge,
            } = aztec.proof.dividendComputation.constructProof([...inputNotes, ...outputNotes], za, zb, accounts[0]);

            const proofDataFormatted = [proofData.slice(0, 6)].concat([proofData.slice(6, 12), proofData.slice(12, 18)]);

            const publicOwner = '0x0000000000000000000000000000000000000000';

            const inputOwners = inputNotes.map(m => m.owner);
            const outputOwners = outputNotes.map(n => n.owner);

            const data = aztec.abiEncoder.dividendComputation.encode(
                proofDataFormatted,
                challenge,
                za,
                zb,
                inputOwners,
                outputOwners,
                outputNotes
            );

            const result = await DividendComputationAbiEncoder.validateDividendComputation(data, senderAddress, crs, {
                from: accounts[0],
                gas: 4000000,
            });

            const expected = aztec.abiEncoder.outputCoder.encodeProofOutputs([{
                inputNotes,
                outputNotes,
                publicOwner,
                publicValue: 0,
            }]);

            const decoded = aztec.abiEncoder.outputCoder.decodeProofOutputs(
                `0x${padLeft('0', 64)}${result.slice(2)}`
            );

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

            expect(decoded[0].publicOwner).to.equal(publicOwner.toLowerCase());
            expect(decoded[0].publicValue).to.equal(0);
            expect(result.slice(2)).to.equal(expected.slice(0x42));
            expect(result.slice(2).length / 2).to.equal(parseInt(expected.slice(0x02, 0x42), 16));
            const gasUsed = await DividendComputationAbiEncoder.validateDividendComputation.estimateGas(
                data, senderAddress, crs,
                {
                    from: accounts[0],
                    gas: 4000000,
                }
            );
            console.log('gas used = ', gasUsed);
        });
    });
});
