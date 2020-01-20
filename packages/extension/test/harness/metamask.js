

async function Metamask() {
    const self = this;
    const metamask = {
        initialised: false,
        metadata: {
            link: undefined,
        },
        find: async function(specifier) {
            let extensionLink = this.metadata.link;
            if (specifier) extensionLink = `${extensionLink}#${specifier}`;
            return self.getPage(({ _targetInfo }) => _targetInfo.url.match(extensionLink));
        },
        open: async function(specifier) {
            let extensionLink = this.metadata.link;
            if (specifier) extensionLink = `${extensionLink}#${specifier}`;
            const targets = await self.browser.targets();
            const target = targets.find(({ _targetInfo }) => _targetInfo.url.match(extensionLink));

            if (target) return self.createPageObject(await target.page(), {
                link: extensionLink,
            });
            return self.openPage(extensionLink);
        },
        findPopup: async function() {
            return self.getPage(target => target.url().match(/notification/));
        },
        approve: async function() {
            const popup = await this.findPopup();
            await popup.clickMain('.btn-primary');
        },
        sign: async function() {
            const popup = await this.findPopup();
            await popup.clickMain('.request-signature__footer__sign-button');
        },
        selectNetwork: async function(networkSelector = 'Localhost') {
            const extension = await this.open();
            await extension.clickMain('.network-component');
            const btn = await extension.api.waitForXPath(`//span[contains(., '${networkSelector}')]`);
            await btn.click();
        },
        signup: async function(mnemonic) {
            let page = await this.open();
            await page.clickMain();
            const button = await page.api.waitForXPath("//button[contains(., 'Import Wallet')]");
            await button.click();
            await page.clickMain('.btn-default');
            await page.typeMain(mnemonic, 'textarea');
            await page.typeMain('password1234' ,'#password');
            await page.typeMain('password1234' ,'#confirm-password');
            await page.clickMain('.first-time-flow__checkbox');
            await page.clickMain();
            page = await this.find("initialize/end-of-flow");
            await page.clickMain('.btn-primary');
        },
        addAccount: async function(privateKey) {
            let extension = await this.open();
            await extension.clickMain('.account-menu__icon');
            let btn = await extension.api.waitForXPath(`//div[contains(@class, 'menu__item__text') and contains(//div, 'Import Account')]`);
            await btn.click();

            btn = await extension.api.waitForXPath(`//div[contains(@class, 'new-account__tabs__tab') and contains(., 'Import')]`);
            await btn.click();
            await page.typeMain(privateKey ,'#private-key-box');
            await extension.clickMain('.btn-secondary');
        },
    };

    const page = await self
        .getPage(target => target.url().match(/initialize\/welcome/));

    metamask.initialised = true;
    metamask.metadata.link = page.metadata.link.split('#')[0];

    self.metamask = metamask;
}

module.exports = Metamask;