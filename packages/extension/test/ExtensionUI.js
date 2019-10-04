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

contract.only('Extension', (accounts) => {
    const [user] = accounts;
    let environment;
    before(async () => {
        const ace = await ACE.deployed();
        const erc20 = await ERC20Mintable.deployed();
        const zkAsset = await ZkAssetOwnable.new(ace.address, erc20.address, 1);
        await zkAsset.setProofs(1, 17);
        await erc20.mint(user, 10000);
        await erc20.approve(ace.address, 10000);
        environment = await Environment.init(extensionPath);
    });

    after(async () => {
        await environment.browser.close();
    });

    it('should successfully create an AZTEC account', async () => {
        await environment.createAccount();
        console.log('here!');

        const extensionPage = await environment.openExtension();
        const header = await extensionPage.api.waitForXPath("//div[contains(., 'My Assets')]");
        expect(header).to.not.equal(undefined);
    });

    // it('should run demo script', async () => {
    //     const homepage = await environment.openPage('https://www.aztecprotocol.com');
    //     await homepage.api.evaluate(() => window.aztec.enable());
    //     // const authorizePage = await environment.getPage(target => target.url().match(/register\/domain/));
    //     // await authorizePage.clickMain();
    //     // await homepage.api.reload();
    //     // await environment.metamask.sign();
    //     await environment.wait(100000);
    // });
});