/* global artifacts, beforeEach, contract, expect,it, web3 */
// ### External Dependencies
const BN = require('bn.js');
const ethUtil = require('ethereumjs-util');
const truffleAssert = require('truffle-assertions');

// ### Internal Dependencies
// eslint-disable-next-line object-curly-newline
const { abiEncoder, note, proof, secp256k1, sign } = require('aztec.js');
const { constants: { CRS } } = require('@aztec/dev-utils');

const { outputCoder } = abiEncoder;

// ### Artifacts
const ERC20Mintable = artifacts.require('./contracts/ERC20/ERC20Mintable');
const ACE = artifacts.require('./contracts/ACE/ACE');
const JoinSplit = artifacts.require('./contracts/ACE/validators/JoinSplit');
const JoinSplitInterface = artifacts.require('./contracts/ACE/validators/JoinSplitInterface');
const ZkAssetOwnable = artifacts.require('./contracts/ZkAsset/ZkAssetOwnable');
const ZkAssetOwnableTest = artifacts.require('./contracts/ZkAsset/ZkAssetOwnableTest');


JoinSplit.abi = JoinSplitInterface.abi;

contract('ZkAssetOwnable', (accounts) => {
    // the proof is represented as an uint24 that compresses 3 uint8s:
    // 1 * 256**(2) + 0 * 256**(1) + 1 * 256**(0)
    const JOIN_SPLIT_PROOF = 65537;

    let ace;
    let aztecJoinSplit;
    let erc20;
    let zkAssetOwnable;
    let zkAssetOwnableTest;

    let aztecAccounts = [];
    const epoch = 100;
    const filter = 17; // 12 + 4 + 1
    let notes = [];
    let scalingFactor;
    const proofs = [];
    let proofHashes = [];
    let proofOutputs = [];
    let signature;
    const tokensTransferred = new BN(100000);
    let v; let r; let s;

    beforeEach(async () => {
        ace = await ACE.new({ from: accounts[0] });
        aztecAccounts = [...new Array(10)].map(() => secp256k1.generateAccount());
        Promise.all(aztecAccounts.map(({ address }) => {
            return web3.eth.sendTransaction({
                from: accounts[0],
                to: address,
                value: web3.utils.toWei('0.5'),
            });
        }));
        notes = [
            ...aztecAccounts.map(({ publicKey }, i) => note.create(publicKey, i * 10)),
            ...aztecAccounts.map(({ publicKey }, i) => note.create(publicKey, i * 10)),
        ];
        await ace.setCommonReferenceString(CRS);
        aztecJoinSplit = await JoinSplit.new();
        await ace.setProof(JOIN_SPLIT_PROOF, aztecJoinSplit.address);

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

        proofOutputs = proofs.map(({ expectedOutput }) => {
            return outputCoder.getProofOutput(expectedOutput, 0);
        });
        proofHashes = proofOutputs.map((proofOutput) => {
            return outputCoder.hashProofOutput(proofOutput);
        });

        erc20 = await ERC20Mintable.new();
        scalingFactor = new BN(10);
        zkAssetOwnable = await ZkAssetOwnable.new(
            ace.address,
            erc20.address,
            scalingFactor
        );
        zkAssetOwnableTest = await ZkAssetOwnableTest.new();

        await Promise.all(accounts.map((account) => {
            const opts = { from: accounts[0], gas: 4700000 };
            return erc20.mint(
                account,
                scalingFactor.mul(tokensTransferred),
                opts
            );
        }));
        await Promise.all(accounts.map((account) => {
            const opts = { from: account, gas: 4700000 };
            return erc20.approve(
                ace.address,
                scalingFactor.mul(tokensTransferred),
                opts
            );
        }));
        await zkAssetOwnable.publicApprove(
            proofHashes[0],
            10,
            { from: accounts[0] }
        );
        await zkAssetOwnable.publicApprove(
            proofHashes[1],
            40,
            { from: accounts[1] }
        );
    });

    describe.only('success states', () => {
        it('should set a new proof bit filter', async () => {
            const { receipt } = await zkAssetOwnable.setProofs(epoch, filter);
            expect(receipt.status).to.equal(true);
        });

        it.skip('should have a contract update a note registry with output notes', async () => {
            await zkAssetOwnable.setProofs(epoch, filter);
            await zkAssetOwnable.confidentialTransfer(proofs[0].proofData);

            Promise.all([0.1].map((i) => {
                // [v, r, s] = secp256k1.ecdsa.signMessage(ethUtil.keccak256('HelloWorld'), aztecAccounts[0].privateKey);
                // signature = [v, r.slice(2), s.slice(2)].join('');
                signature = sign.signACENote()
                signature = '0x...';
                return zkAssetOwnable.confidentialApprove(
                    notes[i].noteHash,
                    zkAssetOwnableTest.address,
                    true,
                    signature,
                    { from: aztecAccounts[i].address }
                );
            }));

            await zkAssetOwnableTest.setZkAssetOwnableAddress(zkAssetOwnable.address);
            const { receipt } = await zkAssetOwnableTest.callConfidentialTransferFrom(JOIN_SPLIT_PROOF, proofOutputs[1]);
            expect(receipt.status).to.equal(true);
        });
    });

    describe('failure states', async () => {
        it('should fail to set a new proof bit filter', async () => {
            const opts = { from: accounts[1] };
            await truffleAssert.reverts(
                zkAssetOwnable.setProofs(epoch, filter, opts),
                'only the owner can set the epoch proofs'
            );
        });

        it.skip('should fail to update a note registry with output notes', async () => {
            await zkAssetOwnable.setProofs(epoch, filter);
            await zkAssetOwnable.confidentialTransfer(proofs[0].proofData);

            Promise.all([0.1].map((i) => {
                // [v, r, s] = secp256k1.ecdsa.signMessage(ethUtil.keccak256('HelloWorld'), aztecAccounts[0].privateKey);
                // signature = [v, r.slice(2), s.slice(2)].join('');
                signature = '0x...';
                return zkAssetOwnable.confidentialApprove(
                    notes[i].noteHash,
                    zkAssetOwnableTest.address,
                    true,
                    signature,
                    { from: aztecAccounts[i].address }
                );
            }));

            // await zkAssetOwnableTest.setZkAssetOwnableAddress(zkAssetOwnable.address);
            // const { receipt } = await zkAssetOwnableTest.callConfidentialTransferFrom(JOIN_SPLIT_PROOF, proofOutputs[1]);
            // expect(receipt.status).to.equal(true);
        });
    });
});
