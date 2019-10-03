module.exports = {
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
    clean: async function() {
        return Promise.all(this.openPages.map(async page => page.close()))
    },
}