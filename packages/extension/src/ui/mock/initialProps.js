import {
    seedPhrase,
    addresses,
    assets,
    domains,
    pastTransactions,
} from './data';

const dummyFunc = () => {};

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
    '/register/restore-account': {
        goNext: dummyFunc,
    },
    '/register/domain': {
        domain: domains[0],
        assets: assets.slice(0, 10),
        goNext: dummyFunc,
    },
    '/account/assets': {
        assets,
        pastTransactions: pastTransactions.slice(0, 2),
    },
    '/account/asset': {
        ...assets[0],
        prev: '/account',
        pastTransactions: pastTransactions
            .filter(({ asset }) => asset.code === assets[0].code)
            .slice(0, 2),
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
