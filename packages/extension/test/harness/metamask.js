/* eslint-disable prefer-destructuring */
/* eslint-disable space-before-function-paren */
/* eslint-disable func-names */
/* eslint-disable object-shorthand */


async function Metamask() {
    const environment = this;
    const metamask = {
        initialised: false,
        metadata: {
            link: undefined,
        },
        find: async function(specifier) {
            let extensionLink = this.metadata.link;
            if (specifier) extensionLink = `${extensionLink}#${specifier}`;
            return environment.getPage(({ _targetInfo }) => _targetInfo.url.match(extensionLink));
        },
        open: async function(specifier) {
            let extensionLink = this.metadata.link;
            if (specifier) extensionLink = `${extensionLink}#${specifier}`;
            const targets = await environment.browser.targets();
            const target = targets.find(({ _targetInfo }) => _targetInfo.url.match(extensionLink));

            // eslint-disable-next-line curly
            if (target) return environment.createPageObject(await target.page(), {
                link: extensionLink,
            });
            return environment.openPage(extensionLink);
        },
        findPopup: async function() {
            const popup = await environment.getPage(target => target.url().match(/notification/));
            return popup;
        },
        approve: async function() {
            const popup = await this.findPopup();
            await popup.clickMain('.btn-primary');
        },
        sign: async function() {
            const popup = await this.findPopup();
            await popup.clickMain("//button[contains(., 'Sign')]");
        },
        confirm: async function() {
            const popup = await this.findPopup();
            await popup.clickMain('.btn-primary');
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
            await page.typeMain('password1234', '#password');
            await page.typeMain('password1234', '#confirm-password');
            await page.clickMain('.first-time-flow__checkbox');
            await page.clickMain();
            page = await this.find('initialize/end-of-flow');
            await page.clickMain('.btn-primary');
        },
        addAccount: async function(privateKey) {
            const extension = await this.open('new-account/import');

            await extension.typeMain(privateKey, '#private-key-box');
            await extension.clickMain('.btn-secondary');
        },
        switchAccount: async function(accountNum) {
            const extension = await this.open();
            await extension.api.bringToFront();
            await extension.clickMain('.account-menu__icon');
            await extension.clickMain(`//div[contains(text(), 'Account ${accountNum}')]`);
        },
    };

    const page = await environment
        .getPage(target => target.url().match(/initialize\/welcome/));

    metamask.initialised = true;
    metamask.metadata.link = page.metadata.link.split('#')[0];

    environment.metamask = metamask;
}

module.exports = Metamask;
