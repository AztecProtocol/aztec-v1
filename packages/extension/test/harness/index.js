const puppeteer = require('puppeteer');
const dappeteer = require('dappeteer');
const path = require('path');

const scenarios = require('./scenarios');
const steps = require('./steps');

const wait = ms => new Promise(r => setTimeout(r, ms));

const Environment = {
    extension: undefined,
    metamask: undefined,
    metadata: {},
    openPages: [],
    init: async function(extensionPath, {
        metamaskPath = path.resolve(__dirname + '/../../../../node_modules/dappeteer/metamask/5.3.0/'),
        extensionName = "AZTEC",
        network = 'localhost',
        extensionHomePage = 'pages/defaultPopup.html',
    } = {}) {
        this.extensionName = extensionName;
        this.browser = await dappeteer.launch(puppeteer, {
            headless: false, // extension are allowed only in head-full mode
            args: [
                `--disable-extensions-except=${extensionPath},${metamaskPath}`,
                `--load-extension=${extensionPath}`
            ]
        });

        this.metamask = await dappeteer.getMetamask(this.browser);
        await this.metamask.switchNetwork(network);

        const extensionBackgroundTarget = await this.getExtensionBackground();
        const extensionUrl = extensionBackgroundTarget._targetInfo.url || '';
        const [,, extensionID] = extensionUrl.split('/');
    
        const extensionLink = `chrome-extension://${extensionID}/${extensionHomePage}`;
        this.metadata = {
            url: extensionUrl,
            id: extensionID,
            link: extensionLink
        };

        return this;
    },

    createPageObject: function (page, metadata) {
        const self = this;
        const data = {
            index: this.openPages.length,
            api: page,
            metadata,
            clickMain: async function(selector = "button") {
                const main = await this.api.$(selector);
                await main.click();
            },
            typeMain: async function(text, selector = "input") {
                const main = await this.api.$(selector);
                await main.type(text);
            },
            close: async function() {
                try {
                    await this.api.close();
                } catch (e) {
                    console.log('page already closed');
                }
                self.openPages.splice(this.index, 1);
            },
        };
        this.openPages.push(data);
        return data;
    },
    ...steps,
    ...scenarios
}

module.exports = Environment;
