const uuid = require('uuid');

module.exports = {
    createPageObject: async function (page, metadata) {
        const environment = this;
        const data = {
            id: uuid.v4(),
            api: page,
            aztecContext: false,
            metadata,
            clickMain: async function(selector = "button") {
                const main = await this.api.waitFor(selector);
                if (environment.debug) await this.screenshot(`${Date.now()}-click.png`);
                await main.click();
            },
            typeMain: async function(text, selector = "input") {
                const main = await this.api.waitFor(selector);
                await main.type(text);
                if (environment.debug) await this.screenshot(`${Date.now()}-type.png`);
            },
            close: async function() {
                if (this.aztecContext) return;
                try {
                    await this.api.close();
                } catch (e) {
                    console.log('page already closed');
                }
                delete environment.openPages[this.id];
            },
            initialiseAztec: async function(wait = false) {
                this.aztecContext = true;
                await this.api.waitFor(() => !!window.aztec);
                await this.api.evaluate(async (wait) => {
                    try {
                        if (wait) {
                            return window.aztec.enable();
                        } else {
                            window.aztec.enable();
                            return ;
                        }
                    } catch (e) {
                        console.log(e);
                    }
                }, wait);
            },
            screenshot: async function(fileName) {
                const name = fileName || `${Date.now()}.png`;
                const path = `${environment.screenshotPath}/${name}`;
                if (environment.observeTime !== 0) await environment.wait(environment.observeTime);
                await this.api.screenshot({ path });
            },
            aztec: async function(address, amount) {
                console.log(`asset address: ${address}, amount: ${amount}`);
                await this.api.waitFor(() => {
                    return window.aztec.aztec.asset(address).balance() === amount;
                });
                
                
                // return {
                //     asset: function(address) {
                //         console.log(`asset address: ${address}`)
                //         return {
                //             balance: async (amount) => {
                //                 console.log(`balance desired: ${amount}`)

                //                 await api.waitFor(async () => {
                //                     console.log('treid to load balance')
                //                     return await window.aztec.asset(address).balance() === amount
                //                 });
                //             }
                //         }
                //     },
                // }
            },
        };
        environment.openPages[data.id] = (data);
        if (environment.debug) await data.screenshot(`${Date.now()}-open.png`);
        return data;
    },
    newLog: async function(page, substring) {
        await new Promise((resolve, reject) => {
            page.on('console', msg => {
                if (msg.text().includes(substring)) {
                    resolve();
                }
            });
        })
    },
    getExtensionBackground: async function(extensionName) {
        const targets = await this.browser.targets();

        return targets.find(({ _targetInfo }) => {
            return _targetInfo.title === (extensionName || this.extensionName) && _targetInfo.type === 'background_page';
        });
    },
    getPage: async function(predicate) {
        const target = await this.browser.waitForTarget(predicate);

        const page = await target.page();
        return await this.createPageObject(page, { link: target._targetInfo.url });
    },
    openPage: async function(link) {
        const page = await this.browser.newPage();
        await page.goto(link);

        return await this.createPageObject(page, { link });
    },
    findAndClosePage: async function(predicate) {
        const page = await this.getPage(predicate);
        await page.close();
    },
    openExtension: async function() {
        const page = await this.openPage(this.metadata.link);
        return page;
    },
    wait: ms => new Promise(r => setTimeout(r, ms)),
}