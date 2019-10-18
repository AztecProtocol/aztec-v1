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

async function completeDeposit(assetAddress, depositAmount, sender, existingPage = false) {
    const environment = this;
    if (!environment.browser) {
        throw new Error('Please initialise your environment first');
    }

    let homepage;
    if (existingPage) {
        homepage = await environment.getPage(target => target.url().match(/.*aztecprotocol\.com/));
        await homepage.initialiseAztec();
    } else {
        homepage = await environment.openPage('https://www.aztecprotocol.com/');
    }

    const asset = await homepage.aztec.setAsset(assetAddress);

    // don't await to not block thread
    asset.eval('deposit', [{
        amount: depositAmount,
        to: sender,
    }], {
        from: sender,
        sender: sender,
    });

    const depositPage = await environment.getPage(target => target.url().match(/deposit/));
    await depositPage.clickMain();
    await environment.metamask.approve();
    const header = await depositPage.api.waitForXPath("//div[contains(., 'Transaction completed!')]");
}

async function completeWithdraw(assetAddress, withdrawAmount, sender, recipient, existingPage = false) {
    const environment = this;
    if (!environment.browser) {
        throw new Error('Please initialise your environment first');
    }

    let homepage;
    if (existingPage) {
        homepage = await environment.getPage(target => target.url().match(/.*aztecprotocol\.com/));
        await homepage.initialiseAztec();
    } else {
        homepage = await environment.openPage('https://www.aztecprotocol.com/');
    }

    const asset = await homepage.aztec.setAsset(assetAddress);

    // don't await to not block thread
    asset.eval('withdraw', withdrawAmount, {
        sender: sender,
        from: sender,
        to: recipient,
    });

    const withdrawPage = await environment.getPage(target => target.url().match(/withdraw/));

    await withdrawPage.clickMain();
    await environment.metamask.approve();
    await withdrawPage.api.waitForXPath("//div[contains(., 'Transaction completed!')]");
}

async function completeSend(assetAddress, sendAmount, sender, recipient, existingPage = false) {
    const environment = this;
    if (!environment.browser) {
        throw new Error('Please initialise your environment first');
    }

    let homepage;
    if (existingPage) {
        homepage = await environment.getPage(target => target.url().match(/.*aztecprotocol\.com/));
        await homepage.initialiseAztec();
    } else {
        homepage = await environment.openPage('https://www.aztecprotocol.com/');
    }

    const asset = await homepage.aztec.setAsset(assetAddress);

    // don't await to not block thread
    asset.eval('send', [{
        amount: sendAmount,
        to: recipient,
    }], {
        from: sender,
        sender: sender,
    });

    const sendPage = await environment.getPage(target => target.url().match(/send/));

    await sendPage.clickMain();
    await environment.metamask.approve();
    await withdrawPage.api.waitForXPath("//div[contains(., 'Transaction completed!')]");
}

module.exports = {
    createAccount,
    completeDeposit,
    completeWithdraw,
    completeSend,
}