/* eslint-disable prefer-arrow-callback */
const chai = require('chai');
const crypto = require('crypto');
const sinon = require('sinon');
const BN = require('bn.js');

const { clear: clearDatabase } = require('../../../db');
const walletController = require('../../wallets');
const erc20Controller = require('../erc20Token');
const aztecController = require('../aztec');
const aztecTokenController = require('./controller');
const deployer = require('../../../deployer');
const transactionsController = require('../../transactions');
const noteController = require('../../notes');

const proof = require('../../../../aztec-crypto-js/proof');
const { t2 } = require('../../../../aztec-crypto-js/params');
const { erc20ScalingFactor: scalingFactor, TX_STATUS, NOTE_STATUS } = require('../../../config');

const web3 = require('../../../web3Listener');

const AZTECERC20Bridge = require('../../../contracts/AZTECERC20Bridge');

const { expect } = chai;

describe('aztecToken controller tests', () => {
    describe('success states', async function success() {
        this.timeout(10000);
        const wallets = [];
        beforeEach(async () => {
            clearDatabase();
            wallets[0] = await walletController.createFromPrivateKey(`0x${crypto.randomBytes(32).toString('hex')}`, 'testA');
            wallets[1] = await walletController.createFromPrivateKey(`0x${crypto.randomBytes(32).toString('hex')}`, 'testB');
            wallets[2] = await walletController.createFromPrivateKey(`0x${crypto.randomBytes(32).toString('hex')}`, 'testC');

            const accounts = await web3.eth.getAccounts();
            await Promise.all(wallets.map((wallet) => {
                return web3.eth.sendTransaction({
                    from: accounts[0],
                    to: wallet.address,
                    value: web3.utils.toWei('0.5', 'ether'),
                });
            }));

            await transactionsController.getTransactionReceipt(
                await erc20Controller.mint(wallets[0].address, wallets[1].address, scalingFactor.mul(new BN(10000)).toString(10))
            );
            await transactionsController.getTransactionReceipt(
                await erc20Controller.mint(wallets[0].address, wallets[0].address, scalingFactor.mul(new BN(10000)).toString(10))
            );
        });

        it('AZTECERC20Bridge.sol is deployed to network', async () => {
            const address = await aztecTokenController.getContractAddress();
            const aztecAddress = await aztecController.getContractAddress();
            expect(address).to.be.a('string');
            expect(address.length).to.equal(42);

            const deployedBytecode = await web3.eth.getCode(address);
            expect(deployedBytecode)
                .to.equal(AZTECERC20Bridge.deployedBytecode.replace('__AZTEC________________________', aztecAddress.slice(2)));
            const publicKey = await Promise.all(Array.from({ length: 4 }, (v, i) => web3.eth.getStorageAt(address, i)));
            expect(t2[0]).to.equal(publicKey[0]);
            expect(t2[1]).to.equal(publicKey[1]);
            expect(t2[2]).to.equal(publicKey[2]);
            expect(t2[3]).to.equal(publicKey[3]);
        });


        it('can issue a series of confidentialTransfer transactions', async () => {
            const aztecTokenAddress = await aztecTokenController.getContractAddress();

            await transactionsController.getTransactionReceipt(
                await erc20Controller.approve(
                    wallets[0].address,
                    aztecTokenAddress,
                    scalingFactor.mul(new BN(10000)).toString(10)
                )
            );
            const inputNotes = [
                noteController.createNote(wallets[0].address, 100),
                noteController.createNote(wallets[0].address, 73),
                noteController.createNote(wallets[0].address, 101),
                noteController.createNote(wallets[0].address, 26),
            ];
            const { proofData, challenge } = proof.constructJoinSplit(inputNotes, 0, wallets[0].address, -300);

            const metadata = noteController.encodeMetadata(inputNotes);

            const transactionHash = await aztecTokenController.confidentialTransfer(
                wallets[0].address,
                proofData,
                0,
                challenge,
                [],
                [wallets[0].address, wallets[0].address, wallets[1].address, wallets[1].address],
                metadata
            );

            let transaction = transactionsController.get(transactionHash);
            expect(transaction.transactionHash).to.equal(transactionHash);
            expect(transaction.status).to.equal(TX_STATUS.SENT);

            expect(noteController.get(inputNotes[0].noteHash).status).to.equal(NOTE_STATUS.OFF_CHAIN);
            expect(noteController.get(inputNotes[1].noteHash).status).to.equal(NOTE_STATUS.OFF_CHAIN);
            expect(noteController.get(inputNotes[2].noteHash).status).to.equal(NOTE_STATUS.OFF_CHAIN);
            expect(noteController.get(inputNotes[3].noteHash).status).to.equal(NOTE_STATUS.OFF_CHAIN);

            await aztecTokenController.updateConfidentialTransferTransaction(transactionHash);

            expect(noteController.get(inputNotes[0].noteHash).status).to.equal(NOTE_STATUS.UNSPENT);
            expect(noteController.get(inputNotes[1].noteHash).status).to.equal(NOTE_STATUS.UNSPENT);
            expect(noteController.get(inputNotes[2].noteHash).status).to.equal(NOTE_STATUS.UNSPENT);
            expect(noteController.get(inputNotes[3].noteHash).status).to.equal(NOTE_STATUS.UNSPENT);

            transaction = transactionsController.get(transactionHash);
            expect(transaction.transactionHash).to.equal(transactionHash);
            expect(transaction.status).to.equal(TX_STATUS.MINED);

            const contract = aztecTokenController.contract(aztecTokenAddress);
            expect(await contract.methods.noteRegistry(inputNotes[0].noteHash).call()).to.equal(wallets[0].address);
            expect(await contract.methods.noteRegistry(inputNotes[1].noteHash).call()).to.equal(wallets[0].address);
            expect(await contract.methods.noteRegistry(inputNotes[2].noteHash).call()).to.equal(wallets[1].address);
            expect(await contract.methods.noteRegistry(inputNotes[3].noteHash).call()).to.equal(wallets[1].address);

            const {
                proofData: newProofData,
                challenge: newChallenge,
                inputSignatures,
                outputOwners,
                metadata: newMetadata,
                noteHashes,
            } = await noteController.createConfidentialTransfer(
                [inputNotes[0].noteHash, inputNotes[1].noteHash],
                [[wallets[2].address, 20], [wallets[2].address, 3]],
                150,
                wallets[1].address,
                aztecTokenAddress
            );
            const redeemTransactionHash = await aztecTokenController.confidentialTransfer(
                wallets[1].address,
                newProofData,
                2,
                newChallenge,
                inputSignatures,
                outputOwners,
                newMetadata,
                aztecTokenAddress
            );

            await aztecTokenController.updateConfidentialTransferTransaction(redeemTransactionHash);
            expect(noteController.get(noteHashes[0]).status).to.equal(NOTE_STATUS.SPENT);
            expect(noteController.get(noteHashes[1]).status).to.equal(NOTE_STATUS.SPENT);
            expect(noteController.get(noteHashes[2]).status).to.equal(NOTE_STATUS.UNSPENT);
            expect(noteController.get(noteHashes[3]).status).to.equal(NOTE_STATUS.UNSPENT);
        });
    });

    describe('failure states', async function failure() {
        let getNetworkId;
        beforeEach(() => {
            getNetworkId = sinon.stub(deployer, 'getNetwork').callsFake(() => 0);
        });

        afterEach(() => {
            getNetworkId.restore();
        });

        it('aztecTokenController.getContractAddress throws if not deployed to network', async () => {
            let message = '';
            try {
                await aztecTokenController.getContractAddress();
            } catch (e) {
                ({ message } = e);
            }
            expect(message).to.equal('AZTECERC20Bridge.sol not deployed to network 0');
        });
    });
});
