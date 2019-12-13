/* global artifacts, contract */
const aztec = require('aztec.js');
const secp256k1 = require('@aztec/secp256k1');

const ACE = artifacts.require('@aztec/protocol/contracts/ACE/ACE.sol');
const ERC20Mintable = artifacts.require('@aztec/protocol/contracts/ERC20/ERC20Mintable.sol');
const ZkAsset = artifacts.require('@aztec/protocol/contracts/ERC1724/ZkAssetOwnable.sol');
const TransactionRelayer = artifacts.require('./TransactionRelayer.sol');

const {
    JoinSplitProof,
    ProofUtils,
} = aztec;

contract('TransactionRelayer', (accounts) => {
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
            expect(balance.toNumber()).to.equal(value);
        },
    });

    beforeEach(async () => {
        ace = await ACE.deployed();

        erc20 = await ERC20Mintable.new({ from: senderAddress });
        await erc20.mint(userAddress, initialAmount, { from: senderAddress });
        await erc20.mint(stranger.address, initialAmount, { from: senderAddress });

        zkAsset = await ZkAsset.new(
            ACE.address,
            erc20.address,
            1,
            {
                from: senderAddress,
            },
        );

        relayer = await TransactionRelayer.new(ACE.address, { from: senderAddress });
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
        await expectERC20BalanceOf(ACE.address).toBe(0);

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
        await expectERC20BalanceOf(ACE.address).toBe(depositAmount);

        const [note] = outputNotes;
        const {
            status,
            noteOwner,
        } = await ace.getNote(zkAsset.address, note.noteHash);
        expect(status.toNumber()).to.equal(1);
        expect(noteOwner).to.equal(stranger.address);
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
        await expectERC20BalanceOf(ACE.address).toBe(0);

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
                expect(error).not.to.equal(null);
            });
            return transactions.concat(moreTransactions);
        }, []);

        await Promise.all(failedTransactions);

        await expectERC20BalanceOf(userAddress).toBe(initialAmount);
        await expectERC20BalanceOf(stranger.address).toBe(initialAmount);
        await expectERC20BalanceOf(relayer.address).toBe(0);
        await expectERC20BalanceOf(ACE.address).toBe(0);

        const [note] = outputNotes;
        let noNoteError = null;
        try {
            await ace.getNote(zkAsset.address, note.noteHash);
        } catch (e) {
            noNoteError = e;
        }
        expect(noNoteError).not.to.equal(null);
    });
});
