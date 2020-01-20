import aztec from 'aztec.js';
import secp256k1 from '@aztec/secp256k1';
import {
    accounts,
    contract,
} from '@openzeppelin/test-environment';
import asyncForEach from '~/utils/asyncForEach';
import deployACE from './helpers/deployACE';

const ERC20Mintable = contract.fromArtifact('ERC20Mintable');
const ZkAsset = contract.fromArtifact('ZkAssetOwnable');
const TransactionRelayer = contract.fromArtifact('TransactionRelayerMock');

jest.setTimeout(600000);

const {
    JoinSplitProof,
    ProofUtils,
} = aztec;

describe('TransactionRelayer', () => {
    const [
        senderAddress,
        userAddress,
        anotherUserAddress,
    ] = accounts;
    const stranger = secp256k1.generateAccount();
    const initialAmount = 100;
    let ace;
    let erc20;
    let zkAsset;
    let relayer;

    const generateOutputNotes = async (
        values,
        publicKey = stranger.publicKey,
        ownerAddress = stranger.address,
    ) => Promise.all(
        values.map(async value => aztec.note.create(
            publicKey,
            value,
            null,
            ownerAddress,
        )),
    );

    const generateDepositProofData = async ({
        outputNoteValues = [20, 30],
        publicKey = stranger.publicKey,
        ownerAddress = stranger.address,
    } = {}) => {
        const inputNotes = [];
        const outputNotes = await generateOutputNotes(
            outputNoteValues,
            publicKey,
            ownerAddress,
        );

        const publicValue = ProofUtils.getPublicValue(
            [],
            outputNoteValues,
        );

        const depositAmount = outputNoteValues.reduce((accum, val) => accum + val, 0);

        return {
            inputNotes,
            outputNotes,
            publicValue,
            depositAmount,
        };
    };

    beforeAll(async () => {
        ace = await deployACE({
            from: senderAddress,
        });
    });

    beforeEach(async () => {
        erc20 = await ERC20Mintable.new({ from: senderAddress });
        await erc20.mint(userAddress, initialAmount, { from: senderAddress });
        await erc20.mint(anotherUserAddress, initialAmount, { from: senderAddress });
        await erc20.mint(stranger.address, initialAmount, { from: senderAddress });

        zkAsset = await ZkAsset.new(
            ace.address,
            erc20.address,
            1,
            {
                from: senderAddress,
            },
        );

        relayer = await TransactionRelayer.new(ace.address, { from: senderAddress });
    });

    it('deposit to ZkAsset on user\'s behalf', async () => {
        const {
            inputNotes,
            outputNotes,
            publicValue,
            depositAmount,
        } = await generateDepositProofData({
            ownerAddress: userAddress,
        });

        const depositProof = new JoinSplitProof(
            inputNotes,
            outputNotes,
            relayer.address,
            publicValue,
            relayer.address,
        );

        await erc20.approve(
            relayer.address,
            depositAmount,
            { from: userAddress },
        );

        await erc20.approve(
            relayer.address,
            depositAmount,
            { from: anotherUserAddress },
        );

        expect((await erc20.balanceOf(userAddress)).toNumber()).toBe(initialAmount);
        expect((await erc20.balanceOf(anotherUserAddress)).toNumber()).toBe(initialAmount);
        expect((await erc20.balanceOf(relayer.address)).toNumber()).toBe(0);
        expect((await erc20.balanceOf(ace.address)).toNumber()).toBe(0);

        const proofData = depositProof.encodeABI(zkAsset.address);
        const proofHash = depositProof.hash;
        await relayer.deposit(
            zkAsset.address,
            userAddress,
            proofHash,
            proofData,
            depositAmount,
            { from: userAddress },
        );

        expect((await erc20.balanceOf(userAddress)).toNumber()).toBe(initialAmount - depositAmount);
        expect((await erc20.balanceOf(anotherUserAddress)).toNumber()).toBe(initialAmount);
        expect((await erc20.balanceOf(relayer.address)).toNumber()).toBe(0);
        expect((await erc20.balanceOf(ace.address)).toNumber()).toBe(depositAmount);

        asyncForEach(outputNotes, async (note) => {
            const {
                status,
                noteOwner,
            } = await ace.getNote(zkAsset.address, note.noteHash);
            expect(status.toNumber()).toBe(1);
            expect(noteOwner).toBe(userAddress);
        });
    });

    it('allow to deposit notes belonging to another user', async () => {
        const {
            inputNotes,
            outputNotes,
            publicValue,
            depositAmount,
        } = await generateDepositProofData({
            ownerAddress: anotherUserAddress,
        });

        const depositProof = new JoinSplitProof(
            inputNotes,
            outputNotes,
            relayer.address,
            publicValue,
            relayer.address,
        );

        await erc20.approve(
            relayer.address,
            depositAmount,
            { from: userAddress },
        );

        await erc20.approve(
            relayer.address,
            depositAmount,
            { from: anotherUserAddress },
        );

        expect((await erc20.balanceOf(userAddress)).toNumber()).toBe(initialAmount);
        expect((await erc20.balanceOf(anotherUserAddress)).toNumber()).toBe(initialAmount);
        expect((await erc20.balanceOf(relayer.address)).toNumber()).toBe(0);
        expect((await erc20.balanceOf(ace.address)).toNumber()).toBe(0);

        const proofData = depositProof.encodeABI(zkAsset.address);
        const proofHash = depositProof.hash;
        await relayer.deposit(
            zkAsset.address,
            userAddress,
            proofHash,
            proofData,
            depositAmount,
            { from: userAddress },
        );

        expect((await erc20.balanceOf(userAddress)).toNumber()).toBe(initialAmount - depositAmount);
        expect((await erc20.balanceOf(anotherUserAddress)).toNumber()).toBe(initialAmount);
        expect((await erc20.balanceOf(relayer.address)).toNumber()).toBe(0);
        expect((await erc20.balanceOf(ace.address)).toNumber()).toBe(depositAmount);

        asyncForEach(outputNotes, async (note) => {
            const {
                status,
                noteOwner,
            } = await ace.getNote(zkAsset.address, note.noteHash);
            expect(status.toNumber()).toBe(1);
            expect(noteOwner).toBe(anotherUserAddress);
        });
    });

    it("can not deposit from other user's account", async () => {
        const {
            inputNotes,
            outputNotes,
            publicValue,
            depositAmount,
        } = await generateDepositProofData({
            ownerAddress: userAddress,
        });

        const depositProof = new JoinSplitProof(
            inputNotes,
            outputNotes,
            relayer.address,
            publicValue,
            relayer.address,
        );

        await erc20.approve(
            relayer.address,
            depositAmount,
            { from: userAddress },
        );

        await erc20.approve(
            relayer.address,
            depositAmount,
            { from: anotherUserAddress },
        );

        expect((await erc20.balanceOf(userAddress)).toNumber()).toBe(initialAmount);
        expect((await erc20.balanceOf(anotherUserAddress)).toNumber()).toBe(initialAmount);
        expect((await erc20.balanceOf(relayer.address)).toNumber()).toBe(0);
        expect((await erc20.balanceOf(ace.address)).toNumber()).toBe(0);

        const proofData = depositProof.encodeABI(zkAsset.address);
        const proofHash = depositProof.hash;

        let error;
        try {
            await relayer.deposit(
                zkAsset.address,
                anotherUserAddress,
                proofHash,
                proofData,
                depositAmount,
                { from: userAddress },
            );
        } catch (e) {
            error = e;
        }

        expect(error.toString()).toMatch(/Sender has no permission to deposit on owner's behalf/);

        expect((await erc20.balanceOf(userAddress)).toNumber()).toBe(initialAmount);
        expect((await erc20.balanceOf(anotherUserAddress)).toNumber()).toBe(initialAmount);
        expect((await erc20.balanceOf(relayer.address)).toNumber()).toBe(0);
        expect((await erc20.balanceOf(ace.address)).toNumber()).toBe(0);
    });

    it('will not affect user\'s balance if proof is invalid', async () => {
        const {
            inputNotes,
            outputNotes,
            publicValue,
            depositAmount,
        } = await generateDepositProofData({
            ownerAddress: userAddress,
        });

        const depositProof = new JoinSplitProof(
            inputNotes,
            outputNotes,
            relayer.address,
            publicValue,
            relayer.address,
        );

        const wrongSenderProof = new JoinSplitProof(
            inputNotes,
            outputNotes,
            relayer.address,
            publicValue,
            userAddress,
        );

        const wrongOwnerProof = new JoinSplitProof(
            inputNotes,
            outputNotes,
            userAddress,
            publicValue,
            relayer.address,
        );

        const extraOutputNotes = await generateOutputNotes([10]);
        const moreOutputNotes = [
            ...outputNotes,
            ...extraOutputNotes,
        ];
        const morePublicValue = ProofUtils.getPublicValue(
            [],
            moreOutputNotes.map(note => note.k),
        );
        const moreValueProof = new JoinSplitProof(
            inputNotes,
            moreOutputNotes,
            relayer.address,
            morePublicValue,
            relayer.address,
        );

        await erc20.approve(
            relayer.address,
            depositAmount,
            { from: userAddress },
        );

        expect((await erc20.balanceOf(userAddress)).toNumber()).toBe(initialAmount);
        expect((await erc20.balanceOf(relayer.address)).toNumber()).toBe(0);
        expect((await erc20.balanceOf(ace.address)).toNumber()).toBe(0);

        const correctProofHash = depositProof.hash;
        const correctProofData = depositProof.encodeABI(zkAsset.address);

        const failedTransactions = [
            wrongSenderProof,
            wrongOwnerProof,
            moreValueProof,
        ].reduce((transactions, invalidProof) => {
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
            ].map(async ({
                proofHash,
                proofData,
            }) => {
                let error = null;
                try {
                    await relayer.deposit(
                        zkAsset.address,
                        proofHash,
                        proofData,
                        depositAmount,
                        { from: userAddress },
                    );
                } catch (e) {
                    error = e;
                }
                expect(error).not.toBe(null);
            });
            return transactions.concat(moreTransactions);
        }, []);

        await Promise.all(failedTransactions);

        expect((await erc20.balanceOf(userAddress)).toNumber()).toBe(initialAmount);
        expect((await erc20.balanceOf(relayer.address)).toNumber()).toBe(0);
        expect((await erc20.balanceOf(ace.address)).toNumber()).toBe(0);

        const [note] = outputNotes;
        let noNoteError = null;
        try {
            await ace.getNote(zkAsset.address, note.noteHash);
        } catch (e) {
            noNoteError = e;
        }
        expect(noNoteError).not.toBe(null);
    });

    it("can send deposit using the owner's alias address", async () => {
        const {
            inputNotes,
            outputNotes,
            publicValue,
            depositAmount,
        } = await generateDepositProofData({
            ownerAddress: userAddress,
        });

        const depositProof = new JoinSplitProof(
            inputNotes,
            outputNotes,
            relayer.address,
            publicValue,
            relayer.address,
        );

        await erc20.approve(
            relayer.address,
            depositAmount,
            { from: userAddress },
        );

        await erc20.approve(
            relayer.address,
            depositAmount,
            { from: anotherUserAddress },
        );

        expect((await erc20.balanceOf(userAddress)).toNumber()).toBe(initialAmount);
        expect((await erc20.balanceOf(anotherUserAddress)).toNumber()).toBe(initialAmount);
        expect((await erc20.balanceOf(relayer.address)).toNumber()).toBe(0);
        expect((await erc20.balanceOf(ace.address)).toNumber()).toBe(0);

        const proofData = depositProof.encodeABI(zkAsset.address);
        const proofHash = depositProof.hash;

        const depositParams = [
            zkAsset.address,
            userAddress,
            proofHash,
            proofData,
            depositAmount,
        ];

        let error;
        try {
            await relayer.deposit(
                ...depositParams,
                { from: anotherUserAddress },
            );
        } catch (e) {
            error = e;
        }

        expect(error.toString()).toMatch(/Sender has no permission to deposit on owner's behalf/);
        expect((await erc20.balanceOf(userAddress)).toNumber()).toBe(initialAmount);

        await relayer.setAccountAliasMapping(userAddress, anotherUserAddress);

        await relayer.deposit(
            ...depositParams,
            { from: anotherUserAddress },
        );

        expect((await erc20.balanceOf(userAddress)).toNumber()).toBe(initialAmount - depositAmount);
        expect((await erc20.balanceOf(anotherUserAddress)).toNumber()).toBe(initialAmount);
        expect((await erc20.balanceOf(relayer.address)).toNumber()).toBe(0);
        expect((await erc20.balanceOf(ace.address)).toNumber()).toBe(depositAmount);

        const [note] = outputNotes;
        const {
            status,
            noteOwner,
        } = await ace.getNote(zkAsset.address, note.noteHash);
        expect(status.toNumber()).toBe(1);
        expect(noteOwner).toBe(userAddress);
    });

    it("cannot deposit notes belonging to non-owner when sending the transaction using the owner's alias address", async () => {
        const {
            inputNotes,
            outputNotes,
            publicValue,
            depositAmount,
        } = await generateDepositProofData({
            ownerAddress: anotherUserAddress,
        });

        const depositProof = new JoinSplitProof(
            inputNotes,
            outputNotes,
            relayer.address,
            publicValue,
            relayer.address,
        );

        await erc20.approve(
            relayer.address,
            depositAmount,
            { from: userAddress },
        );

        await erc20.approve(
            relayer.address,
            depositAmount,
            { from: anotherUserAddress },
        );

        expect((await erc20.balanceOf(userAddress)).toNumber()).toBe(initialAmount);
        expect((await erc20.balanceOf(anotherUserAddress)).toNumber()).toBe(initialAmount);
        expect((await erc20.balanceOf(relayer.address)).toNumber()).toBe(0);
        expect((await erc20.balanceOf(ace.address)).toNumber()).toBe(0);

        const proofData = depositProof.encodeABI(zkAsset.address);
        const proofHash = depositProof.hash;

        const depositParams = [
            zkAsset.address,
            userAddress,
            proofHash,
            proofData,
            depositAmount,
        ];

        await relayer.setAccountAliasMapping(userAddress, anotherUserAddress);

        let error;
        try {
            await relayer.deposit(
                ...depositParams,
                { from: anotherUserAddress },
            );
        } catch (e) {
            error = e;
        }

        expect(error.toString()).toMatch(/Cannot deposit note to other account if sender is not the same as owner/);
        expect((await erc20.balanceOf(userAddress)).toNumber()).toBe(initialAmount);
        expect((await erc20.balanceOf(anotherUserAddress)).toNumber()).toBe(initialAmount);
        expect((await erc20.balanceOf(relayer.address)).toNumber()).toBe(0);
        expect((await erc20.balanceOf(ace.address)).toNumber()).toBe(0);
    });
});
