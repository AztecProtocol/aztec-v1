async function createAccount() {
    const environment = this;
    if (!environment.browser) {
        throw new Error('Please initialise your environment first');
    }

    let extensionPage = await environment.openExtension();
    await extensionPage.clickMain();
    
    await environment.metamask.approve();

    await environment.findAndClosePage(({ _targetInfo }) => _targetInfo.title === 'https://www.aztecprotocol.com')

    extensionPage = await environment.openExtension();
    await extensionPage.clickMain();

    const registerPage = await environment.getPage(target => target.url().match(/register/));
    await registerPage.clickMain();
    await registerPage.clickMain();
    await registerPage.clickMain();

    await registerPage.typeMain('password');

    await registerPage.clickMain();
    await registerPage.clickMain();

    await environment.metamask.sign();

    const aztecProtocolPage = await environment.getPage(({ _targetInfo }) => _targetInfo.title === 'https://www.aztecprotocol.com');
    await aztecProtocolPage.api.bringToFront();
    await aztecProtocolPage.api.reload();

    const authorizePage = await environment.getPage(target => target.url().match(/register\/domain/));
    await authorizePage.clickMain();

    extensionPage = await environment.openExtension();
    await environment.clean();
}

module.exports = {
    createAccount
}