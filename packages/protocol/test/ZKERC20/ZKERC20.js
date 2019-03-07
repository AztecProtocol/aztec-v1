/* global artifacts, expect, contract, beforeEach, it:true */
// ### External Dependencies
const BN = require('bn.js');
const ethUtil = require('ethereumjs-util');
const { padLeft } = require('web3-utils');
const crypto = require('crypto');


// ### Internal Dependencies
// eslint-disable-next-line object-curly-newline
const { abiEncoder, note, proof, secp256k1, sign } = require('aztec.js');
const { constants: { CRS }, constants } = require('@aztec/dev-utils');

const { outputCoder } = abiEncoder;

// ### Artifacts
const ERC20Mintable = artifacts.require('./contracts/ERC20/ERC20Mintable');
const ACE = artifacts.require('./contracts/ACE/ACE');
const JoinSplit = artifacts.require('./contracts/ACE/validators/joinSplit/JoinSplit');
const JoinSplitInterface = artifacts.require('./contracts/ACE/validators/joinSplit/JoinSplitInterface');
const ZKERC20 = artifacts.require('./contracts/ZKERC20/ZKERC20');
const NoteRegistry = artifacts.require('./contracts/ACE/NoteRegistry');

JoinSplit.abi = JoinSplitInterface.abi;


contract('ZKERC20', (accounts) => {
    describe('success states', () => {
        let aztecAccounts = [];
        let notes = [];
        let ace;
        let erc20;
        let zkerc20;
        let scalingFactor;
        let aztecJoinSplit;
        let noteRegistry;
        let noteRegistryAddress;
        const proofs = [];
        const tokensTransferred = new BN(100000);

        beforeEach(async () => {
            ace = await ACE.new({
                from: accounts[0],
            });
            aztecAccounts = [...new Array(10)].map(() => secp256k1.generateAccount());
            notes = [
                ...aztecAccounts.map(({ publicKey }, i) => note.create(publicKey, i * 10)),
                ...aztecAccounts.map(({ publicKey }, i) => note.create(publicKey, i * 10)),
            ];
            await ace.setCommonReferenceString(CRS);
            aztecJoinSplit = await JoinSplit.new();
            await ace.setProof(1, aztecJoinSplit.address, true);

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
                publicOwner: accounts[2],
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

            const proofOutputs = proofs.map(({ expectedOutput }) => {
                return outputCoder.getProofOutput(expectedOutput, 0);
            });
            const proofHashes = proofOutputs.map((proofOutput) => {
                return outputCoder.hashProofOutput(proofOutput);
            });

            erc20 = await ERC20Mintable.new();
            zkerc20 = await ZKERC20.new(
                'Cocoa',
                false,
                false,
                true,
                10,
                erc20.address,
                ace.address
            );

            noteRegistryAddress = await zkerc20.noteRegistry();
            noteRegistry = await NoteRegistry.at(noteRegistryAddress);
            scalingFactor = new BN(10);
            await Promise.all(accounts.map(account => erc20.mint(
                account,
                scalingFactor.mul(tokensTransferred),
                { from: accounts[0], gas: 4700000 }
            )));
            await Promise.all(accounts.map(account => erc20.approve(
                noteRegistryAddress,
                scalingFactor.mul(tokensTransferred),
                { from: account, gas: 4700000 }
            )));
            // approving tokens
            await noteRegistry.publicApprove(
                proofHashes[0],
                10,
                { from: accounts[0] }
            );
            await noteRegistry.publicApprove(
                proofHashes[1],
                40,
                { from: accounts[1] }
            );
            await noteRegistry.publicApprove(
                proofHashes[2],
                130,
                { from: accounts[2] }
            );
            await noteRegistry.publicApprove(
                proofHashes[4],
                30,
                { from: accounts[3] }
            );
        });

        it('will can update a note registry with output notes', async () => {
            // const { receipt } = await ace.validateProof(1, accounts[0], proofs[0].proofData);
            const { receipt } = await zkerc20.confidentialTransfer(proofs[0].proofData);
            // console.log(proofs[0].proofData);
            expect(receipt.status).to.equal(true);
        });

        it('can update a note registry by consuming input notes, with kPublic negative', async () => {
            await zkerc20.confidentialTransfer(proofs[0].proofData);
            const { receipt } = await zkerc20.confidentialTransfer(proofs[1].proofData);
            expect(receipt.status).to.equal(true);
        });

        it('can update a note registry by consuming input notes, with kPublic positive', async () => {
            await zkerc20.confidentialTransfer(proofs[2].proofData);
            const { receipt } = await zkerc20.confidentialTransfer(proofs[3].proofData);
            expect(receipt.status).to.equal(true);
        });

        it('can update a note registry with kPublic = 0', async () => {
            await zkerc20.confidentialTransfer(proofs[4].proofData);
            const { receipt } = await zkerc20.confidentialTransfer(proofs[5].proofData);
            expect(receipt.status).to.equal(true);
        });

        it.only('can successfully call confidential approve', async () => {
            const domainParams = sign.generateAZTECDomainParams(aztecJoinSplit.address, constants.ACE_DOMAIN_PARAMS);
            const { privateKey } = aztecAccounts.slice(0, 1)[0];

            const spender = aztecJoinSplit.address;
            const status = true;
            const noteHash = `0x${padLeft((ethUtil.keccak256(notes.slice(0, 1))).toString('hex'), 64)}`;

            const message = {
                noteHash,
                spender,
                status,
            };


            const schema = constants.NOTE_SIGNATURE;

            const { signature } = sign.signStructuredData(domainParams, schema, message, privateKey);

            // const v = signature[0].slice(signature[0].length - 2);
            // console.log('v: ', v);
            // process.exit(0);
            const v = `${padLeft((signature[0].slice(2)).toString('hex'), 64)}`;


            const r = `${padLeft((signature[1].slice(2)).toString('hex'), 64)}`;

            console.log('r: ', r);
            const s = `${padLeft((signature[2].slice(2)).toString('hex'), 64)}`;

            /*
            Beware: The LibEIP712.sol smart contract which .confidentialApprove() relies on expects 
            the ECDSA parameters (v, r and s) in a different order to which the Javascript 
            ECDSA signing function outputs them. Hence, need to rearrange order
            */

            const singleArraySignature = r.concat(s, v);
            console.log('signature input: ', singleArraySignature);

            const { receipt } = await zkerc20.confidentialApprove(noteHash, spender, status, `0x${singleArraySignature}`);
            console.log('receipt: ', receipt);
            expect(receipt.status).to.equal(true);
        });
    });
});
