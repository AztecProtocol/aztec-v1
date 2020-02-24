/* eslint-disable no-return-assign */
/* eslint-disable no-console */
/* eslint-disable func-names */
/* eslint-disable arrow-body-style */
/* eslint-disable no-unused-vars */
/* eslint-disable no-return-await */
/* eslint-disable no-underscore-dangle */
/* eslint-disable consistent-return */
/* eslint-disable object-shorthand */
const uuid = require('uuid');

module.exports = {
    createPageObject: async function (page, metadata) {
        const environment = this;
        const data = {
            id: uuid.v4(),
            api: page,
            aztecContext: false,
            metadata,
            clickMain: async function (selector = 'button') {
                const main = await this.api.waitFor(selector);
                if (environment.debug) await this.screenshot(`${Date.now()}-click.png`);
                await main.click();
            },
            typeMain: async function (text, selector = 'input') {
                const main = await this.api.waitFor(selector);
                await main.type(text);
                if (environment.debug) await this.screenshot(`${Date.now()}-type.png`);
            },
            close: async function () {
                if (this.aztecContext) return;
                try {
                    await this.api.close();
                } catch (e) {
                    // console.log('page already closed');
                }
                delete environment.openPages[this.id];
            },
            initialiseAztec: async function (callback) {
                this.aztecContext = true;
                await this.api.waitFor(() => !!window.aztec);
                await this.api.evaluate(() => window.aztec.autoRefreshOnProfileChange = false);
                await this.api.evaluate(() => {
                    return window.aztec.enable();
                });
                callback();
            },
            triggerDeposit: async function (assetAddress, toAddress, amount, callback) {
                await this.api.waitFor(() => !!window.aztec);
                // eslint-disable-next-line no-shadow
                await this.api.evaluate(async (address, userAddress, amount) => {
                    return (await window.aztec.zkAsset(address)).deposit([
                        {
                            to: userAddress,
                            amount: amount,
                        },
                    ],
                    {});
                }, assetAddress, toAddress, amount);
                callback();
            },
            triggerSend: async function (assetAddress, toAddress, amount, callback) {
                await this.api.waitFor(() => !!window.aztec);

                // eslint-disable-next-line no-shadow
                await this.api.evaluate(async (address, userAddress, amount) => {
                    return (await window.aztec.zkAsset(address)).send([
                        {
                            to: userAddress,
                            amount: amount,
                        },
                    ],
                    {});
                }, assetAddress, toAddress, amount);

                callback();
            },
            triggerWithdraw: async function (assetAddress, amount, callback) {
                await this.api.waitFor(() => !!window.aztec);

                // eslint-disable-next-line no-shadow
                await this.api.evaluate(async (address, amount) => {
                    return (await window.aztec.zkAsset(address)).withdraw(amount);
                }, assetAddress, amount);

                callback();
            },
            screenshot: async function (fileName) {
                const name = fileName || `${Date.now()}.png`;
                const path = `${environment.screenshotPath}/${name}`;
                if (environment.observeTime !== 0) await environment.wait(environment.observeTime);
                await this.api.screenshot({ path });
            },
            sdk: {
                maxRetries: 10,
                clickMain: async function (selector = 'button', numRetries = 0) {
                    try {
                        const frame = await this.waitForFrame(environment.popupFrameName);
                        const main = await frame.waitFor(selector);
                        await main.click();
                    } catch (e) {
                        if (numRetries < this.maxRetries) {
                            await environment.wait(1000);
                            return this.clickMain(selector, numRetries + 1);
                        }
                        throw new Error('Could not complete clickMain');
                    }
                },
                typeMain: async function (text, selector = 'input', numRetries = 0) {
                    try {
                        const frame = await this.waitForFrame(environment.popupFrameName);
                        await frame.waitFor(selector);
                        await frame.type(selector, text);
                    } catch (e) {
                        if (numRetries < this.maxRetries) {
                            await environment.wait(1000);
                            return this.typeMain(text, selector, numRetries + 1);
                        }
                        throw new Error('Could not complete typeMain');
                    }
                },
                waitForFrame: async function (frameName) {
                    let fulfill;
                    const promise = new Promise(resolve => fulfill = resolve);
                    // eslint-disable-next-line no-use-before-define
                    checkFrame();
                    return promise;

                    function checkFrame() {
                        const frame = page.frames().find(f => f.name() === frameName);
                        if (frame) {
                            fulfill(frame);
                        } else {
                            page.once('framenavigated', checkFrame);
                        }
                    }
                },
            },
        };
        environment.openPages[data.id] = (data);
        if (environment.debug) await data.screenshot(`${Date.now()}-open.png`);
        return data;
    },
    newLog: async function (page, substring) {
        await new Promise((resolve, reject) => {
            page.on('console', (msg) => {
                if (msg.text().includes(substring)) {
                    resolve();
                }
            });
        });
    },
    getExtensionBackground: async function (extensionName) {
        const targets = await this.browser.targets();

        return targets.find(({ _targetInfo }) => {
            return _targetInfo.title === (extensionName || this.extensionName) && _targetInfo.type === 'background_page';
        });
    },
    getPage: async function (predicate) {
        const target = await this.browser.waitForTarget(predicate);

        const page = await target.page();
        return await this.createPageObject(page, { link: target._targetInfo.url });
    },
    openPage: async function (link) {
        const page = await this.browser.newPage();
        await page.goto(link);

        return this.createPageObject(page, { link });
    },
    openContent: async function (content) {
        const page = await this.browser.newPage();
        await page.goto('https://www.aztecprotocol.com');
        await page.setContent(content);

        return this.createPageObject(page, { content });
    },
    findAndClosePage: async function (predicate) {
        const page = await this.getPage(predicate);
        await page.close();
    },
    wait: ms => new Promise(r => setTimeout(r, ms)),
};
