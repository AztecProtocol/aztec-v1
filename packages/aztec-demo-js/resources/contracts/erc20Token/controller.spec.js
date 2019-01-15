/* eslint-disable prefer-arrow-callback */

const chai = require('chai');
const crypto = require('crypto');
const sinon = require('sinon');

const { clear: clearDatabase } = require('../../../db');
const walletsController = require('../../wallets');
const erc20Controller = require('./controller');
const transactionsController = require('../../transactions');
const web3 = require('../../../web3Listener');
const { TX_STATUS } = require('../../../config');
const deployer = require('../../../deployer');

const ERC20Mintable = require('../../../contracts/ERC20Mintable');

const { expect } = chai;

describe('erc20 tests', () => {
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

        it('ERC20Mintable.sol is deployed to network', async () => {
            const address = await erc20Controller.getContractAddress();
            expect(address).to.be.a('string');
            expect(address.length).to.equal(42);

            const deployedBytecode = await web3.eth.getCode(address);
            expect(deployedBytecode)
                .to.equal(ERC20Mintable.deployedBytecode);
        });

        it('can issue erc20 mint transaction', async () => {
            const mintTxHash = await erc20Controller.mint(wallets[0].address, wallets[1].address, 1000);
            const mintReceipt = await transactionsController.getTransactionReceipt(mintTxHash);

            expect(mintReceipt.status).to.equal(true);

            const contractAddress = await erc20Controller.getContractAddress();
            const contract = erc20Controller.contract(contractAddress);
            const balance = await contract.methods.balanceOf(wallets[1].address).call();
            expect(balance.toString(10)).to.equal('1000');
        });

        it('can issue erc20 approval transaction', async () => {
            const mintTxHash = await erc20Controller.mint(wallets[0].address, wallets[1].address, 1000);
            const mintReceipt = await transactionsController.getTransactionReceipt(mintTxHash);
            expect(mintReceipt.status).to.equal(true);
            expect(transactionsController.get(mintTxHash).status).to.equal(TX_STATUS.MINED);

            const approveTxHash = await erc20Controller.approve(wallets[1].address, wallets[0].address, 1000);
            const approveReceipt = await transactionsController.getTransactionReceipt(approveTxHash);
            expect(approveReceipt.status).to.equal(true);
            expect(transactionsController.get(approveTxHash).status).to.equal(TX_STATUS.MINED);

            const contractAddress = await erc20Controller.getContractAddress();
            const contract = erc20Controller.contract(contractAddress);
            const allowance = await contract.methods.allowance(wallets[1].address, wallets[0].address).call();
            expect(allowance.toString(10)).to.equal('1000');
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

        it('erc20Controller.getContractAddress throws if not deployed to network', async () => {
            let message = '';
            try {
                await erc20Controller.getContractAddress();
            } catch (e) {
                ({ message } = e);
            }
            expect(message).to.equal('ERC20Mintable.sol not deployed to network 0');
        });
    });
});
