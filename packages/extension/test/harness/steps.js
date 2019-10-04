module.exports = {
    createPageObject: async function (page, metadata) {
        const environment = this;
        const data = {
            index: environment.openPages.length,
            api: page,
            metadata,
            clickMain: async function(selector = "button") {
                const main = await this.api.$(selector);
                if (environment.debug) await this.screenshot(`${Date.now()}-click.png`);
                await main.click();
            },
            typeMain: async function(text, selector = "input") {
                const main = await this.api.$(selector);
                await main.type(text);
                if (environment.debug) await this.screenshot(`${Date.now()}-type.png`);
            },
            close: async function() {
                try {
                    await this.api.close();
                } catch (e) {
                    console.log('page already closed');
                }
                environment.openPages.splice(this.index, 1);
            },
            screenshot: async function(fileName) {
                const name = fileName || `${Date.now()}.png`;
                const path = `${environment.screenshotPath}/${name}`;
                if (environment.observeTime !== 0) await environment.wait(environment.observeTime);
                await this.api.screenshot({ path });
            },
        };
        this.openPages.push(data);
        if (environment.debug) await data.screenshot(`${Date.now()}-open.png`);
        return data;
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