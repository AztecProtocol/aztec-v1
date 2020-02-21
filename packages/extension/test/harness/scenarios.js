async function createAccount() {
    const environment = this;
    if (!environment.browser) {
        throw new Error('Please initialise your environment first');
    }

    const homepage = await environment.openPage('https://localhost:5550/');

    await new Promise(async (resolve) => {
        homepage.initialiseAztec(resolve);
        await environment.metamask.approve();

        await homepage.sdk.typeMain('password');
        await homepage.sdk.clickMain("//button[contains(., 'Create Encryption Keys')]");
        await homepage.sdk.clickMain("//button[contains(., 'Link Accounts')]");
        await environment.metamask.sign();
        await homepage.sdk.clickMain("//button[contains(., 'Send Transaction')]");
        await environment.metamask.confirm();
        await homepage.sdk.clickMain("//button[contains(., 'Grant Access')]");
    });
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
