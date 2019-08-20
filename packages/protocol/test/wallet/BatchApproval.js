/* global-artifacts, expect, contract, it:true */

const devUtils = require('@aztec/dev-utils');

const aztec = require('aztec.js');
const dotenv = require('dotenv');
dotenv.config();
const secp256k1 = require('@aztec/secp256k1');

const ACE = artifacts.require('./ACE.sol');

const ZkAssetMintable = artifacts.require('./ZkAssetMintable.sol');
const BatchApproval = artifacts.require('./BatchApproval.sol');


const JoinSplitFluid = artifacts.require('./JoinSplitFluid.sol');
const Swap = artifacts.require('./Swap.sol');
const Dividend = artifacts.require('./Dividend.sol');
const PrivateRange = artifacts.require('./PrivateRange.sol');
const JoinSplit = artifacts.require('./JoinSplit.sol');

const {
    constants,
    proofs: {
        JOIN_SPLIT_PROOF,
        MINT_PROOF,
        SWAP_PROOF,
        DIVIDEND_PROOF,
        BURN_PROOF,
        PRIVATE_RANGE_PROOF,
    },
} = devUtils;

const { JoinSplitProof, MintProof } = aztec;

// const alice = secp256k1.generateAccount();
// const bob = secp256k1.generateAccount();
const alice = secp256k1.accountFromPrivateKey(process.env.GANACHE_TESTING_ACCOUNT_0);
const bob   = secp256k1.accountFromPrivateKey(process.env.GANACHE_TESTING_ACCOUNT_1);

contract.only('BatchApproval', async (accounts) => {

    const sum = (arrayToSum) => arrayToSum.reduce((a,b) => a+b, 0);

    const createNotesArray = async (publicKey, values, contractAddress) => {
        const notes = [];
        for (let i = 0; i < values.length; i++) {
            notes[i] = await aztec.note.create(publicKey, values[i], contractAddress);
        }
        return notes;
    };

    const mintNotes = async (values, ownerPublicKey, fromAddress) => {
        let notes = await createNotesArray(ownerPublicKey, values, fromAddress);

        const newMintCounterNote = await aztec.note.create(ownerPublicKey, sum(values));
        const zeroMintCounterNote = await aztec.note.createZeroValueNote();
        const sender = accounts[0];

        const mintProof = new MintProof(
            zeroMintCounterNote,
            newMintCounterNote,
            notes,
            sender,
        );

        const mintData = mintProof.encodeABI();
        await zkAssetMintableContract.confidentialMint(MINT_PROOF, mintData, {from: sender });
        const hashes = notes.map(note => note.noteHash);
        return { notes, values, hashes };
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
        let result = await batchApprovalContract.spendNotes(buyerNoteHashes, sendProofData, zkAssetMintableContract.address, batchApprovalContract.address);
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
        let result = await batchApprovalContract.proofValidation(sendProofData, zkAssetMintableContract.address, batchApprovalContract.address);
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

    let ace;
    let zkAssetMintableContract;
    let batchApprovalContract;
    beforeEach(async () => {
        ace = await ACE.at(ACE.address);
        zkAssetMintableContract = await ZkAssetMintable.new(ace.address,
            '0x0000000000000000000000000000000000000000',
            1,
            0, []);
        batchApprovalContract = await BatchApproval.new(ace.address, {from: alice.address});
        expect(await batchApprovalContract.owner()).to.equal(alice.address);    
    });

    it('owner of the contract should be able to mint notes that are owned by the contract', async () => {
        const { values, notes } = await mintNotes([50,75,100], alice.publicKey, batchApprovalContract.address);
        for (let note of notes) {
            let aceNote = await ace.getNote(zkAssetMintableContract.address, note.noteHash);
            expect(aceNote).to.not.equal(undefined);
            expect(aceNote.noteOwner).to.equal(batchApprovalContract.address);
        }
    });
});
