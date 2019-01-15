/* eslint-disable prefer-arrow-callback */

const chai = require('chai');
const crypto = require('crypto');
const sinon = require('sinon');

const { clear: clearDatabase } = require('../../../db');

const walletsController = require('../../wallets');
const doorbellController = require('./controller');
const transactionsController = require('../../transactions');
const { TX_STATUS } = require('../../../config');
const web3 = require('../../../web3Listener');
const deployer = require('../../../deployer');

const Doorbell = require('../../../contracts/Doorbell');

const { expect } = chai;

describe('doorbell tests', () => {
    describe('success states', async function success() {
        this.timeout(10000);
        const wallets = [];
        beforeEach(async () => {
            clearDatabase();
            wallets[0] = await walletsController.createFromPrivateKey(`0x${crypto.randomBytes(32).toString('hex')}`, 'testA');
            wallets[1] = await walletsController.createFromPrivateKey(`0x${crypto.randomBytes(32).toString('hex')}`, 'testB');

            const accounts = await web3.eth.getAccounts();
            await Promise.all(wallets.map((wallet) => {
                return web3.eth.sendTransaction({
                    from: accounts[0],
                    to: wallet.address,
                    value: web3.utils.toWei('0.5', 'ether'),
                });
            }));
        });

        it('Doorbell.sol is deployed to network', async () => {
            const address = await doorbellController.getContractAddress();
            expect(address).to.be.a('string');
            expect(address.length).to.equal(42);

            const deployedBytecode = await web3.eth.getCode(address);
            expect(deployedBytecode)
                .to.equal(Doorbell.deployedBytecode);
        });

        it('validate that the block number can be correctly set', async () => {
            const setBlockTxHash = await doorbellController.setBlock(wallets[0].address);

            let transaction = transactionsController.get(setBlockTxHash);
            expect(transaction.transactionHash).to.equal(setBlockTxHash);
            expect(transaction.status).to.equal(TX_STATUS.SENT);

            // Extract the block number the transaction is sent in
            const { blockNumber } = await transactionsController.getTransactionReceipt(setBlockTxHash);

            const contract = await doorbellController.contract();

            // Query the blockNumber stored by the smart contract
            const extractedBlockNumber = await contract.methods.addressBlockMap(wallets[0].address).call();
            expect(blockNumber.toString()).to.equal(extractedBlockNumber);

            transaction = transactionsController.get(setBlockTxHash);
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

        it('doorbellController.getContractAddress throws if not deployed to network', async () => {
            let message = '';
            try {
                await doorbellController.getContractAddress();
            } catch (e) {
                ({ message } = e);
            }
            expect(message).to.equal('Doorbell.sol not deployed to network 0');
        });
    });
});
