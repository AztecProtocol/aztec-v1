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
    let zkAsset;
    let erc20;
    before(async () => {
        const ace = await ACE.deployed();
        erc20 = await ERC20Mintable.deployed();
        zkAsset = await ZkAssetOwnable.new(ace.address, erc20.address, 1);
        console.log(zkAsset.transactionHash);
        console.log(zkAsset.address);
        console.log(erc20.address)
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

        const extensionPage = await environment.openExtension();
        const header = await extensionPage.api.waitForXPath("//div[contains(., 'My Assets')]");
        expect(header).to.not.equal(undefined);
        await extensionPage.close();
    });

    it('should set an AZTEC asset', async () => {
        const homepage = Object.values(environment.openPages)
            .find(p => p.aztecContext === true);

        const asset = await homepage.api.evaluate(async (address) => await window.aztec.asset(address), zkAsset.address);
        expect(asset.address).to.equal(zkAsset.address);
        expect(asset.linkedTokenAddress).to.equal(erc20.address);
        const isValid = await homepage.api.evaluate(async (address) => (await window.aztec.asset(address)).isValid(), zkAsset.address);
        expect(isValid).to.equal(true);
        const erc20Balance = await homepage.api.evaluate(async (address) => (await window.aztec.asset(address)).balanceOfLinkedToken(), zkAsset.address);
        console.log(asset);
    });
});