async function createAccount() {
    const environment = this;
    if (!environment.browser) {
        throw new Error('Please initialise your environment first');
    }

    let homepage = await environment.openPage('https://www.aztecprotocol.com/');
    await homepage.initialiseAztec();

    await environment.metamask.approve();

    const registerPage = await environment.getPage(target => target.url().match(/register/));
    await registerPage.clickMain();
    await registerPage.clickMain();
    await registerPage.clickMain();

    await registerPage.typeMain('password');

    await registerPage.clickMain();
    await registerPage.clickMain();

    await environment.metamask.sign();

    const authorizePage = await environment.getPage(target => target.url().match(/register\/domain/));
    await authorizePage.clickMain();
}

async function restoreAccount(seedPhrase) {
    const environment = this;
    if (!environment.browser) {
        throw new Error('Please initialise your environment first');
    }

    const homepage = await environment.openPage('https://www.aztecprotocol.com/');
    await homepage.initialiseAztec();
    await environment.metamask.approve();

    const restorePage = await environment.getPage(target => target.url().match(/account\/restore/));
    await restorePage.typeMain(seedPhrase, 'textarea');
    await restorePage.clickMain();
    await restorePage.typeMain('password');
    await restorePage.clickMain();

    const registerDomainPage = await environment.getPage(target => target.url().match(/register\/domain/));
    await registerDomainPage.clickMain();
}

async function syncAsset(assetAddress, amount) {
    // const environment = this;
    // if (!environment.browser) {
    //     throw new Error('Please initialise your environment first');
    // }
    // const homepage = await environment.openPage('https://www.aztecprotocol.com/');
    // await homepage.initialiseAztec();

    // const asset = await homepage.api.evaluate(async (address) => await window.aztec.asset(address), assetAddress);
    // console.log(`asset address: ${asset.address}`);
    // console.log(`asset balance: ${asset.balance()}`);

    // await homepage.aztec(assetAddress, 0);

    // await accountPage.aztec().asset(assetAddress).balance(0);
    // console.log('Balance of the asset is zero');

    // await accountPage.aztec().asset(assetAddress).balance(amount);
    // console.log(`Balance of the asset is ${amount}`);
}

module.exports = {
    createAccount,
    restoreAccount,
    syncAsset,
};
