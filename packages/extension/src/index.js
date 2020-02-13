import Aztec from '~/client/Aztec';

document.addEventListener('DOMContentLoaded', () => {
    window.aztec = new Aztec();

    // TODO - callback's name should be configurable through url:
    // /sdk/aztec/?key=API_KEY&callback=aztecCallback
    if (typeof window.aztecCallback === 'function') {
        window.aztecCallback();
    }
});
