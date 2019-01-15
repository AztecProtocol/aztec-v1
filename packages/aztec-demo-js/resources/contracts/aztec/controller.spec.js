/* eslint-disable prefer-arrow-callback */
const chai = require('chai');
const crypto = require('crypto');
const sinon = require('sinon');

const { clear: clearDatabase } = require('../../../db');
const aztecController = require('./controller');
const noteController = require('../../notes');
const transactionsController = require('../../transactions');
const walletController = require('../../wallets');
const aztecProof = require('../../../../aztec-crypto-js/proof');
const { TX_STATUS } = require('../../../config');
const deployer = require('../../../deployer');
const web3 = require('../../../web3Listener');

const AZTEC = require('../../../contracts/AZTEC');

const { expect } = chai;

describe('aztec controller tests', () => {
    describe('success states', async function success() {
        this.timeout(10000);
        let wallet;
        let wallets = [];
        beforeEach(async () => {
            clearDatabase();
            const privateKey = `0x${crypto.randomBytes(32).toString('hex')}`;
            wallet = await walletController.createFromPrivateKey(privateKey, 'test');
            wallets = [
                await walletController.createFromPrivateKey(privateKey, 'testB'),
                await walletController.createFromPrivateKey(privateKey, 'testC'),
            ];
            const accounts = await web3.eth.getAccounts();
            await web3.eth.sendTransaction({
                from: accounts[0],
                to: wallet.address,
                value: web3.utils.toWei('0.5', 'ether'),
            });
        });

        it('AZTEC.sol is deployed to network', async () => {
            const address = await aztecController.getContractAddress();
            expect(address).to.be.a('string');
            expect(address.length).to.equal(42);

            const deployedBytecode = await web3.eth.getCode(address);
            expect(deployedBytecode).to.equal(AZTEC.deployedBytecode);
        });

        it('can create join split transaction', async () => {
            const inputNotes = [
                noteController.createNote(wallets[0].address, 100),
                noteController.createNote(wallets[0].address, 73),
                noteController.createNote(wallets[1].address, 101),
                noteController.createNote(wallets[1].address, 26),
            ];
            const { proofData, challenge } = aztecProof.constructJoinSplit(inputNotes, 0, wallet.address, -300);
            const transactionHash = await aztecController.joinSplit(
                wallet.address,
                proofData,
                0,
                challenge
            );
            expect(typeof (transactionHash)).to.equal('string');
            expect(transactionHash.length).to.equal(66);

            let transaction = await transactionsController.get(transactionHash);
            expect(transaction.status).to.equal(TX_STATUS.SENT);

            const transactionReceipt = await transactionsController.getTransactionReceipt(transactionHash);
            expect(transactionReceipt).to.not.equal(undefined);
            expect(transactionReceipt.status).to.equal(true);

            transaction = await transactionsController.get(transactionHash);
            expect(transaction.status).to.equal(TX_STATUS.MINED);
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

        it('aztecController.getContractAddress throws if not deployed to network', async () => {
            let message = '';
            try {
                await aztecController.getContractAddress();
            } catch (e) {
                ({ message } = e);
            }
            expect(message).to.equal('AZTEC.sol not deployed to network 0');
        });
    });
});
