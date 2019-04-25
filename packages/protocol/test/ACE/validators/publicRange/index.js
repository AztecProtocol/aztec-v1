/* global artifacts, expect, contract, beforeEach, it:true */
// ### External Dependencies

// ### Internal Dependencies
const {
    secp256k1,
    note,
    proof: { publicRange },
} = require('aztec.js');
const { constants } = require('@aztec/dev-utils');
const truffleAssert = require('truffle-assertions');

// ### Artifacts

const PublicRange = artifacts.require('./PublicRange');
const PublicRangeInterface = artifacts.require('./PublicRangeInterface');

PublicRange.abi = PublicRangeInterface.abi;

contract.only('Public range proof tests', (accounts) => {
    let publicRangeContract;

    describe('Greater than tests', () => {
        describe('Success States', () => {
            beforeEach(async () => {
                publicRangeContract = await PublicRange.new({
                    from: accounts[0],
                });
            });

            it('validate success when using zk validator contract', async () => {
                // k1 > kPublic
                const noteValues = [50, 40];
                const kPublic = 10;
                const numNotes = noteValues.length;
                const aztecAccounts = [...new Array(numNotes)].map(() => secp256k1.generateAccount());
                const notes = await Promise.all(
                    aztecAccounts.map(({ publicKey }, i) => {
                        return note.create(publicKey, noteValues[i]);
                    })
                );

                const inputNotes = notes.slice(0, 1);
                const outputNotes = notes.slice(1, 2);
                const senderAddress = accounts[0];

                const { proofData, expectedOutput } = publicRange.encodePublicRangeTransaction({
                    inputNotes,
                    outputNotes,
                    kPublic,
                    senderAddress,
                });

                const result = await publicRangeContract.validatePublicRange(proofData, accounts[0], constants.CRS, {
                    from: accounts[0],
                    gas: 4000000,
                });
                expect(result).to.equal(expectedOutput);
            });

            it('validate success when public integer equals the note value', async () => {
                const noteValues = [10, 0];
                const kPublic = 10;
                const numNotes = noteValues.length;
                const aztecAccounts = [...new Array(numNotes)].map(() => secp256k1.generateAccount());
                const notes = await Promise.all(
                    aztecAccounts.map(({ publicKey }, i) => {
                        return note.create(publicKey, noteValues[i]);
                    })
                );

                const inputNotes = notes.slice(0, 1);
                const outputNotes = notes.slice(1, 2);
                const senderAddress = accounts[0];

                const { proofData, expectedOutput } = publicRange.encodePublicRangeTransaction({
                    inputNotes,
                    outputNotes,
                    kPublic,
                    senderAddress,
                });

                const result = await publicRangeContract.validatePublicRange(proofData, accounts[0], constants.CRS, {
                    from: accounts[0],
                    gas: 4000000,
                });
                expect(result).to.equal(expectedOutput);
            });
        });

        describe('Failure States', () => {
            beforeEach(async () => {
                publicRangeContract = await PublicRange.new({
                    from: accounts[0],
                });
            });

            it('validate failure when balancing relationship not held', async () => {
                const noteValues = [50, 41];
                const kPublic = 10;
                const numNotes = noteValues.length;
                const aztecAccounts = [...new Array(numNotes)].map(() => secp256k1.generateAccount());
                const notes = await Promise.all(
                    aztecAccounts.map(({ publicKey }, i) => {
                        return note.create(publicKey, noteValues[i]);
                    })
                );

                const inputNotes = notes.slice(0, 1);
                const outputNotes = notes.slice(1, 2);
                const senderAddress = accounts[0];

                const { proofData } = publicRange.encodePublicRangeTransaction({
                    inputNotes,
                    outputNotes,
                    kPublic,
                    senderAddress,
                });

                const opts = {
                    from: accounts[0],
                    gas: 4000000,
                };
                await truffleAssert.reverts(
                    publicRangeContract.validatePublicRange(proofData, senderAddress, constants.CRS, opts),
                );
            });

            it('validate failure when note value is less than public integer', async () => {
                const noteValues = [9, 0];
                const kPublic = 10;
                const numNotes = noteValues.length;
                const aztecAccounts = [...new Array(numNotes)].map(() => secp256k1.generateAccount());
                const notes = await Promise.all(
                    aztecAccounts.map(({ publicKey }, i) => {
                        return note.create(publicKey, noteValues[i]);
                    })
                );

                const inputNotes = notes.slice(0, 1);
                const outputNotes = notes.slice(1, 2);
                const senderAddress = accounts[0];

                const { proofData } = publicRange.encodePublicRangeTransaction({
                    inputNotes,
                    outputNotes,
                    kPublic,
                    senderAddress,
                });

                const opts = {
                    from: accounts[0],
                    gas: 4000000,
                };
                await truffleAssert.reverts(
                    publicRangeContract.validatePublicRange(proofData, senderAddress, constants.CRS, opts),
                );
            });
        });
    });
    /*
    describe('Less than tests', () => {
        describe('Success States', () => {
            beforeEach(async () => {
                publicRangeContract = await PublicRange.new({
                    from: accounts[0],
                });
            });

            it('validate success when using zk validator contract', async () => {
                // TODO
                const noteValues = [0, 0];
                const kPublic = constants.GROUP_MODULUS;
                console.log({ kPublic });

                const numNotes = noteValues.length;
                const aztecAccounts = [...new Array(numNotes)].map(() => secp256k1.generateAccount());
                const notes = aztecAccounts.map(({ publicKey }, i) => {
                    return note.create(publicKey, noteValues[i]);
                });

                const inputNotes = notes.slice(0, 1);
                const outputNotes = notes.slice(1, 2);
                const senderAddress = accounts[0];

                const { proofData } = publicRange.encodePublicRangeTransaction({
                    inputNotes,
                    outputNotes,
                    kPublic,
                    senderAddress,
                });

                const result = await publicRangeContract.validatePublicRange(proofData, accounts[0], constants.CRS, {
                    from: accounts[0],
                    gas: 4000000,
                });
                expect(result).to.equal(true);
            });
        });
    });
    */
});
