/* global artifacts, contract, expect, it: true */

const devUtils = require('@aztec/dev-utils');

const aztec = require('aztec.js');
const dotenv = require('dotenv');

dotenv.config();

const secp256k1 = require('@aztec/secp256k1');

const ACE = artifacts.require('./ACE.sol');
const ethUtil = require('ethereumjs-util');

const ZkAssetMintable = artifacts.require('./ZkAssetMintable.sol');
const BatchApproval = artifacts.require('./BatchApproval.sol');

// const JoinSplitFluid = artifacts.require('./JoinSplitFluid.sol');
// const Swap = artifacts.require('./Swap.sol');
// const Dividend = artifacts.require('./Dividend.sol');
// const PrivateRange = artifacts.require('./PrivateRange.sol');
// const JoinSplit = artifacts.require('./JoinSplit.sol');

const {
    constants,
    // proofs: { JOIN_SPLIT_PROOF, MINT_PROOF, SWAP_PROOF, DIVIDEND_PROOF, BURN_PROOF, PRIVATE_RANGE_PROOF },
    proofs: { MINT_PROOF },
} = devUtils;

const { randomHex } = require('web3-utils');

const { JoinSplitProof, MintProof } = aztec;

// const alice = secp256k1.generateAccount();
// const bob = secp256k1.generateAccount();
const alice = secp256k1.accountFromPrivateKey(process.env.GANACHE_TESTING_ACCOUNT_0);
const bob = secp256k1.accountFromPrivateKey(process.env.GANACHE_TESTING_ACCOUNT_1);

contract.only('BatchApproval', async (accounts) => {
    let ace;
    let zkAssetMintableContract;
    let batchApprovalContract;

    beforeEach(async () => {
        ace = await ACE.at(ACE.address);
        zkAssetMintableContract = await ZkAssetMintable.new(ace.address, '0x0000000000000000000000000000000000000000', 1, 0, []);
        batchApprovalContract = await BatchApproval.new(ace.address, { from: alice.address });
        expect(await batchApprovalContract.owner()).to.equal(alice.address);
    });

    const sum = (arrayToSum) => arrayToSum.reduce((a, b) => a + b, 0);

    const createNotesArray = async (publicKey, values, contractAddress) => {
        const notes = values.map((i) => aztec.note.create(publicKey, i, contractAddress));
        // eslint-disable-next-line no-return-await
        return await Promise.all(notes);
    };

    const mintNotes = async (values, ownerPublicKey, fromAddress) => {
        const notes = await createNotesArray(ownerPublicKey, values, fromAddress);

        const newMintCounterNote = await aztec.note.create(ownerPublicKey, sum(values));
        const zeroMintCounterNote = await aztec.note.createZeroValueNote();
        const sender = accounts[0];

        const mintProof = new MintProof(zeroMintCounterNote, newMintCounterNote, notes, sender);

        const mintData = mintProof.encodeABI();
        await zkAssetMintableContract.confidentialMint(MINT_PROOF, mintData, { from: sender });
        const noteHashes = notes.map((note) => note.noteHash);
        return { notes, values, noteHashes };
    };

    const approveAndSpendNotes = async (amount, sellerPublicKey, buyerPublicKey, buyerFunds, buyerNotes, buyerNoteHashes) => {
        const invoice = await aztec.note.create(sellerPublicKey, amount);
        const change = await aztec.note.create(buyerPublicKey, buyerFunds - amount, batchApprovalContract.address);
        const sendProof = new JoinSplitProof(
            buyerNotes,
            [invoice, change],
            batchApprovalContract.address,
            0,
            batchApprovalContract.address,
        );
        const sendProofData = sendProof.encodeABI(zkAssetMintableContract.address);
        const result = await batchApprovalContract.spendNotes(
            buyerNoteHashes,
            sendProofData,
            zkAssetMintableContract.address,
            batchApprovalContract.address,
        );
        return result;
    };

    const spendNotesWithFunctions = async (amount, sellerPublicKey, buyerPublicKey, buyerFunds, buyerNotes) => {
        const invoice = await aztec.note.create(sellerPublicKey, amount);
        const change = await aztec.note.create(buyerPublicKey, buyerFunds - amount, batchApprovalContract.address);
        const sendProof = new JoinSplitProof(
            buyerNotes,
            [invoice, change],
            batchApprovalContract.address,
            0,
            batchApprovalContract.address,
        );
        const sendProofData = sendProof.encodeABI(zkAssetMintableContract.address);
        const result = await batchApprovalContract.proofValidation(
            sendProofData,
            zkAssetMintableContract.address,
            batchApprovalContract.address,
        );
        return result;
    };

    const shouldFail = async (codeToRun, expectedError, unwantedSuccessError) => {
        try {
            await codeToRun();
            throw new Error(unwantedSuccessError);
        } catch (err) {
            if (err.reason !== expectedError) {
                throw err;
            }
        }
    };

    it('owner of the contract should be able to mint notes that are owned by the contract', async () => {
        const { notes } = await mintNotes([50, 75, 100], alice.publicKey, batchApprovalContract.address);
        notes.map(async (note) => {
            const aceNote = await ace.getNote(zkAssetMintableContract.address, note.noteHash);
            expect(aceNote).to.not.equal(undefined);
            expect(aceNote.noteOwner).to.equal(batchApprovalContract.address);
        });
    });

    it('owner of contract can approve notes that are owned by the contract to be spent by the contract', async () => {
        const { notes } = await mintNotes([50, 75, 100, 25, 125], alice.publicKey, batchApprovalContract.address);
        const approvedMintedNotes = [notes[0], notes[1], notes[2]];
        const nonApprovedMintedNotes = [notes[3], notes[4]];

        const approvedNoteHashes = approvedMintedNotes.map((note) => note.noteHash);
        await batchApprovalContract.batchApprove(
            approvedNoteHashes,
            zkAssetMintableContract.address,
            batchApprovalContract.address,
        );

        approvedMintedNotes.map(async (note) => {
            expect(await zkAssetMintableContract.confidentialApproved(note.noteHash, batchApprovalContract.address)).to.equal(
                true,
            );
        });

        nonApprovedMintedNotes.map(async (note) => {
            expect(await zkAssetMintableContract.confidentialApproved(note.noteHash, batchApprovalContract.address)).to.equal(
                false,
            );
        });
    });

    it('the contract should be able to spend notes after they have been approved for it to spend', async () => {
        const { values, notes, noteHashes } = await mintNotes([50, 75, 100], alice.publicKey, batchApprovalContract.address);
        await batchApprovalContract.batchApprove(noteHashes, zkAssetMintableContract.address, batchApprovalContract.address);
        const result = await spendNotesWithFunctions(100, bob.publicKey, alice.publicKey, sum(values), notes);
        expect(result.receipt.status).to.equal(true);
    });

    it('the contract should be able to approve and spend notes in one call using the spendNotes method', async () => {
        const { values, notes, noteHashes } = await mintNotes([50, 75, 100], alice.publicKey, batchApprovalContract.address);
        const result = await approveAndSpendNotes(100, bob.publicKey, alice.publicKey, sum(values), notes, noteHashes);
        expect(result.receipt.status).to.equal(true);
    });

    it("the contract shouldn't be able to spend unapproved notes", async () => {
        const { values, notes } = await mintNotes([25, 125], alice.publicKey, batchApprovalContract.address);
        await shouldFail(
            async () => {
                await spendNotesWithFunctions(100, bob.publicKey, alice.publicKey, sum(values), notes);
            },
            'sender does not have approval to spend input note',
            'JoinSplit succeeds but notes are not approved',
        );
    });

    it("the contract shouldn't be able to spend notes that it has already spent", async () => {
        const { values, notes, noteHashes } = await mintNotes([50, 75, 100], alice.publicKey, batchApprovalContract.address);
        await batchApprovalContract.batchApprove(noteHashes, zkAssetMintableContract.address, batchApprovalContract.address);
        await spendNotesWithFunctions(100, bob.publicKey, alice.publicKey, sum(values), notes);
        await shouldFail(
            async () => {
                await spendNotesWithFunctions(100, bob.publicKey, alice.publicKey, sum(values), notes);
            },
            'input note status is not UNSPENT',
            'JoinSplit succeeds but notes should already be spent',
        );
    });

    it('owner of the contract should be able to approve notes for spending by another person', async () => {
        const { notes, noteHashes } = await mintNotes([50, 75, 100], alice.publicKey, batchApprovalContract.address);
        await batchApprovalContract.batchApprove(noteHashes, zkAssetMintableContract.address, bob.address);
        notes.map(async (note) => {
            expect(await zkAssetMintableContract.confidentialApproved(note.noteHash, bob.address)).to.equal(true);
        });
    });

    it("the contract shouldn't be able to approve notes for itself to spend that have already been spent", async () => {
        const { values, notes, noteHashes } = await mintNotes([50, 75, 100], alice.publicKey, batchApprovalContract.address);
        await batchApprovalContract.batchApprove(noteHashes, zkAssetMintableContract.address, batchApprovalContract.address);
        await spendNotesWithFunctions(100, bob.publicKey, alice.publicKey, sum(values), notes);
        await shouldFail(
            async () => {
                await batchApprovalContract.batchApprove(
                    noteHashes,
                    zkAssetMintableContract.address,
                    batchApprovalContract.address,
                );
            },
            'only unspent notes can be approved',
            'approval for this address succeeds but notes should already be spent so it should be impossible to approve them',
        );
    });

    it("the contract shouldn't be able to approve notes for another address to spend that have already been spent", async () => {
        const { values, notes, noteHashes } = await mintNotes([50, 75, 100], alice.publicKey, batchApprovalContract.address);
        await batchApprovalContract.batchApprove(noteHashes, zkAssetMintableContract.address, batchApprovalContract.address);
        await spendNotesWithFunctions(100, bob.publicKey, alice.publicKey, sum(values), notes);
        await shouldFail(
            async () => {
                await batchApprovalContract.batchApprove(noteHashes, zkAssetMintableContract.address, bob.address);
            },
            'only unspent notes can be approved',
            'approval for another address succeeds but notes should already be spent so it should be impossible to approve them',
        );
    });

    // it('another person should be able to spend notes owned by the contract after approval to spend', async () => {
    // });

    const getExampleNotesConstants = () => {
        const account = alice;
        const spender = bob.address;
        const verifyingContract = randomHex(20);
        const noteHashes = Array(4)
            .fill()
            .map(() => randomHex(32));
        const statuses = Array(noteHashes.length)
            .fill()
            .map(() => true);
        const message = {
            noteHashes,
            spender,
            statuses,
        };
        const schema = constants.eip712.MULTIPLE_NOTE_SIGNATURE;
        const signature = aztec.signer.compoundSignNotesForBatchApproval(
            verifyingContract,
            noteHashes,
            spender,
            account.privateKey,
        );
        return { verifyingContract, noteHashes, statuses, spender, message, schema, account, signature };
    };

    it('should output a well formed signature', () => {
        const { verifyingContract, message, schema, account } = getExampleNotesConstants();

        const domain = aztec.signer.generateACEDomainParams(verifyingContract, constants.eip712.ACE_DOMAIN_PARAMS);
        const { unformattedSignature } = aztec.signer.signTypedData(domain, schema, message, account.privateKey);

        const expectedLength = 192; // r (64 char), s (64 char), v (64 chars)
        const expectedNumCharacters = 64; // v, r and s should be 32 bytes

        const r = unformattedSignature.slice(0, 64);
        const s = unformattedSignature.slice(64, 128);
        const v = unformattedSignature.slice(128, 192);

        expect(unformattedSignature.length).to.equal(expectedLength);
        expect(r.length).to.equal(expectedNumCharacters);
        expect(s.length).to.equal(expectedNumCharacters);
        expect(v.length).to.equal(expectedNumCharacters);
    });

    it('signNoteForConfidentialApprove() should produce a well formed `v` ECDSA parameter', async () => {
        const { signature } = getExampleNotesConstants();

        const v = parseInt(signature.slice(130, 132), 16);
        expect(v).to.be.oneOf([27, 28]);
    });

    it('should recover publicKey from signature params', async () => {
        const { verifyingContract, message, schema, account, signature } = getExampleNotesConstants();

        const r = Buffer.from(signature.slice(2, 66), 'hex');
        const s = Buffer.from(signature.slice(66, 130), 'hex');
        const v = parseInt(signature.slice(130, 132), 16);

        const domain = aztec.signer.generateZKAssetDomainParams(verifyingContract);
        const { encodedTypedData } = aztec.signer.signTypedData(domain, schema, message, account.privateKey);
        const messageHash = Buffer.from(encodedTypedData.slice(2), 'hex');
        const publicKeyRecover = ethUtil.ecrecover(messageHash, v, r, s).toString('hex');
        expect(publicKeyRecover).to.equal(account.publicKey.slice(4));
    });
});
