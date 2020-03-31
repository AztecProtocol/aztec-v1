import Aztec from '~/client/Aztec';

const initializeAZTEC = async () => {
    const aztec = new Aztec();
    await aztec.generateInitialApis();
    delete aztec.generateInitialApis;
    window.aztec = aztec;

    // TODO - callback's name should be configurable through url:
    // /sdk/aztec/?key=API_KEY&callback=aztecCallback
    if (typeof window.aztecCallback === 'function') {
        window.aztecCallback();
    }
};

const readyStates = [
    'complete',
    'interactive',
];

if (readyStates.indexOf(document.readyState) >= 0) {
    initializeAZTEC();
} else {
    document.addEventListener('DOMContentLoaded', () => {
        initializeAZTEC();
    });
}
