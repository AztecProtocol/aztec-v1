async function createAccount(firstAccountCreation = true) {
    const environment = this;
    if (!environment.browser) {
        throw new Error('Please initialise your environment first');
    }

    const homepage = await environment.openPage('https://localhost:5550/');

    await new Promise(async (resolve) => {
        homepage.initialiseAztec(resolve);

        if (firstAccountCreation) {
            await environment.metamask.approve();
            await homepage.sdk.typeMain('password');
            await homepage.sdk.clickMain("//button[contains(., 'Create Encryption Keys')]");
        }
        await homepage.sdk.clickMain("//button[contains(., 'Link Accounts')]");
        await environment.metamask.sign();
        await homepage.sdk.clickMain("//button[contains(., 'Send Transaction')]");
        await environment.metamask.confirm();
        await homepage.sdk.clickMain("//button[contains(., 'Grant Access')]");
    });
}

async function deposit(assetAddress, to, amount) {
    const environment = this;
    const homepage = await environment.getPage(target => target.url().match(/localhost/));

    await new Promise(async (resolve) => {
        homepage.triggerDeposit(assetAddress, to, amount, resolve);

        await homepage.sdk.clickMain("//button[contains(., 'Approve Transaction')]");
        await environment.metamask.confirm();
        await homepage.sdk.clickMain("//button[contains(., 'Send Transaction')]");
        await environment.metamask.confirm();
    });
}

async function send(assetAddress, to, amount) {
    const environment = this;
    const homepage = await environment.getPage(target => target.url().match(/localhost/));

    await new Promise(async (resolve) => {
        homepage.triggerSend(assetAddress, to, amount, resolve);

        await homepage.sdk.clickMain("//button[contains(., 'Looks Good!')]");
        await environment.metamask.sign();
        await homepage.sdk.clickMain("//button[contains(., 'Send Transaction')]");
        await environment.metamask.confirm();
    });
}

module.exports = {
    createAccount,
    deposit,
    send,
};
