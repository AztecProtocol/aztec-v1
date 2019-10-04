const puppeteer = require('puppeteer');
const dappeteer = require('dappeteer');
const path = require('path');

const scenarios = require('./scenarios');
const steps = require('./steps');

async function init(extensionPath, {
    metamaskPath = path.resolve(__dirname + '/../../../../node_modules/dappeteer/metamask/5.3.0/'),
    extensionName = "AZTEC",
    network = 'localhost',
    extensionHomePage = 'pages/defaultPopup.html',
    screenshotPath = path.resolve(__dirname + '/screenshots'),
    debug = false,
    observeTime = 0,
} = {}) {
    const environment = {
        extension: undefined,
        metamask: undefined,
        metadata: {},
        openPages: [],
        debug,
        screenshotPath,
        observeTime,
        ...steps,
        ...scenarios,
        clean: async function() {
            return Promise.all(this.openPages.map(async page => page.close()))
        },
    };

    environment.extensionName = extensionName;
    environment.browser = await dappeteer.launch(puppeteer, {
        headless: false, // extension are allowed only in head-full mode
        args: [
            `--disable-extensions-except=${extensionPath},${metamaskPath}`,
            `--load-extension=${extensionPath}`
        ]
    });

    environment.metamask = await dappeteer.getMetamask(environment.browser);
    await environment.metamask.switchNetwork(network);

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
