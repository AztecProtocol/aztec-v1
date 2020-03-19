/* eslint-disable max-len */
/* global artifacts, expect, contract, it:true */

// ### External Dependencies
const dotenv = require('dotenv');

const Environment = require('./harness');

const ACE = artifacts.require('@aztec/protocol/contracts/ACE/ACE.sol');
const ERC20Mintable = artifacts.require('@aztec/protocol/contracts/ERC20/ERC20Mintable.sol');
const ZkAssetOwnable = artifacts.require('@aztec/protocol/contracts/ERC1724/ZkAssetOwnable.sol');

dotenv.config();

contract('Extension', (accounts) => {
    const [user1, user2] = accounts;
    const totalBalance = 10000;
    const amountToDeposit = 500;
    const amountToSend = amountToDeposit / 2;
    const amountToWithdraw = 100;
    let environment;
    let zkAsset;
    let erc20;

    before(async () => {
        const ace = await ACE.deployed();
        erc20 = await ERC20Mintable.new();
        zkAsset = await ZkAssetOwnable.new(ace.address, erc20.address, 1);
        await zkAsset.setProofs(1, 17);
        await erc20.mint(user1, totalBalance);
        await erc20.mint(user2, totalBalance);
        await erc20.approve(ace.address, totalBalance);
        await erc20.approve(ace.address, totalBalance, { from: user2 });
        environment = await Environment.init({ debug: true, observeTime: 0 });
    });

    after(async () => {
        await environment.browser.close();
    });

    it('should successfully create an AZTEC account', async () => {
        await environment.createAccount();
        const homepage = await environment.getPage(target => target.url().match(/localhost/));
        await homepage.api.reload();

        await new Promise(resolve => homepage.initialiseAztec(resolve));
    });

    it('should set an AZTEC asset', async () => {
        const homepage = await environment.getPage(target => target.url().match(/localhost/));

        const asset = await homepage
            .api
            .evaluate(async address => window.aztec.zkAsset(address), zkAsset.address);
        expect(asset.address).to.equal(zkAsset.address);
        expect(asset.linkedTokenAddress).to.equal(erc20.address);
        const isValid = await homepage
            .api
            .evaluate(async address => (await window.aztec.zkAsset(address)).isValid(), zkAsset.address);
        expect(isValid).to.equal(true);
        const erc20Balance = await homepage
            .api
            .evaluate(async address => (await (await window.aztec.zkAsset(address)).balanceOfLinkedToken()).toString(10), zkAsset.address);
        expect(erc20Balance).to.equal(totalBalance.toString(10));
    });

    it('should deposit from an ERC20 to a zkAsset', async () => {
        await environment.clean();
        await environment.metamask.addAccount(process.env.GANACHE_TESTING_ACCOUNT_1);
        await environment.createAccount(false);

        await environment.wait(1000);

        await environment.deposit(zkAsset.address, user2, amountToDeposit);

        const homepage = await environment.getPage(target => target.url().match(/localhost/));
        const balance = await homepage
            .api
            .evaluate(async address => (await window.aztec.zkAsset(address)).balance(), zkAsset.address);
        expect(balance).to.equal(amountToDeposit);
    });

    it('should send zkNotes from one user to another', async () => {
        await environment.wait(2000);

        await environment.send(zkAsset.address, user1, amountToSend);

        await environment.metamask.switchAccount(1);
        const homepage = await environment.getPage(target => target.url().match(/localhost/));

        await homepage.api.bringToFront();

        await homepage.api.reload();

        await new Promise(resolve => homepage.initialiseAztec(resolve));

        // // await environment.wait(3000000);
        // const transferedBalance = await homepage
        //     .api
        //     .evaluate(async address => (await window.aztec.zkAsset(address)).balance(), zkAsset.address);
        // expect(transferedBalance).to.equal(amountToSend);
    });

    it('should withdraw from a zkAsset into an ERC20', async () => {
        await environment.metamask.switchAccount(2);
        const homepage = await environment.getPage(target => target.url().match(/localhost/));

        await homepage.api.bringToFront();

        await homepage.api.reload();

        await new Promise(resolve => homepage.initialiseAztec(resolve));

        const preWithdrawPublicBalance = await erc20.balanceOf(user2);

        await environment.withdraw(zkAsset.address, amountToWithdraw);

        const balance = await homepage
            .api
            .evaluate(async address => (await window.aztec.zkAsset(address)).balance(), zkAsset.address);

        expect(balance).to.equal((amountToDeposit - amountToSend) - amountToWithdraw);
        const postWithdrawPublicBalance = await erc20.balanceOf(user2);

        expect(preWithdrawPublicBalance.toNumber() + amountToWithdraw).to.equal(postWithdrawPublicBalance.toNumber());
    });
});
