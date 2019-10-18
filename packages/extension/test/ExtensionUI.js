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

contract.only('Extension', (accounts) => {
    const [user] = accounts;
    const totalBalance = 10000;
    let environment;
    let zkAsset;
    let erc20;
    let erc20Balance;
    let depositAmount;
    let homepage;
    let newPage; // do a better thing

    before(async () => {
        const ace = await ACE.deployed();
        erc20 = await ERC20Mintable.new();
        zkAsset = await ZkAssetOwnable.new(ace.address, erc20.address, 1);
        await zkAsset.setProofs(1, 17);
        await erc20.mint(user, totalBalance);
        await erc20.approve(ace.address, totalBalance);
        environment = await Environment.init(extensionPath, { debug: false, observeTime: 0 });
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
        homepage = Object.values(environment.openPages)
            .find(p => p.aztecContext === true);

        const address = zkAsset.address;
        const asset = await homepage.aztec.setAsset(address);
        expect(asset.linkedTokenAddress).to.equal(erc20.address);
        const isValid = await asset.eval('isValid');
        expect(isValid).to.equal(true);
        erc20Balance = await asset.eval('balanceOfLinkedToken');
        expect(erc20Balance).to.equal(totalBalance);
    });

    it.only('should complete a deposit', async () => {
        /// DEPOSIT
        depositAmount = randomInt(1, 50);
        const asset = await homepage.aztec.assets[zkAsset.address];

        // don't await to not block thread
        asset.eval('deposit', [{
            amount: depositAmount,
            to: user,
        }], {
            from: user,
            sender: user,
        });

        const depositPage = await environment.getPage(target => target.url().match(/deposit/));
        await depositPage.clickMain();
        await environment.metamask.approve();
        const header = await depositPage.api.waitForXPath("//div[contains(., 'Transaction completed!')]");
        erc20Balance = await asset.eval('balanceOfLinkedToken');
        expect(erc20Balance).to.equal(totalBalance - depositAmount);

        newPage = await environment.openPage('https://www.aztecprotocol.com/');
        await newPage.api.waitFor(() => !!window.aztec);

        await newPage.initialiseAztec(true);

        const newAsset = await newPage.aztec.setAsset(zkAsset.address);

        // not very pretty!
        await environment.wait(500);
        await newPage.aztec.initialise(true);

        const bal = await newAsset.eval('balance');
        expect(bal).to.equal(depositAmount);
    });

    it('should complete a withdraw', async () => {
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