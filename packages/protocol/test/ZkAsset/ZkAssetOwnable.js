/* global artifacts, beforeEach, contract, expect,it */
// ### External Dependencies
const BN = require('bn.js');
const truffleAssert = require('truffle-assertions');

// ### Internal Dependencies
// eslint-disable-next-line object-curly-newline
const { abiEncoder, note, proof, secp256k1, sign } = require('aztec.js');
const { constants, proofs: { JOIN_SPLIT_PROOF } } = require('@aztec/dev-utils');

const { outputCoder } = abiEncoder;

// ### Artifacts
const ERC20Mintable = artifacts.require('./contracts/ERC20/ERC20Mintable');
const ACE = artifacts.require('./contracts/ACE/ACE');
const JoinSplit = artifacts.require('./contracts/ACE/validators/JoinSplit');
const JoinSplitInterface = artifacts.require('./contracts/ACE/validators/JoinSplitInterface');
const ZkAssetOwnable = artifacts.require('./contracts/ZkAsset/ZkAssetOwnable');
const ZkAssetOwnableTest = artifacts.require('./contracts/ZkAsset/ZkAssetOwnableTest');


JoinSplit.abi = JoinSplitInterface.abi;

const signNote = (validatorAddress, noteHash, spender, privateKey) => {
    const domain = sign.generateZKAssetDomainParams(validatorAddress);
    const schema = constants.eip712.NOTE_SIGNATURE;
    const status = true;
    const message = {
        noteHash,
        spender,
        status,
    };
    return sign.signStructuredData(domain, schema, message, privateKey);
};

contract('ZkAssetOwnable', (accounts) => {
    let ace;
    let aztecJoinSplit;
    let erc20;
    let zkAssetOwnable;
    let zkAssetOwnableTest;

    let aztecAccounts = [];
    const epoch = 1;
    const filter = 17; // 16 + 1, recall that 1 is the join split validator because of 1 * 256**(0)
    let notes = [];
    const proofs = [];
    let proofHashes = [];
    let proofOutputs = [];
    const scalingFactor = new BN(10);
    const tokensTransferred = new BN(100000);

    const confidentialApprove = async (indexes) => {
        await Promise.all(indexes.map((i) => {
            const { signature } = signNote(
                zkAssetOwnable.address,
                notes[i].noteHash,
                zkAssetOwnableTest.address,
                aztecAccounts[i].privateKey
            );
            const concatenatedSignature = signature[0] + signature[1].slice(2) + signature[2].slice(2);
            // eslint-disable-next-line no-await-in-loop
            return zkAssetOwnable.confidentialApprove(
                notes[i].noteHash,
                zkAssetOwnableTest.address,
                true,
                concatenatedSignature
            );
        }));
    };


    beforeEach(async () => {
        ace = await ACE.new({ from: accounts[0] });
        aztecAccounts = [...new Array(10)].map(() => secp256k1.generateAccount());
        notes = [
            ...aztecAccounts.map(({ publicKey }, i) => note.create(publicKey, i * 10)),
            ...aztecAccounts.map(({ publicKey }, i) => note.create(publicKey, i * 10)),
        ];
        await ace.setCommonReferenceString(constants.CRS);
        aztecJoinSplit = await JoinSplit.new();
        await ace.setProof(JOIN_SPLIT_PROOF, aztecJoinSplit.address);

        proofs[0] = proof.joinSplit.encodeJoinSplitTransaction({
            inputNotes: [],
            outputNotes: notes.slice(0, 2),
            senderAddress: accounts[0],
            inputNoteOwners: [],
            publicOwner: accounts[0],
            kPublic: -10,
            validatorAddress: aztecJoinSplit.address,
        });
        proofs[1] = proof.joinSplit.encodeJoinSplitTransaction({
            inputNotes: notes.slice(0, 2),
            outputNotes: notes.slice(2, 4),
            senderAddress: accounts[0],
            inputNoteOwners: aztecAccounts.slice(0, 2),
            publicOwner: accounts[1],
            kPublic: -40,
            validatorAddress: aztecJoinSplit.address,
        });
        proofs[2] = proof.joinSplit.encodeJoinSplitTransaction({
            inputNotes: [],
            outputNotes: notes.slice(6, 8),
            senderAddress: accounts[0],
            inputNoteOwners: [],
            publicOwner: accounts[2],
            kPublic: -130,
            validatorAddress: aztecJoinSplit.address,
        });
        proofs[3] = proof.joinSplit.encodeJoinSplitTransaction({
            inputNotes: notes.slice(6, 8),
            outputNotes: notes.slice(4, 6),
            senderAddress: accounts[0],
            inputNoteOwners: aztecAccounts.slice(6, 8),
            publicOwner: accounts[3],
            kPublic: 40,
            validatorAddress: aztecJoinSplit.address,
        });
        proofs[4] = proof.joinSplit.encodeJoinSplitTransaction({
            inputNotes: [],
            outputNotes: [notes[0], notes[3]],
            senderAddress: accounts[0],
            inputNoteOwners: [],
            publicOwner: accounts[3],
            kPublic: -30,
            validatorAddress: aztecJoinSplit.address,
        });
        proofs[5] = proof.joinSplit.encodeJoinSplitTransaction({
            inputNotes: [notes[0], notes[3]],
            outputNotes: [notes[1], notes[2]],
            senderAddress: accounts[0],
            inputNoteOwners: [aztecAccounts[0], aztecAccounts[3]],
            publicOwner: accounts[3],
            kPublic: 0, // perfectly balanced...
            validatorAddress: aztecJoinSplit.address,
        });

        proofOutputs = proofs.map(({ expectedOutput }) => {
            return outputCoder.getProofOutput(expectedOutput, 0);
        });
        proofHashes = proofOutputs.map((proofOutput) => {
            return outputCoder.hashProofOutput(proofOutput);
        });

        erc20 = await ERC20Mintable.new();
        const canAdjustSupply = false;
        const canConvert = true;
        zkAssetOwnable = await ZkAssetOwnable.new(
            ace.address,
            erc20.address,
            scalingFactor,
            canAdjustSupply,
            canConvert
        );
        await zkAssetOwnable.setProofs(epoch, filter);
        zkAssetOwnableTest = await ZkAssetOwnableTest.new();
        await zkAssetOwnableTest.setZkAssetOwnableAddress(zkAssetOwnable.address);

        await Promise.all(accounts.map((account) => {
            const opts = { from: accounts[0], gas: 4700000 };
            return erc20.mint(
                account,
                scalingFactor.mul(tokensTransferred),
                opts
            );
        }));
        await Promise.all(accounts.map((account) => {
            const opts = { from: account, gas: 4700000 };
            return erc20.approve(
                ace.address,
                scalingFactor.mul(tokensTransferred),
                opts
            );
        }));

        await ace.publicApprove(
            zkAssetOwnable.address,
            proofHashes[0],
            10,
            { from: accounts[0] }
        );
        await ace.publicApprove(
            zkAssetOwnable.address,
            proofHashes[1],
            40,
            { from: accounts[1] }
        );
        await ace.publicApprove(
            zkAssetOwnable.address,
            proofHashes[2],
            130,
            { from: accounts[2] }
        );
        await ace.publicApprove(
            zkAssetOwnable.address,
            proofHashes[4],
            30,
            { from: accounts[3] }
        );
    });

    describe('success states', () => {
        it('should set a new proof bit filter', async () => {
            const { receipt } = await zkAssetOwnable.setProofs(epoch, filter);
            expect(receipt.status).to.equal(true);
        });

        it('should delegate a contract to update a note registry by consuming input notes, with kPublic negative', async () => {
            await zkAssetOwnable.confidentialTransfer(proofs[0].proofData);

            await confidentialApprove([0, 1]);

            await zkAssetOwnableTest.callValidateProof(JOIN_SPLIT_PROOF, proofs[1].proofData);

            const formattedProofOutput = `0x${proofOutputs[1].slice(0x40)}`;
            const { receipt } = await zkAssetOwnableTest.callConfidentialTransferFrom(JOIN_SPLIT_PROOF, formattedProofOutput);
            expect(receipt.status).to.equal(true);
        });

        it('should delegate a contract to update a note registry by consuming input notes, with kPublic positive', async () => {
            await zkAssetOwnable.confidentialTransfer(proofs[2].proofData);

            await confidentialApprove([6, 7]);

            await zkAssetOwnableTest.callValidateProof(JOIN_SPLIT_PROOF, proofs[3].proofData);

            const formattedProofOutput = `0x${proofOutputs[3].slice(0x40)}`;
            const { receipt } = await zkAssetOwnableTest.callConfidentialTransferFrom(JOIN_SPLIT_PROOF, formattedProofOutput);
            expect(receipt.status).to.equal(true);

            const result = await ace.getNote(zkAssetOwnable.address, notes[6].noteHash);
            expect(result.status.toNumber()).to.equal(constants.statuses.NOTE_SPENT);
        });

        it('should delegate a contract to update a note registry with kPublic = 0', async () => {
            await zkAssetOwnable.confidentialTransfer(proofs[4].proofData);

            await confidentialApprove([0, 3]);

            await zkAssetOwnableTest.callValidateProof(JOIN_SPLIT_PROOF, proofs[5].proofData);

            const formattedProofOutput = `0x${proofOutputs[5].slice(0x40)}`;
            const { receipt } = await zkAssetOwnableTest.callConfidentialTransferFrom(JOIN_SPLIT_PROOF, formattedProofOutput);
            expect(receipt.status).to.equal(true);
        });
    });

    describe('failure states', async () => {
        it('should fail to set a new proof bit filter if not owner', async () => {
            const opts = { from: accounts[1] };
            await truffleAssert.reverts(
                zkAssetOwnable.setProofs(epoch, filter, opts),
                'only the owner can set the epoch proofs'
            );
        });

        it('should fail to approve a contract to update a note registry if note doesn\'t exist', async () => {
            await zkAssetOwnable.confidentialTransfer(proofs[0].proofData);

            const { signature } = signNote(
                zkAssetOwnable.address,
                notes[0].noteHash,
                zkAssetOwnableTest.address,
                aztecAccounts[0].privateKey
            );
            const concatenatedSignature = signature[0] + signature[1].slice(2) + signature[2].slice(2);
            await truffleAssert.reverts(
                zkAssetOwnable.confidentialApprove(
                    notes[2].noteHash, // wrong note hash
                    zkAssetOwnableTest.address,
                    true,
                    concatenatedSignature
                ),
                'expected note to exist'
            );
        });

        it('should fail to approve a contract to update a note registry if note had already been spent', async () => {
            await zkAssetOwnable.confidentialTransfer(proofs[0].proofData);
            await zkAssetOwnable.confidentialTransfer(proofs[1].proofData);

            const { signature } = signNote(
                zkAssetOwnable.address,
                notes[0].noteHash,
                zkAssetOwnableTest.address,
                aztecAccounts[0].privateKey
            );
            const concatenatedSignature = signature[0] + signature[1].slice(2) + signature[2].slice(2);
            await truffleAssert.reverts(
                zkAssetOwnable.confidentialApprove(
                    notes[0].noteHash,
                    zkAssetOwnableTest.address,
                    true,
                    concatenatedSignature
                ),
                'only unspent notes can be approved'
            );
        });

        // eslint-disable-next-line max-len
        it('should fail to approve a contract to update a note registry if no ECDSA signature is provided and the sender is not the note owner', async () => {
            await zkAssetOwnable.confidentialTransfer(proofs[0].proofData);

            const emptySignature = '0x';
            await truffleAssert.reverts(
                zkAssetOwnable.confidentialApprove(
                    notes[0].noteHash,
                    zkAssetOwnableTest.address,
                    true,
                    emptySignature
                ),
                'the note owner did not sign this message'
            );
        });

        it('should fail to delegate a contract to update a note registry is proof is not supported', async () => {
            await zkAssetOwnable.confidentialTransfer(proofs[0].proofData);

            await confidentialApprove([0, 1]);

            await zkAssetOwnableTest.callValidateProof(JOIN_SPLIT_PROOF, proofs[1].proofData);

            const bogusProof = `${parseInt(JOIN_SPLIT_PROOF, 10) + 1}`; // adding 1 changes the proof id from the proof object
            const formattedProofOutput = `0x${proofOutputs[1].slice(0x40)}`;
            await truffleAssert.reverts(
                zkAssetOwnableTest.callConfidentialTransferFrom(
                    bogusProof,
                    formattedProofOutput
                ),
                'expected proof to be supported'
            );
        });

        it('should fail to delegate a contract to update a note registry if publicApprove has not been called', async () => {
            await zkAssetOwnable.confidentialTransfer(proofs[0].proofData);

            await confidentialApprove([0, 1]);

            const opts = { from: accounts[1] };
            await ace.publicApprove(zkAssetOwnable.address, proofHashes[1], 0, opts);

            await zkAssetOwnableTest.callValidateProof(JOIN_SPLIT_PROOF, proofs[1].proofData);

            const formattedProofOutput = `0x${proofOutputs[1].slice(0x40)}`;
            await truffleAssert.reverts(
                zkAssetOwnableTest.callConfidentialTransferFrom(JOIN_SPLIT_PROOF, formattedProofOutput),
                'public owner has not validated a transfer of tokens'
            );
        });
    });
});
