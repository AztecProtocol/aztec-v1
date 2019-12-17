import aztec from 'aztec.js';
import secp256k1 from '@aztec/secp256k1';
import {
    accounts,
    contract,
} from '@openzeppelin/test-environment';
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

    const generateOutputNotes = async (values, owner = stranger) => Promise.all(
        values.map(async value => aztec.note.create(
            owner.publicKey,
            value,
            owner.address,
        )),
    );

    const generateDepositProofData = async ({
        outputNoteValues = [20, 30],
        owner = stranger.publicKey,
    } = {}) => {
        const inputNotes = [];
        const outputNotes = await generateOutputNotes(outputNoteValues, owner);

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
            owner: {
                address: userAddress,
                publicKey: stranger.publicKey,
            },
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

        const [note] = outputNotes;
        const {
            status,
            noteOwner,
        } = await ace.getNote(zkAsset.address, note.noteHash);
        expect(status.toNumber()).toBe(1);
        expect(noteOwner).toBe(userAddress);
    });

    it("can not deposit from other user's account", async () => {
        const {
            inputNotes,
            outputNotes,
            publicValue,
            depositAmount,
        } = await generateDepositProofData({
            owner: {
                address: userAddress,
                publicKey: stranger.publicKey,
            },
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

        expect(error.toString()).toMatch(/Cannot deposit note to other account/);

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
            owner: {
                address: userAddress,
                publicKey: stranger.publicKey,
            },
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
});
