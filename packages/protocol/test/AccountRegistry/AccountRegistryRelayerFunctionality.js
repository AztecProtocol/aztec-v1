/* global artifacts, contract, expect */
const { JoinSplitProof, ProofUtils, signer } = require('aztec.js');
const { proofs } = require('@aztec/dev-utils');
const secp256k1 = require('@aztec/secp256k1');
const truffleAssert = require('truffle-assertions');
const { randomHex } = require('web3-utils');

const ACE = artifacts.require('./ACE');
const ERC20Mintable = artifacts.require('ERC20Mintable');
const ZkAsset = artifacts.require('ZkAssetOwnable');
const TestAccountMapping = artifacts.require('./test/TestAccountMapping');

const { generateOutputNotes, generateDepositProofInputs, getOwnerPrivateKey } = require('../helpers/AccountRegistry');

contract('Account registry - relayer functionality', (accounts) => {
    const [userAddress, anotherUserAddress, senderAddress] = accounts;
    const initialAmount = 100;
    let ace;
    let erc20;
    let zkAsset;
    let registryContract;

    beforeEach(async () => {
        ace = await ACE.deployed();
        erc20 = await ERC20Mintable.new({ from: senderAddress });
        await erc20.mint(userAddress, initialAmount, { from: senderAddress });
        await erc20.mint(anotherUserAddress, initialAmount, { from: senderAddress });

        zkAsset = await ZkAsset.new(ace.address, erc20.address, 1, {
            from: senderAddress,
        });

        const trustedGSNSignerAddress = randomHex(20);
        registryContract = await TestAccountMapping.new(ace.address, trustedGSNSignerAddress);
    });

    it("should deposit to ZkAsset on user's behalf", async () => {
        const { inputNotes, outputNotes, publicValue, depositAmount } = await generateDepositProofInputs();

        const depositProof = new JoinSplitProof(
            inputNotes,
            outputNotes,
            registryContract.address,
            publicValue,
            registryContract.address,
        );

        await erc20.approve(registryContract.address, depositAmount, { from: userAddress });
        await erc20.approve(registryContract.address, depositAmount, { from: anotherUserAddress });

        expect((await erc20.balanceOf(userAddress)).toNumber()).to.equal(initialAmount);
        expect((await erc20.balanceOf(anotherUserAddress)).toNumber()).to.equal(initialAmount);
        expect((await erc20.balanceOf(registryContract.address)).toNumber()).to.equal(0);
        expect((await erc20.balanceOf(ace.address)).toNumber()).to.equal(0);

        const proofData = depositProof.encodeABI(zkAsset.address);
        const proofHash = depositProof.hash;
        await registryContract.deposit(zkAsset.address, userAddress, proofHash, proofData, depositAmount, { from: userAddress });

        expect((await erc20.balanceOf(userAddress)).toNumber()).to.equal(initialAmount - depositAmount);
        expect((await erc20.balanceOf(anotherUserAddress)).toNumber()).to.equal(initialAmount);
        expect((await erc20.balanceOf(registryContract.address)).toNumber()).to.equal(0);
        expect((await erc20.balanceOf(ace.address)).toNumber()).to.equal(depositAmount);

        await Promise.all(
            outputNotes.map(async (individualNote) => {
                const { status, noteOwner } = await ace.getNote(zkAsset.address, individualNote.noteHash);
                expect(status.toNumber()).to.equal(1);
                expect(noteOwner).to.equal(userAddress);
            }),
        );
    });

    it('should allow to deposit notes belonging to another user', async () => {
        const { inputNotes, outputNotes, publicValue, depositAmount } = await generateDepositProofInputs();

        const depositProof = new JoinSplitProof(
            inputNotes,
            outputNotes,
            registryContract.address,
            publicValue,
            registryContract.address,
        );

        await erc20.approve(registryContract.address, depositAmount, { from: userAddress });
        await erc20.approve(registryContract.address, depositAmount, { from: anotherUserAddress });

        expect((await erc20.balanceOf(userAddress)).toNumber()).to.equal(initialAmount);
        expect((await erc20.balanceOf(anotherUserAddress)).toNumber()).to.equal(initialAmount);
        expect((await erc20.balanceOf(registryContract.address)).toNumber()).to.equal(0);
        expect((await erc20.balanceOf(ace.address)).toNumber()).to.equal(0);

        const proofData = depositProof.encodeABI(zkAsset.address);
        const proofHash = depositProof.hash;
        await registryContract.deposit(zkAsset.address, anotherUserAddress, proofHash, proofData, depositAmount, {
            from: anotherUserAddress,
        });

        expect((await erc20.balanceOf(userAddress)).toNumber()).to.equal(initialAmount);
        expect((await erc20.balanceOf(anotherUserAddress)).toNumber()).to.equal(initialAmount - depositAmount);
        expect((await erc20.balanceOf(registryContract.address)).toNumber()).to.equal(0);
        expect((await erc20.balanceOf(ace.address)).toNumber()).to.equal(depositAmount);

        await Promise.all(
            outputNotes.map(async (individualNote) => {
                const { status, noteOwner } = await ace.getNote(zkAsset.address, individualNote.noteHash);
                expect(status.toNumber()).to.equal(1);
                expect(noteOwner).to.equal(userAddress);
            }),
        );
    });

    it("should send deposit using the owner's alias address", async () => {
        const { inputNotes, outputNotes, publicValue, depositAmount } = await generateDepositProofInputs();

        const depositProof = new JoinSplitProof(
            inputNotes,
            outputNotes,
            registryContract.address,
            publicValue,
            registryContract.address,
        );

        await erc20.approve(registryContract.address, depositAmount, { from: userAddress });

        await erc20.approve(registryContract.address, depositAmount, { from: anotherUserAddress });

        expect((await erc20.balanceOf(userAddress)).toNumber()).to.equal(initialAmount);
        expect((await erc20.balanceOf(anotherUserAddress)).toNumber()).to.equal(initialAmount);
        expect((await erc20.balanceOf(registryContract.address)).toNumber()).to.equal(0);
        expect((await erc20.balanceOf(ace.address)).toNumber()).to.equal(0);

        const proofData = depositProof.encodeABI(zkAsset.address);
        const proofHash = depositProof.hash;

        const depositParams = [zkAsset.address, userAddress, proofHash, proofData, depositAmount];

        await truffleAssert.reverts(
            registryContract.deposit(zkAsset.address, anotherUserAddress, proofHash, proofData, depositAmount, {
                from: userAddress,
            }),
            "VM Exception while processing transaction: revert Sender has no permission to deposit on owner's behalf",
        );

        expect((await erc20.balanceOf(userAddress)).toNumber()).to.equal(initialAmount);

        await registryContract.setAccountAliasMapping(userAddress, anotherUserAddress);

        await registryContract.deposit(...depositParams, { from: anotherUserAddress });

        expect((await erc20.balanceOf(userAddress)).toNumber()).to.equal(initialAmount - depositAmount);
        expect((await erc20.balanceOf(anotherUserAddress)).toNumber()).to.equal(initialAmount);
        expect((await erc20.balanceOf(registryContract.address)).toNumber()).to.equal(0);
        expect((await erc20.balanceOf(ace.address)).toNumber()).to.equal(depositAmount);

        const [individualNote] = outputNotes;
        const { status, noteOwner } = await ace.getNote(zkAsset.address, individualNote.noteHash);
        expect(status.toNumber()).to.equal(1);
        expect(noteOwner).to.equal(userAddress);
    });

    it("should not affect user's balance if proof is invalid", async () => {
        const { inputNotes, outputNotes, publicValue, depositAmount } = await generateDepositProofInputs();

        const depositProof = new JoinSplitProof(
            inputNotes,
            outputNotes,
            registryContract.address,
            publicValue,
            registryContract.address,
        );

        const wrongSenderProof = new JoinSplitProof(inputNotes, outputNotes, registryContract.address, publicValue, userAddress);

        const wrongOwnerProof = new JoinSplitProof(inputNotes, outputNotes, userAddress, publicValue, registryContract.address);

        const extraOutputNotes = await generateOutputNotes([10]);
        const moreOutputNotes = [...outputNotes, ...extraOutputNotes];
        const morePublicValue = ProofUtils.getPublicValue(
            [],
            moreOutputNotes.map((individualNote) => individualNote.k),
        );
        const moreValueProof = new JoinSplitProof(
            inputNotes,
            moreOutputNotes,
            registryContract.address,
            morePublicValue,
            registryContract.address,
        );

        await erc20.approve(registryContract.address, depositAmount, { from: userAddress });

        expect((await erc20.balanceOf(userAddress)).toNumber()).to.equal(initialAmount);
        expect((await erc20.balanceOf(registryContract.address)).toNumber()).to.equal(0);
        expect((await erc20.balanceOf(ace.address)).toNumber()).to.equal(0);

        const correctProofHash = depositProof.hash;
        const correctProofData = depositProof.encodeABI(zkAsset.address);

        const failedTransactions = [wrongSenderProof, wrongOwnerProof, moreValueProof].reduce((transactions, invalidProof) => {
            const invalidProofHash = invalidProof.hash;
            const invalidProofData = invalidProof.encodeABI(zkAsset.address);

            const moreTransactions = [
                {
                    proofHash: invalidProofHash,
                    proofData: correctProofData,
                },
                {
                    proofHash: correctProofHash,
                    proofData: invalidProofData,
                },
                {
                    proofHash: invalidProofHash,
                    proofData: invalidProofData,
                },
            ].map(async ({ proofHash, proofData }) => {
                let error = null;
                try {
                    await registryContract.deposit(zkAsset.address, proofHash, proofData, depositAmount, { from: userAddress });
                } catch (e) {
                    error = e;
                }
                expect(error).to.not.equal(null);
            });
            return transactions.concat(moreTransactions);
        }, []);

        await Promise.all(failedTransactions);

        expect((await erc20.balanceOf(userAddress)).toNumber()).to.equal(initialAmount);
        expect((await erc20.balanceOf(registryContract.address)).toNumber()).to.equal(0);
        expect((await erc20.balanceOf(ace.address)).toNumber()).to.equal(0);

        const [individualNote] = outputNotes;
        let noNoteError = null;
        try {
            await ace.getNote(zkAsset.address, individualNote.noteHash);
        } catch (e) {
            noNoteError = e;
        }
        expect(noNoteError).to.not.equal(null);
    });

    it("should not deposit from other user's account", async () => {
        const { inputNotes, outputNotes, publicValue, depositAmount } = await generateDepositProofInputs();

        const depositProof = new JoinSplitProof(
            inputNotes,
            outputNotes,
            registryContract.address,
            publicValue,
            registryContract.address,
        );

        await erc20.approve(registryContract.address, depositAmount, { from: userAddress });

        await erc20.approve(registryContract.address, depositAmount, { from: anotherUserAddress });

        expect((await erc20.balanceOf(userAddress)).toNumber()).to.equal(initialAmount);
        expect((await erc20.balanceOf(anotherUserAddress)).toNumber()).to.equal(initialAmount);
        expect((await erc20.balanceOf(registryContract.address)).toNumber()).to.equal(0);
        expect((await erc20.balanceOf(ace.address)).toNumber()).to.equal(0);

        const proofData = depositProof.encodeABI(zkAsset.address);
        const proofHash = depositProof.hash;

        await truffleAssert.reverts(
            registryContract.deposit(zkAsset.address, anotherUserAddress, proofHash, proofData, depositAmount, {
                from: userAddress,
            }),
            "VM Exception while processing transaction: revert Sender has no permission to deposit on owner's behalf",
        );

        expect((await erc20.balanceOf(userAddress)).toNumber()).to.equal(initialAmount);
        expect((await erc20.balanceOf(anotherUserAddress)).toNumber()).to.equal(initialAmount);
        expect((await erc20.balanceOf(registryContract.address)).toNumber()).to.equal(0);
        expect((await erc20.balanceOf(ace.address)).toNumber()).to.equal(0);
    });

    it("should not deposit notes belonging to non-owner when sending using the owner's alias address", async () => {
        const stranger = secp256k1.generateAccount();
        const { inputNotes, outputNotes, publicValue, depositAmount } = await generateDepositProofInputs({
            publicKey: stranger.publicKey,
        });

        const depositProof = new JoinSplitProof(
            inputNotes,
            outputNotes,
            registryContract.address,
            publicValue,
            registryContract.address,
        );

        await erc20.approve(registryContract.address, depositAmount, { from: userAddress });

        await erc20.approve(registryContract.address, depositAmount, { from: anotherUserAddress });

        expect((await erc20.balanceOf(userAddress)).toNumber()).to.equal(initialAmount);
        expect((await erc20.balanceOf(anotherUserAddress)).toNumber()).to.equal(initialAmount);
        expect((await erc20.balanceOf(registryContract.address)).toNumber()).to.equal(0);
        expect((await erc20.balanceOf(ace.address)).toNumber()).to.equal(0);

        const proofData = depositProof.encodeABI(zkAsset.address);
        const proofHash = depositProof.hash;

        const depositParams = [zkAsset.address, userAddress, proofHash, proofData, depositAmount];

        await registryContract.setAccountAliasMapping(userAddress, anotherUserAddress);

        await truffleAssert.reverts(
            registryContract.deposit(...depositParams, { from: anotherUserAddress }),
            // eslint-disable-next-line max-len
            'VM Exception while processing transaction: revert Cannot deposit note to other account if sender is not the same as owner',
        );

        expect((await erc20.balanceOf(userAddress)).toNumber()).to.equal(initialAmount);
        expect((await erc20.balanceOf(anotherUserAddress)).toNumber()).to.equal(initialAmount);
        expect((await erc20.balanceOf(registryContract.address)).toNumber()).to.equal(0);
        expect((await erc20.balanceOf(ace.address)).toNumber()).to.equal(0);
    });

    it('should allow a delegated address to spend notes in confidentialTransferFrom()', async () => {
        // Perform deposit first to create output notes
        const { inputNotes, outputNotes, publicValue, depositAmount } = await generateDepositProofInputs();
        const publicOwner = registryContract.address;

        const depositProof = new JoinSplitProof(inputNotes, outputNotes, registryContract.address, publicValue, publicOwner);
        await erc20.approve(registryContract.address, depositAmount, { from: userAddress });

        const depositProofData = depositProof.encodeABI(zkAsset.address);
        const depositProofHash = depositProof.hash;
        await registryContract.deposit(zkAsset.address, userAddress, depositProofHash, depositProofData, depositAmount, {
            from: userAddress,
        });

        // Use created output notes in a confidentialTransferFrom() call
        const delegatedAddress = registryContract.address;
        const transferInputNotes = outputNotes;
        const transferOutputNotes = await generateOutputNotes([25, 25]);
        const transferPublicValue = 0;
        const transferPublicOwner = publicOwner;

        const transferProof = new JoinSplitProof(
            transferInputNotes,
            transferOutputNotes,
            delegatedAddress,
            transferPublicValue,
            transferPublicOwner,
        );
        const transferProofData = transferProof.encodeABI(zkAsset.address);
        const delegatedAddressPrivateKey = getOwnerPrivateKey();

        const proofSignature = signer.signApprovalForProof(
            zkAsset.address,
            transferProof.eth.outputs,
            delegatedAddress,
            true,
            delegatedAddressPrivateKey,
        );

        const { receipt } = await registryContract.confidentialTransferFrom(
            proofs.JOIN_SPLIT_PROOF,
            zkAsset.address,
            transferProofData,
            delegatedAddress,
            proofSignature,
        );
        expect(receipt.status).to.equal(true);

        await Promise.all(
            transferOutputNotes.map(async (individualNote) => {
                const { status, noteOwner } = await ace.getNote(zkAsset.address, individualNote.noteHash);
                expect(status.toNumber()).to.equal(1);
                expect(noteOwner).to.equal(userAddress);
            }),
        );
    });

    it('should not allow a non-delegated address to spend notes using confidentialTransferFrom()', async () => {
        // Perform deposit first to create output notes
        const { inputNotes, outputNotes, publicValue, depositAmount } = await generateDepositProofInputs();
        const publicOwner = registryContract.address;

        const depositProof = new JoinSplitProof(inputNotes, outputNotes, registryContract.address, publicValue, publicOwner);
        await erc20.approve(registryContract.address, depositAmount, { from: userAddress });

        const depositProofData = depositProof.encodeABI(zkAsset.address);
        const depositProofHash = depositProof.hash;
        await registryContract.deposit(zkAsset.address, userAddress, depositProofHash, depositProofData, depositAmount, {
            from: userAddress,
        });

        // Use created output notes in a confidentialTransferFrom() call
        const delegatedAddress = registryContract.address;
        const transferInputNotes = outputNotes;
        const transferOutputNotes = await generateOutputNotes([25, 25]);
        const transferPublicValue = 0;
        const transferPublicOwner = publicOwner;

        const transferProof = new JoinSplitProof(
            transferInputNotes,
            transferOutputNotes,
            delegatedAddress,
            transferPublicValue,
            transferPublicOwner,
        );
        const transferProofData = transferProof.encodeABI(zkAsset.address);
        const delegatedAddressPrivateKey = getOwnerPrivateKey();

        const proofSignature = signer.signApprovalForProof(
            zkAsset.address,
            transferProof.eth.outputs,
            delegatedAddress,
            true,
            delegatedAddressPrivateKey,
        );

        const notDelegatedAddress = randomHex(20);
        await truffleAssert.reverts(
            registryContract.confidentialTransferFrom(
                proofs.JOIN_SPLIT_PROOF,
                zkAsset.address,
                transferProofData,
                notDelegatedAddress,
                proofSignature
            ),
            'revert the note owner did not sign this proof',
        );
    });
});
