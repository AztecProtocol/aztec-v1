module.exports = {
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
    getExtensionBackground: async function(extensionName) {
        const targets = await this.browser.targets();

        return targets.find(({ _targetInfo }) => {
            return _targetInfo.title === (extensionName || this.extensionName) && _targetInfo.type === 'background_page';
        });
    },
    getPage: async function(predicate) {
        const target = await this.browser.waitForTarget(predicate);

        const page = await target.page();
        return this.createPageObject(page, { link: target._targetInfo.url });
    },
    openPage: async function(link) {
        const page = await this.browser.newPage();
        await page.goto(link);

        return this.createPageObject(page, { link });
    },
    findAndClosePage: async function(predicate) {
        const page = await this.getPage(predicate);
        await page.close();
    },
    openExtension: async function() {
        const page = await this.openPage(this.metadata.link);
        return page;
    },
}