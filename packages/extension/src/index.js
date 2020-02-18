import Aztec from '~/client/Aztec';

document.addEventListener('DOMContentLoaded', async () => {
    const aztec = new Aztec();
    await aztec.generateInitialApis();
    delete aztec.generateInitialApis;
    window.aztec = aztec;

    // TODO - callback's name should be configurable through url:
    // /sdk/aztec/?key=API_KEY&callback=aztecCallback
    if (typeof window.aztecCallback === 'function') {
        window.aztecCallback();
    }
});
