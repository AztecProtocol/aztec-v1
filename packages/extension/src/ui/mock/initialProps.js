const dummyFunc = () => {};

const seedPhrase = 'oyster lemon tornado cat hamster basic similar vote priority purchase planet idle';
const addresses = [
    '0x3339C3c842732F4DAaCf12aed335661cf4eab66b',
    '0x0563a36603911daaB46A3367d59253BaDF500bF9',
];
const assets = [
    {
        name: 'Dai',
        code: 'DAI',
        address: '0x',
        balance: 0,
    },
];

export default {
    '/register': {
        next: '/register/backup',
    },
    '/register/backup': {
        seedPhrase: 'oyster lemon tornado cat hamster basic similar vote priority purchase planet idle',
        prev: '/register',
        next: '/register/confirm',
    },
    '/register/confirm': {
        seedPhrase,
        prev: '/register/backup',
        next: '/register',
    },
    '/register/address': {
        address: addresses[0],
        currentStep: 0,
        goNext: dummyFunc,
    },
    '/assets': {
        assets,
    },
    '/restore-account': {
        goNext: dummyFunc,
    },
    '/deposit': {
        asset: assets[0],
        fromAddress: addresses[0],
        toAddresses: addresses.slice(1),
        amount: 500,
    },
    '/send': {
        asset: assets[0],
        fromAddress: addresses[0],
        toAddresses: addresses.slice(1),
        amount: 500,
    },
};
