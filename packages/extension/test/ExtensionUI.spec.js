// ### External Dependencies
const { expect } = require('chai');
const chai = require('chai');
const dotenv = require('dotenv');
const path = require('path');

const Environment = require('./harness');

const extensionPath = path.resolve(__dirname + '/../client');

dotenv.config();

describe.only('Extension', (accounts) => {
    let environment;
    before(async () => {
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
    });
});