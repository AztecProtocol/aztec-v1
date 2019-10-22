const puppeteer = require('puppeteer');
const path = require('path');

const scenarios = require('./scenarios');
const steps = require('./steps');
const Metamask = require('./metamask');

async function init(extensionPath, {
    metamaskPath = path.resolve(__dirname + '/metamask-extension/'),
    metamaskMnemonic = process.env.GANACHE_TESTING_ACCOUNT_0_MNEMONIC,
    extensionName = "AZTEC",
    network = 'Localhost',
    extensionHomePage = 'pages/defaultPopup.html',
    screenshotPath = path.resolve(__dirname + '/screenshots'),
    debug = false,
    observeTime = 0,
} = {}) {
    const environment = {
        extension: undefined,
        metamask: undefined,
        metamaskInit: Metamask,
        metadata: {},
        openPages: {},
        debug,
        screenshotPath,
        observeTime,
        ...steps,
        ...scenarios,
        clean: async function() {
            return Promise.all(Object.values(this.openPages).map(async page => page.close()))
        },
    };
    environment.extensionName = extensionName;

    environment.browser = await puppeteer.launch({
        defaultViewport: null,
        devtools: true,
        slowMo: 0,
        headless: false, // extension are allowed only in head-full mode
        args: [
            `--disable-extensions-except=${extensionPath},${metamaskPath}`,
            `--load-extension=${extensionPath},${metamaskPath}`,
            // '--disable-dev-shm-usage'
        ]
    });

    await environment.metamaskInit();
    await environment.metamask.signup(metamaskMnemonic);
    await environment.metamask.selectNetwork(network);

    const extensionBackgroundTarget = await environment.getExtensionBackground();
    const extensionUrl = extensionBackgroundTarget._targetInfo.url || '';
    const [,, extensionID] = extensionUrl.split('/');

    const extensionLink = `chrome-extension://${extensionID}/${extensionHomePage}`;
    environment.metadata = {
        url: extensionUrl,
        id: extensionID,
        link: extensionLink,
        network,
    };

    return environment;
}

module.exports = {
    init
};