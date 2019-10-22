/* global artifacts, expect, contract, beforeEach, it:true */

// ### External Dependencies
const { expect } = require('chai');
const chai = require('chai');
const dotenv = require('dotenv');
const path = require('path');
const truffleAssert = require('truffle-assertions');

const Environment = require('./harness');

const ACE = artifacts.require('@aztec/protocol/contracts/ACE/ACE.sol');
const ERC20Mintable = artifacts.require('@aztec/protocol/contracts/ERC20/ERC20Mintable.sol');
const ZkAssetOwnable = artifacts.require('@aztec/protocol/contracts/ERC1724/ZkAssetOwnable.sol');

const extensionPath = path.resolve(__dirname + '/../client');

dotenv.config();

function randomInt(from, to = null) {
    const start = to !== null ? from : 0;
    const offset = to !== null ? to - from : from;
    return start + Math.floor(Math.random() * (offset + 1));
}

contract.skip('Extension', (accounts) => {
    const [user] = accounts;
    const totalBalance = 10000;
    let environment;
    let zkAsset;
    let erc20;
    before(async () => {
        const ace = await ACE.deployed();
        erc20 = await ERC20Mintable.new();
        zkAsset = await ZkAssetOwnable.new(ace.address, erc20.address, 1);
        await zkAsset.setProofs(1, 17);
        await erc20.mint(user, totalBalance);
        await erc20.approve(ace.address, totalBalance);
        environment = await Environment.init(extensionPath, { debug: true, observeTime: 0 });
    });

    after(async () => {
        await environment.browser.close();
    });

    it.only('should successfully create an AZTEC account', async () => {
        await environment.createAccount();

        const extensionPage = await environment.openExtension();
        const header = await extensionPage.api.waitForXPath("//div[contains(., 'My Assets')]");
        expect(header).to.not.equal(undefined);
        await extensionPage.close();
    });

    it.only('should set an AZTEC asset', async () => {
        const homepage = Object.values(environment.openPages)
            .find(p => p.aztecContext === true);

        const asset = await homepage.api.evaluate(async (address) => await window.aztec.asset(address), zkAsset.address);
        expect(asset.address).to.equal(zkAsset.address);
        expect(asset.linkedTokenAddress).to.equal(erc20.address);
        const isValid = await homepage.api.evaluate(async (address) => (await window.aztec.asset(address)).isValid(), zkAsset.address);
        expect(isValid).to.equal(true);
        let erc20Balance = await homepage.api.evaluate(async (address) => (await window.aztec.asset(address)).balanceOfLinkedToken(), zkAsset.address);
        expect(erc20Balance).to.equal(totalBalance);
    });

    it.only('should complete a deposit', async () => {
        /// DEPOSIT
        const homepage = Object.values(environment.openPages)
            .find(p => p.aztecContext === true);
        const depositAmount = randomInt(1, 50);
        await homepage.api.evaluate(async (address, depositAmount, senderAddress, recipientAddress) => {
            try {
                (await window.aztec.asset(address)).deposit([{
                    amount: depositAmount,
                    to: recipientAddress,
                }], {
                    from: senderAddress,
                    sender: senderAddress,
                })
            } catch (e) {}
        }, zkAsset.address, depositAmount, user, user);

        const depositPage = await environment.getPage(target => target.url().match(/deposit/));
        await depositPage.clickMain();
        await environment.metamask.approve();
        const header = await depositPage.api.waitForXPath("//div[contains(., 'Transaction completed!')]");
        erc20Balance = await homepage.api.evaluate(async (address) => (await window.aztec.asset(address)).balanceOfLinkedToken(), zkAsset.address);
        expect(erc20Balance).to.equal(totalBalance - depositAmount);

        const newPage = await environment.openPage('https://www.aztecprotocol.com/');
        await newPage.api.waitFor(() => !!window.aztec);

        await newPage.initialiseAztec(true);

        await newPage.api.evaluate(async (address) => await window.aztec.asset(address), zkAsset.address);
        const bal = await newPage.api.evaluate(async (address) => await (await window.aztec.asset(address)).balance(), zkAsset.address);
    });

    it.only('should complete a withdraw', async () => {
        /// WITHDRAW
        const withdrawAmount = randomInt(1, depositAmount);
        await newPage.api.evaluate(async (address, withdrawAmount, senderAddress, recipientAddress) => {
            try {
                (await window.aztec.asset(address)).withdraw(withdrawAmount, {
                    sender: senderAddress,
                    from: senderAddress,
                    to: recipientAddress,
                })
            } catch (e) {}
        }, zkAsset.address, withdrawAmount, user, user);

        const withdrawPage = await environment.getPage(target => target.url().match(/withdraw/));

        await withdrawPage.clickMain();
        await environment.metamask.approve();
        await withdrawPage.api.waitForXPath("//div[contains(., 'Transaction completed!')]");
        erc20Balance = await homepage.api.evaluate(async (address) => (await window.aztec.asset(address)).balanceOfLinkedToken(), zkAsset.address);
        expect(erc20Balance).to.equal((totalBalance - depositAmount) + withdrawAmount);
    });

    it('should complete a send', async () => {

    });
});