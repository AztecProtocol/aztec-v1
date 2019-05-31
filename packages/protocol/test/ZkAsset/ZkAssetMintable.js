/* global artifacts, expect, contract, beforeEach, it:true */
// ### External Dependencies
const BN = require('bn.js');
const truffleAssert = require('truffle-assertions');

// ### Internal Dependencies
// eslint-disable-next-line object-curly-newline
const { note, proof, secp256k1, sign, abiEncoder } = require('aztec.js');
const { constants, proofs: { MINT_PROOF, JOIN_SPLIT_PROOF } } = require('@aztec/dev-utils');

// ### Artifacts
const ERC20Mintable = artifacts.require('./contracts/ERC20/ERC20Mintable');
const ACE = artifacts.require('./contracts/ACE/ACE');
const AdjustSupply = artifacts.require('./contracts/ACE/validators/AdjustSupply');
const AdjustSupplyInterface = artifacts.require('./contracts/ACE/validators/AdjustSupplyInterface');
const JoinSplit = artifacts.require('./contracts/ACE/validators/JoinSplit');
const JoinSplitInterface = artifacts.require('./contracts/ACE/validators/JoinSplit');

const ZkAssetMintable = artifacts.require('./contracts/ZkAsset/ZkAssetMintable');


AdjustSupply.abi = AdjustSupplyInterface.abi;
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


contract.only('ZkAssetMintable', (accounts) => {
    describe('success states', () => {
        let aztecAccounts = [];
        let ace;
        let erc20;
        let zkAssetMintable;
        let scalingFactor;
        let aztecAdjustSupply;
        let aztecJoinSplit;
        const kPublic = 50;

        beforeEach(async () => {
            ace = await ACE.new({ from: accounts[0] });
            aztecAdjustSupply = await AdjustSupply.new();
            aztecJoinSplit = await JoinSplit.new();

            aztecAccounts = [...new Array(4)].map(() => secp256k1.generateAccount());

            await ace.setCommonReferenceString(constants.CRS);
            await ace.setProof(MINT_PROOF, aztecAdjustSupply.address);
            await ace.setProof(JOIN_SPLIT_PROOF, aztecJoinSplit.address);

            const canAdjustSupply = true;
            const canConvert = true;

            erc20 = await ERC20Mintable.new();
            scalingFactor = new BN(10);

            zkAssetMintable = await ZkAssetMintable.new(
                ace.address,
                erc20.address,
                scalingFactor,
                canAdjustSupply,
                canConvert,
                { from: accounts[0] }
            );
        });

        it('should complete a mint operation', async () => {
            const [owner, recipient1, recipient2] = aztecAccounts;
            const newTotalMinted = note
                .create(owner.publicKey, 50);
            const oldTotalMinted = note
                .createZeroValueNote();

            const mintedNotes = [
                note.create(recipient1.publicKey, 20),
                note.create(recipient2.publicKey, 30),
            ];

            const mintProof = proof.mint
                .encodeMintTransaction({
                    newTotalMinted, // 50
                    oldTotalMinted, // 0
                    adjustedNotes: mintedNotes, // 30 + 20
                    senderAddress: zkAssetMintable.address,
                });

            const { receipt } = await zkAssetMintable
                .confidentialMint(MINT_PROOF, mintProof.proofData);

            expect(receipt.status).to.equal(true);
        });

        it('should transfer minted value out of the note registry', async () => {
            const erc20TotalSupply = (await erc20.totalSupply()).toNumber();
            expect(erc20TotalSupply).to.equal(0);
            const initialBalance = (await erc20.balanceOf(accounts[1])).toNumber();
            const [owner, recipient1, recipient2] = aztecAccounts;
            const newTotalMinted = note
                .create(owner.publicKey, 50);
            const oldTotalMinted = note
                .createZeroValueNote();

            const mintedNotes = [
                note.create(recipient1.publicKey, 20),
                note.create(recipient2.publicKey, 30),
            ];

            const mintProof = proof.mint
                .encodeMintTransaction({
                    newTotalMinted, // 50
                    oldTotalMinted, // 0
                    adjustedNotes: mintedNotes, // 30 + 20
                    senderAddress: zkAssetMintable.address,
                });

            const { receipt: mintReceipt } = await zkAssetMintable
                .confidentialMint(MINT_PROOF, mintProof.proofData);

            expect(mintReceipt.status).to.equal(true);
            const erc20TotalSupplyAfterMint = (await erc20.totalSupply()).toNumber();
            expect(erc20TotalSupplyAfterMint).to.equal(0);

            const withdrawalProof = proof.joinSplit
                .encodeJoinSplitTransaction({
                    inputNotes: mintedNotes, // 20 + 30
                    outputNotes: [],
                    senderAddress: accounts[0],
                    inputNoteOwners: [recipient1, recipient2], // need the owners of the adjustedNotes
                    publicOwner: recipient1.address,
                    kPublic,
                    validatorAddress: aztecJoinSplit.address,
                });

            const { receipt: transferReceipt } = await zkAssetMintable
                .confidentialTransfer(withdrawalProof.proofData);

            const erc20TotalSupplyAfterWithdrawal = (await erc20.totalSupply()).toNumber();
            expect(erc20TotalSupplyAfterWithdrawal).to.equal(kPublic * scalingFactor);
            const finalBalance = (await erc20.balanceOf(recipient1.address)).toNumber();
            expect(transferReceipt.status).to.equal(true);
            expect(initialBalance).to.equal(0);
            expect(finalBalance).to.equal(kPublic * scalingFactor);
        });


        it.only('should perform mint using confidentialTransferFrom()', async () => {
            const [owner, recipient1, recipient2] = aztecAccounts;
            const inputNoteOwners = [recipient1, recipient2];
            const delegateAddresss = accounts[2];

            const erc20TotalSupply = (await erc20.totalSupply()).toNumber();
            const initialAceBalance = (await erc20.balanceOf(ace.address)).toNumber();
            const initialRecipientBalance = (await erc20.balanceOf(accounts[1])).toNumber();
            expect(initialAceBalance).to.equal(0);
            expect(erc20TotalSupply).to.equal(0);
            expect(initialRecipientBalance).to.equal(0);


            const newTotalMinted = note
                .create(owner.publicKey, 50);
            const oldTotalMinted = note
                .createZeroValueNote();

            const mintedNotes = [
                note.create(recipient1.publicKey, 20),
                note.create(recipient2.publicKey, 30),
            ];

            const mintProof = proof.mint
                .encodeMintTransaction({
                    newTotalMinted, // 50
                    oldTotalMinted, // 0
                    adjustedNotes: mintedNotes, // 30 + 20
                    senderAddress: zkAssetMintable.address,
                });

            const { receipt: mintReceipt } = await zkAssetMintable
                .confidentialMint(MINT_PROOF, mintProof.proofData);

            expect(mintReceipt.status).to.equal(true);
            const erc20TotalSupplyAfterMint = (await erc20.totalSupply()).toNumber();
            expect(erc20TotalSupplyAfterMint).to.equal(0);

            // call confidentialApprove()
            const indexes = [0, 1];
            await Promise.all(indexes.map((i) => {
                const { signature } = signNote(
                    zkAssetMintable.address,
                    mintedNotes[i].noteHash,
                    delegateAddresss,
                    inputNoteOwners[i].privateKey
                );
                const concatenatedSignature = signature[0] + signature[1].slice(2) + signature[2].slice(2);
                // eslint-disable-next-line no-await-in-loop
                return zkAssetMintable.confidentialApprove(
                    mintedNotes[i].noteHash,
                    delegateAddresss,
                    true,
                    concatenatedSignature
                );
            }));

            // create a proof, that withdraws more tokens than the ACE contract holds
            const withdrawalProof = proof.joinSplit
                .encodeJoinSplitTransaction({
                    inputNotes: mintedNotes, // 20 + 30
                    outputNotes: [],
                    senderAddress: delegateAddresss,
                    inputNoteOwners: [recipient1, recipient2],
                    publicOwner: recipient1.address,
                    kPublic, // 50
                    validatorAddress: aztecJoinSplit.address,
                });

            await ace.validateProof(JOIN_SPLIT_PROOF, accounts[2], withdrawalProof.proofData, { from: delegateAddresss });

            const withdrawalProofOutput = abiEncoder.outputCoder.getProofOutput(withdrawalProof.expectedOutput, 0);
            const formattedProofOutput = `0x${withdrawalProofOutput.slice(0x40)}`;
            const { receipt: transferReceipt } = await zkAssetMintable.confidentialTransferFrom(JOIN_SPLIT_PROOF, formattedProofOutput, { from: delegateAddresss });
            expect(transferReceipt.status).to.equal(true);

            const erc20TotalSupplyAfterWithdrawal = (await erc20.totalSupply()).toNumber();
            const finalRecipientBalance = (await erc20.balanceOf(recipient1.address)).toNumber();
            const finalAceBalance = (await erc20.balanceOf(ace.address)).toNumber();
            expect(erc20TotalSupplyAfterWithdrawal).to.equal(kPublic * scalingFactor);
            expect(finalRecipientBalance).to.equal(kPublic * scalingFactor);
            expect(finalAceBalance).to.equal(0);
        });

        it.only('should not perform mint if ACE has sufficient number of tokens when using confidentialTransferFrom()', async () => {
            const [recipient1, recipient2] = aztecAccounts;
            const inputNoteOwners = [recipient1, recipient2];
            const delegateAddresss = accounts[2];
            const totalTransfer = (scalingFactor.mul(new BN(kPublic))).toNumber();

            await erc20.mint(accounts[0], (scalingFactor.mul(new BN(kPublic))), { from: accounts[0] });

            const erc20TotalSupply = (await erc20.totalSupply()).toNumber();
            expect(erc20TotalSupply).to.equal(totalTransfer);
            const initialAceBalance = (await erc20.balanceOf(ace.address)).toNumber();
            expect(initialAceBalance).to.equal(0);
            const initialSenderBalance = (await erc20.balanceOf(accounts[0])).toNumber();
            expect(initialSenderBalance).to.equal(totalTransfer);
            const initialRecipientBalance = (await erc20.balanceOf(recipient1.address)).toNumber();
            expect(initialRecipientBalance).to.equal(0);


            const outputNotes = [
                note.create(recipient1.publicKey, 20),
                note.create(recipient2.publicKey, 30),
            ];

            const depositProof = proof.joinSplit
                .encodeJoinSplitTransaction({
                    inputNotes: [],
                    outputNotes,
                    senderAddress: accounts[0],
                    inputNoteOwners: [],
                    publicOwner: accounts[0],
                    kPublic: kPublic * -1, // 50
                    validatorAddress: aztecJoinSplit.address,
                });
            const depositProofOutput = abiEncoder.outputCoder.getProofOutput(depositProof.expectedOutput, 0);
            const depositProofHash = abiEncoder.outputCoder.hashProofOutput(depositProofOutput);

            await ace.publicApprove(
                zkAssetMintable.address,
                depositProofHash,
                kPublic,
                { from: accounts[0] }
            );

            await erc20.approve(
                ace.address,
                scalingFactor.mul(new BN(kPublic)),
                { from: accounts[0] }
            );

            const { receipt: depositReceipt } = await zkAssetMintable
                .confidentialTransfer(depositProof.proofData);
            expect(depositReceipt.status).to.equal(true);

            const intermediateAceBalance = (await erc20.balanceOf(ace.address)).toNumber();
            expect(intermediateAceBalance).to.equal(totalTransfer);

            const erc20TotalSupplyAfterMint = (await erc20.totalSupply()).toNumber();
            expect(erc20TotalSupplyAfterMint).to.equal(totalTransfer);

            // call confidentialApprove()
            const indexes = [0, 1];
            await Promise.all(indexes.map((i) => {
                const { signature } = signNote(
                    zkAssetMintable.address,
                    outputNotes[i].noteHash,
                    delegateAddresss,
                    inputNoteOwners[i].privateKey
                );
                const concatenatedSignature = signature[0] + signature[1].slice(2) + signature[2].slice(2);
                // eslint-disable-next-line no-await-in-loop
                return zkAssetMintable.confidentialApprove(
                    outputNotes[i].noteHash,
                    delegateAddresss,
                    true,
                    concatenatedSignature
                );
            }));


            // withdraw same number of tokens as held by ACE
            const withdrawalProof = proof.joinSplit
                .encodeJoinSplitTransaction({
                    inputNotes: outputNotes, // 20 + 30
                    outputNotes: [],
                    senderAddress: delegateAddresss,
                    inputNoteOwners: [recipient1, recipient2],
                    publicOwner: recipient1.address,
                    kPublic, // 50
                    validatorAddress: aztecJoinSplit.address,
                });

            await ace.validateProof(JOIN_SPLIT_PROOF, delegateAddresss, withdrawalProof.proofData, { from: delegateAddresss });
            const withdrawalProofOutput = abiEncoder.outputCoder.getProofOutput(withdrawalProof.expectedOutput, 0);
            const formattedProofOutput = `0x${withdrawalProofOutput.slice(0x40)}`;
            const { receipt: transferReceipt } = await zkAssetMintable.confidentialTransferFrom(JOIN_SPLIT_PROOF, formattedProofOutput, { from: delegateAddresss });
            expect(transferReceipt.status).to.equal(true);

            // Key check that checks total minted, and checks that ACE has not minted
            // more than the inital transfer of tokens to the ACE
            const erc20TotalSupplyAfterWithdrawal = (await erc20.totalSupply()).toNumber();
            expect(erc20TotalSupplyAfterWithdrawal).to.equal(totalTransfer);

            const finalSenderBalance = (await erc20.balanceOf(accounts[0])).toNumber();
            expect(finalSenderBalance).to.equal(0);

            const finalRecipientBalance = (await erc20.balanceOf(recipient1.address)).toNumber();
            expect(finalRecipientBalance).to.equal(totalTransfer);

            const finalAceBalance = (await erc20.balanceOf(ace.address)).toNumber();
            expect(finalAceBalance).to.equal(0);
        });
    });

    describe('failure states', () => {
        let ace;
        let erc20;
        let zkAssetMintable;
        let scalingFactor;
        let aztecAdjustSupply;
        let aztecJoinSplit;

        beforeEach(async () => {
            ace = await ACE.new({ from: accounts[0] });
            aztecAdjustSupply = await AdjustSupply.new();
            aztecJoinSplit = await JoinSplit.new();

            await ace.setCommonReferenceString(constants.CRS);
            await ace.setProof(MINT_PROOF, aztecAdjustSupply.address);
            await ace.setProof(JOIN_SPLIT_PROOF, aztecJoinSplit.address);

            erc20 = await ERC20Mintable.new();
            scalingFactor = new BN(1);
        });

        it('validate failure if msg.sender is not owner', async () => {
            const proofs = [];
            const canAdjustSupply = true;
            const canConvert = true;

            const aztecAccounts = [...new Array(4)].map(() => secp256k1.generateAccount());
            const noteValues = [50, 0, 30, 20]; // note we do not use this third note, we create fixed one
            const notes = aztecAccounts.map(({ publicKey }, i) => {
                return note.create(publicKey, noteValues[i]);
            });

            zkAssetMintable = await ZkAssetMintable.new(
                ace.address,
                erc20.address,
                scalingFactor,
                canAdjustSupply,
                canConvert,
                { from: accounts[0] }
            );

            const newTotalMinted = notes[0];
            const oldTotalMinted = note.createZeroValueNote();
            const adjustedNotes = notes.slice(2, 4);

            // Minting two AZTEC notes, worth 30 and 20
            proofs[0] = proof.mint.encodeMintTransaction({
                newTotalMinted,
                oldTotalMinted,
                adjustedNotes,
                senderAddress: accounts[0],
            });

            await truffleAssert.reverts(zkAssetMintable.confidentialMint(MINT_PROOF, proofs[0].proofData, { from: accounts[1] }),
                'only the owner can call the confidentialMint() method');
        });

        it('validate failure if ace.mint throws', async () => {
            // ace.mint will throw if total inputs != total outputs in the mint proof
            const proofs = [];
            const canAdjustSupply = true;
            const canConvert = true;

            const aztecAccounts = [...new Array(4)].map(() => secp256k1.generateAccount());

            // total inputs != total outputs - ace.mint will throw
            const noteValues = [50, 0, 30, 30];
            const notes = aztecAccounts.map(({ publicKey }, i) => {
                return note.create(publicKey, noteValues[i]);
            });

            zkAssetMintable = await ZkAssetMintable.new(
                ace.address,
                erc20.address,
                scalingFactor,
                canAdjustSupply,
                canConvert,
                { from: accounts[0] }
            );

            const newTotalMinted = notes[0];
            const oldTotalMinted = note.createZeroValueNote();
            const adjustedNotes = notes.slice(2, 4);


            // Minting two AZTEC notes, worth 30 and 30
            proofs[0] = proof.mint.encodeMintTransaction({
                newTotalMinted,
                oldTotalMinted,
                adjustedNotes,
                senderAddress: zkAssetMintable.address,
            });
            await truffleAssert.reverts(zkAssetMintable.confidentialMint(MINT_PROOF, proofs[0].proofData));
        });

        it('validates failure if mint attempted when flag set to false', async () => {
            const proofs = [];
            const canAdjustSupply = false;
            const canConvert = true;

            const aztecAccounts = [...new Array(4)].map(() => secp256k1.generateAccount());
            const noteValues = [50, 0, 30, 20]; // note we do not use this third note, we create fixed one
            const notes = aztecAccounts.map(({ publicKey }, i) => {
                return note.create(publicKey, noteValues[i]);
            });

            zkAssetMintable = await ZkAssetMintable.new(
                ace.address,
                erc20.address,
                scalingFactor,
                canAdjustSupply,
                canConvert,
                { from: accounts[0] }
            );

            const newTotalMinted = notes[0];
            const oldTotalMinted = note.createZeroValueNote();
            const adjustedNotes = notes.slice(2, 4);

            // Minting two AZTEC notes, worth 30 and 20
            proofs[0] = proof.mint.encodeMintTransaction({
                newTotalMinted,
                oldTotalMinted,
                adjustedNotes,
                senderAddress: zkAssetMintable.address,
            });

            const publicOwner = accounts[0];
            const inputNoteOwners = aztecAccounts.slice(2, 4);

            proofs[1] = proof.joinSplit.encodeJoinSplitTransaction({
                inputNotes: adjustedNotes,
                outputNotes: [],
                senderAddress: accounts[0],
                inputNoteOwners, // need the owners of the adjustedNotes
                publicOwner,
                kPublic: 50,
                validatorAddress: aztecJoinSplit.address,
            });

            await truffleAssert.reverts(zkAssetMintable.confidentialMint(MINT_PROOF, proofs[0].proofData),
                'this asset is not mintable');
        });
    });
});
