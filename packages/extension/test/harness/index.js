/* eslint-disable no-underscore-dangle */
const puppeteer = require('puppeteer');
const path = require('path');
const fs = require('fs');

const scenarios = require('./scenarios');
const steps = require('./steps');
const Metamask = require('./metamask');

// open html page in pupeteer which loads sdk
// step through sign up and tx

async function init({
    metamaskPath = path.resolve(path.join(__dirname, '/metamask-extension/')),
    metamaskMnemonic = process.env.GANACHE_TESTING_ACCOUNT_0_MNEMONIC,
    network = 'Localhost',
    popupFrameName = 'AZTECSDK-POPUP',
    screenshotPath = path.resolve(path.join(__dirname, '/screenshots')),
    debug = false,
    observeTime = 0,
} = {}) {
    const environment = {
        extension: undefined,
        metamask: undefined,
        metamaskInit: Metamask,
        metadata: {},
        openPages: {},
        popupFrameName,
        debug,
        screenshotPath,
        observeTime,
        ...steps,
        ...scenarios,
        clean: async function clean() {
            return Promise.all(Object.values(this.openPages).map(async page => page.close()));
        },
    };

    environment.browser = await puppeteer.launch({
        defaultViewport: null,
        devtools: debug,
        slowMo: observeTime,
        headless: false, // extension are allowed only in head-full mode
        args: [
            `--disable-extensions-except=${metamaskPath}`,
            `--load-extension=${metamaskPath}`,
        ],
    });

    await environment.metamaskInit();
    await environment.metamask.signup(metamaskMnemonic);
    await environment.metamask.selectNetwork(network);

    return environment;
}

module.exports = {
    init,
};
