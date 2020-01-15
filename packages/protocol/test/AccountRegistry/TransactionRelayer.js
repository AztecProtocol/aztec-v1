/* global artifacts, contract, expect */
const aztec = require('aztec.js');
const secp256k1 = require('@aztec/secp256k1');
const { randomHex } = require('web3-utils');

const ACE = artifacts.require('./ACE');
const ERC20Mintable = artifacts.require('ERC20Mintable');
const ZkAsset = artifacts.require('ZkAssetOwnable');
const TestAccountMapping = artifacts.require('./test/TestAccountMapping');

const { JoinSplitProof, ProofUtils } = aztec;

contract.only('TransactionRelayer', (accounts) => {
    const [senderAddress, userAddress, anotherUserAddress] = accounts;
    const stranger = secp256k1.generateAccount();
    const initialAmount = 100;
    let ace;
    let erc20;
    let zkAsset;
    let relayer;

    const generateOutputNotes = async (values, owner = stranger) =>
        Promise.all(values.map(async (value) => aztec.note.create(owner.publicKey, value)));

    const generateDepositProofData = async ({ outputNoteValues = [20, 30], owner = stranger.publicKey } = {}) => {
        const inputNotes = [];
        const outputNotes = await generateOutputNotes(outputNoteValues, owner);

        const publicValue = ProofUtils.getPublicValue([], outputNoteValues);

        const depositAmount = outputNoteValues.reduce((accum, val) => accum + val, 0);

        return {
            inputNotes,
            outputNotes,
            publicValue,
            depositAmount,
        };
    };

    beforeEach(async () => {
        ace = await ACE.deployed();
        erc20 = await ERC20Mintable.new({ from: senderAddress });
        await erc20.mint(userAddress, initialAmount, { from: senderAddress });
        await erc20.mint(anotherUserAddress, initialAmount, { from: senderAddress });
        await erc20.mint(stranger.address, initialAmount, { from: senderAddress });

        zkAsset = await ZkAsset.new(ace.address, erc20.address, 1, {
            from: senderAddress,
        });

        const trustedGSNSignerAddress = randomHex(20);
        relayer = await TestAccountMapping.new(ace.address, trustedGSNSignerAddress);
    });

    it('should deposit to ZkAsset on user behalf', async () => {
        const { inputNotes, outputNotes, publicValue, depositAmount } = await generateDepositProofData({
            owner: {
                address: userAddress,
                publicKey: stranger.publicKey,
            },
        });

        const depositProof = new JoinSplitProof(inputNotes, outputNotes, relayer.address, publicValue, relayer.address);

        await erc20.approve(relayer.address, depositAmount, { from: userAddress });

        await erc20.approve(relayer.address, depositAmount, { from: anotherUserAddress });

        expect((await erc20.balanceOf(userAddress)).toNumber()).to.equal(initialAmount);
        expect((await erc20.balanceOf(anotherUserAddress)).toNumber()).to.equal(initialAmount);
        expect((await erc20.balanceOf(relayer.address)).toNumber()).to.equal(0);
        expect((await erc20.balanceOf(ace.address)).toNumber()).to.equal(0);

        const proofData = depositProof.encodeABI(zkAsset.address);
        const proofHash = depositProof.hash;
        await relayer.deposit(zkAsset.address, userAddress, proofHash, proofData, depositAmount, { from: userAddress });

        expect((await erc20.balanceOf(userAddress)).toNumber()).to.equal(initialAmount - depositAmount);
        expect((await erc20.balanceOf(anotherUserAddress)).toNumber()).to.equal(initialAmount);
        expect((await erc20.balanceOf(relayer.address)).toNumber()).to.equal(0);
        expect((await erc20.balanceOf(ace.address)).toNumber()).to.equal(depositAmount);

        await Promise.all(
            outputNotes.map(async (note) => {
                const { status, noteOwner } = await ace.getNote(zkAsset.address, note.noteHash);
                expect(status.toNumber()).to.equal(1);
                expect(noteOwner).to.equal(userAddress);
            }),
        );
    });

    it.only('should allow to deposit notes belonging to another user', async () => {
        console.log('starting second test')
        const { inputNotes, outputNotes, publicValue, depositAmount } = await generateDepositProofData({
            owner: {
                address: anotherUserAddress,
                publicKey: stranger.publicKey,
            },
        });

        console.log('generated deposit proof data')

        const depositProof = new JoinSplitProof(inputNotes, outputNotes, relayer.address, publicValue, relayer.address);

        await erc20.approve(relayer.address, depositAmount, { from: userAddress });

        await erc20.approve(relayer.address, depositAmount, { from: anotherUserAddress });

        expect((await erc20.balanceOf(userAddress)).toNumber()).to.equal(initialAmount);
        expect((await erc20.balanceOf(anotherUserAddress)).toNumber()).to.equal(initialAmount);
        expect((await erc20.balanceOf(relayer.address)).toNumber()).to.equal(0);
        expect((await erc20.balanceOf(ace.address)).toNumber()).to.equal(0);
        console.log('done first set of expects')

        const proofData = depositProof.encodeABI(zkAsset.address);
        const proofHash = depositProof.hash;
        await relayer.deposit(zkAsset.address, userAddress, proofHash, proofData, depositAmount, { from: userAddress });

        expect((await erc20.balanceOf(userAddress)).toNumber()).to.equal(initialAmount - depositAmount);
        expect((await erc20.balanceOf(anotherUserAddress)).toNumber()).to.equal(initialAmount);
        expect((await erc20.balanceOf(relayer.address)).toNumber()).to.equal(0);
        expect((await erc20.balanceOf(ace.address)).toNumber()).to.equal(depositAmount);
        console.log('second set of expects')

        await Promise.all(
            outputNotes.map(async (note) => {
                const { status, noteOwner } = await ace.getNote(zkAsset.address, note.noteHash);
                expect(status.toNumber()).to.equal(1);
                expect(noteOwner).to.equal(anotherUserAddress);
            }),
        );
        console.log('note tests')
    });

    it('should not deposit from other user account', async () => {
        const { inputNotes, outputNotes, publicValue, depositAmount } = await generateDepositProofData({
            owner: {
                address: userAddress,
                publicKey: stranger.publicKey,
            },
        });

        const depositProof = new JoinSplitProof(inputNotes, outputNotes, relayer.address, publicValue, relayer.address);

        await erc20.approve(relayer.address, depositAmount, { from: userAddress });

        await erc20.approve(relayer.address, depositAmount, { from: anotherUserAddress });

        expect((await erc20.balanceOf(userAddress)).toNumber()).to.equal(initialAmount);
        expect((await erc20.balanceOf(anotherUserAddress)).toNumber()).to.equal(initialAmount);
        expect((await erc20.balanceOf(relayer.address)).toNumber()).to.equal(0);
        expect((await erc20.balanceOf(ace.address)).toNumber()).to.equal(0);

        const proofData = depositProof.encodeABI(zkAsset.address);
        const proofHash = depositProof.hash;

        let error;
        try {
            await relayer.deposit(zkAsset.address, anotherUserAddress, proofHash, proofData, depositAmount, {
                from: userAddress,
            });
        } catch (e) {
            error = e;
        }

        expect(error.toString()).to.equal('Sender has no permission to deposit on owner behalf');

        expect((await erc20.balanceOf(userAddress)).toNumber()).to.equal(initialAmount);
        expect((await erc20.balanceOf(anotherUserAddress)).toNumber()).to.equal(initialAmount);
        expect((await erc20.balanceOf(relayer.address)).toNumber()).to.equal(0);
        expect((await erc20.balanceOf(ace.address)).toNumber()).to.equal(0);
    });

    it('should not affect user balance if proof is invalid', async () => {
        const { inputNotes, outputNotes, publicValue, depositAmount } = await generateDepositProofData({
            owner: {
                address: userAddress,
                publicKey: stranger.publicKey,
            },
        });

        const depositProof = new JoinSplitProof(inputNotes, outputNotes, relayer.address, publicValue, relayer.address);

        const wrongSenderProof = new JoinSplitProof(inputNotes, outputNotes, relayer.address, publicValue, userAddress);

        const wrongOwnerProof = new JoinSplitProof(inputNotes, outputNotes, userAddress, publicValue, relayer.address);

        const extraOutputNotes = await generateOutputNotes([10]);
        const moreOutputNotes = [...outputNotes, ...extraOutputNotes];
        const morePublicValue = ProofUtils.getPublicValue(
            [],
            moreOutputNotes.map((note) => note.k),
        );
        const moreValueProof = new JoinSplitProof(inputNotes, moreOutputNotes, relayer.address, morePublicValue, relayer.address);

        await erc20.approve(relayer.address, depositAmount, { from: userAddress });

        expect((await erc20.balanceOf(userAddress)).toNumber()).to.equal(initialAmount);
        expect((await erc20.balanceOf(relayer.address)).toNumber()).to.equal(0);
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
                    await relayer.deposit(zkAsset.address, proofHash, proofData, depositAmount, { from: userAddress });
                } catch (e) {
                    error = e;
                }
                expect(error).to.not.equal(null);
            });
            return transactions.concat(moreTransactions);
        }, []);

        await Promise.all(failedTransactions);

        expect((await erc20.balanceOf(userAddress)).toNumber()).to.equal(initialAmount);
        expect((await erc20.balanceOf(relayer.address)).toNumber()).to.equal(0);
        expect((await erc20.balanceOf(ace.address)).toNumber()).to.equal(0);

        const [note] = outputNotes;
        let noNoteError = null;
        try {
            await ace.getNote(zkAsset.address, note.noteHash);
        } catch (e) {
            noNoteError = e;
        }
        expect(noNoteError).to.not.equal(null);
    });

    it('should send deposit using the owner alias address', async () => {
        const { inputNotes, outputNotes, publicValue, depositAmount } = await generateDepositProofData({
            owner: {
                address: userAddress,
                publicKey: stranger.publicKey,
            },
        });

        const depositProof = new JoinSplitProof(inputNotes, outputNotes, relayer.address, publicValue, relayer.address);

        await erc20.approve(relayer.address, depositAmount, { from: userAddress });

        await erc20.approve(relayer.address, depositAmount, { from: anotherUserAddress });

        expect((await erc20.balanceOf(userAddress)).toNumber()).to.equal(initialAmount);
        expect((await erc20.balanceOf(anotherUserAddress)).toNumber()).to.equal(initialAmount);
        expect((await erc20.balanceOf(relayer.address)).toNumber()).to.equal(0);
        expect((await erc20.balanceOf(ace.address)).toNumber()).to.equal(0);

        const proofData = depositProof.encodeABI(zkAsset.address);
        const proofHash = depositProof.hash;

        const depositParams = [zkAsset.address, userAddress, proofHash, proofData, depositAmount];

        let error;
        try {
            await relayer.deposit(...depositParams, { from: anotherUserAddress });
        } catch (e) {
            error = e;
        }

        expect(error.toString()).to.equal('Sender has no permission to deposit on owner behalf');
        expect((await erc20.balanceOf(userAddress)).toNumber()).to.equal(initialAmount);

        await relayer.setAccountAliasMapping(userAddress, anotherUserAddress);

        await relayer.deposit(...depositParams, { from: anotherUserAddress });

        expect((await erc20.balanceOf(userAddress)).toNumber()).to.equal(initialAmount - depositAmount);
        expect((await erc20.balanceOf(anotherUserAddress)).toNumber()).to.equal(initialAmount);
        expect((await erc20.balanceOf(relayer.address)).toNumber()).to.equal(0);
        expect((await erc20.balanceOf(ace.address)).toNumber()).to.equal(depositAmount);

        const [note] = outputNotes;
        const { status, noteOwner } = await ace.getNote(zkAsset.address, note.noteHash);
        expect(status.toNumber()).to.equal(1);
        expect(noteOwner).to.equal(userAddress);
    });

    it('should deposit notes belonging to non-owner when sending the transaction using the owner alias address', async () => {
        const { inputNotes, outputNotes, publicValue, depositAmount } = await generateDepositProofData({
            owner: {
                address: anotherUserAddress,
                publicKey: stranger.publicKey,
            },
        });

        const depositProof = new JoinSplitProof(inputNotes, outputNotes, relayer.address, publicValue, relayer.address);

        await erc20.approve(relayer.address, depositAmount, { from: userAddress });

        await erc20.approve(relayer.address, depositAmount, { from: anotherUserAddress });

        expect((await erc20.balanceOf(userAddress)).toNumber()).to.equal(initialAmount);
        expect((await erc20.balanceOf(anotherUserAddress)).toNumber()).to.equal(initialAmount);
        expect((await erc20.balanceOf(relayer.address)).toNumber()).to.equal(0);
        expect((await erc20.balanceOf(ace.address)).toNumber()).to.equal(0);

        const proofData = depositProof.encodeABI(zkAsset.address);
        const proofHash = depositProof.hash;

        const depositParams = [zkAsset.address, userAddress, proofHash, proofData, depositAmount];

        await relayer.setAccountAliasMapping(userAddress, anotherUserAddress);

        let error;
        try {
            await relayer.deposit(...depositParams, { from: anotherUserAddress });
        } catch (e) {
            error = e;
        }

        expect(error.toString()).to.equal('Cannot deposit note to other account if sender is not the same as owner');
        expect((await erc20.balanceOf(userAddress)).toNumber()).to.equal(initialAmount);
        expect((await erc20.balanceOf(anotherUserAddress)).toNumber()).to.equal(initialAmount);
        expect((await erc20.balanceOf(relayer.address)).toNumber()).to.equal(0);
        expect((await erc20.balanceOf(ace.address)).toNumber()).to.equal(0);
    });
});
