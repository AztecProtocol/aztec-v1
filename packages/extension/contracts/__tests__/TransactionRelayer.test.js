import aztec from 'aztec.js';
import secp256k1 from '@aztec/secp256k1';
import {
    accounts,
    contract,
} from '@openzeppelin/test-environment';
import deployACE from './helpers/deployACE';

const ERC20Mintable = contract.fromArtifact('ERC20Mintable');
const ZkAsset = contract.fromArtifact('ZkAssetOwnable');
const TransactionRelayer = contract.fromArtifact('TransactionRelayer');

jest.setTimeout(60000);

const {
    JoinSplitProof,
    ProofUtils,
} = aztec;

describe('TransactionRelayer', () => {
    const [
        senderAddress,
        userAddress,
    ] = accounts;
    const stranger = secp256k1.generateAccount();
    const initialAmount = 100;
    let ace;
    let erc20;
    let zkAsset;
    let relayer;

    const generateOutputNotes = async (values, ownerPublicKey = stranger.publicKey) => Promise.all(
        values.map(async value => aztec.note.create(
            ownerPublicKey,
            value,
        )),
    );

    const generateDepositProofData = async (ownerPublicKey = stranger.publicKey) => {
        const inputNotes = [];
        const outputNoteValues = [20, 30];
        const outputNotes = await generateOutputNotes(outputNoteValues, ownerPublicKey);

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

    const expectERC20BalanceOf = address => ({
        toBe: async (value) => {
            const balance = await erc20.balanceOf(address);
            expect(balance.toNumber()).toBe(value);
        },
    });

    beforeAll(async () => {
        ace = await deployACE();
    });

    beforeEach(async () => {
        erc20 = await ERC20Mintable.new({ from: senderAddress });
        await erc20.mint(userAddress, initialAmount, { from: senderAddress });
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
        } = await generateDepositProofData();

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

        await expectERC20BalanceOf(userAddress).toBe(initialAmount);
        await expectERC20BalanceOf(stranger.address).toBe(initialAmount);
        await expectERC20BalanceOf(relayer.address).toBe(0);
        await expectERC20BalanceOf(ace.address).toBe(0);

        const proofData = depositProof.encodeABI(zkAsset.address);
        const proofHash = depositProof.hash;
        await relayer.deposit(
            zkAsset.address,
            proofHash,
            proofData,
            depositAmount,
            { from: userAddress },
        );

        await expectERC20BalanceOf(userAddress).toBe(initialAmount - depositAmount);
        await expectERC20BalanceOf(stranger.address).toBe(initialAmount);
        await expectERC20BalanceOf(relayer.address).toBe(0);
        await expectERC20BalanceOf(ace.address).toBe(depositAmount);

        const [note] = outputNotes;
        const {
            status,
            noteOwner,
        } = await ace.getNote(zkAsset.address, note.noteHash);
        expect(status.toNumber()).toBe(1);
        expect(noteOwner).toBe(stranger.address);
    });

    it('will not affect user\'s balance if proof is invalid', async () => {
        const {
            inputNotes,
            outputNotes,
            publicValue,
            depositAmount,
        } = await generateDepositProofData();

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

        await expectERC20BalanceOf(userAddress).toBe(initialAmount);
        await expectERC20BalanceOf(stranger.address).toBe(initialAmount);
        await expectERC20BalanceOf(relayer.address).toBe(0);
        await expectERC20BalanceOf(ace.address).toBe(0);

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

        await expectERC20BalanceOf(userAddress).toBe(initialAmount);
        await expectERC20BalanceOf(stranger.address).toBe(initialAmount);
        await expectERC20BalanceOf(relayer.address).toBe(0);
        await expectERC20BalanceOf(ace.address).toBe(0);

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
