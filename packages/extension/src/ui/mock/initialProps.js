import {
    randomInts,
    randomInt,
} from '~utils/random';
import {
    generate,
    seedPhrase,
    addresses,
    assets,
    domains,
    notes,
    pastTransactions,
    sendTransactions,
} from './data';

const dummyFunc = () => {};

export default {
    register: {
        address: addresses[0],
        next: 'register.backup',
    },
    'register.backup': {
        seedPhrase: 'oyster lemon tornado cat hamster basic similar vote priority purchase planet idle',
        prev: 'register',
        next: 'register.confirm',
    },
    'register.confirm': {
        seedPhrase,
        prev: 'register.backup',
        next: 'register.password',
    },
    'register.password': {
        prev: 'register.confirm',
        next: 'register.address',
    },
    'register.address': {
        address: addresses[0],
        goNext: dummyFunc,
    },
    'register.domain': {
        domain: domains[0],
        assets: assets.slice(0, 10),
        goNext: dummyFunc,
    },
    'account.restore': {
        goNext: dummyFunc,
    },
    'account.login': {
        goNext: dummyFunc,
    },
    'account.assets': {
        assets,
        pastTransactions: pastTransactions.slice(0, 2),
    },
    'account.asset': {
        ...assets[0],
        prev: 'account',
        pastTransactions: pastTransactions
            .filter(({ asset }) => asset.code === assets[0].code)
            .slice(0, 2),
    },
    noteAccess: {
        note: notes[0],
        accounts: addresses.map(address => ({
            address,
        })),
        goNext: dummyFunc,
    },
    'noteAccess.confirm': {
        note: notes[0],
        accounts: addresses.map(address => ({
            address,
        })),
        goNext: dummyFunc,
    },
    'noteAccess.grant': {
        note: notes[0],
        accounts: addresses.map(address => ({
            address,
        })),
        goNext: dummyFunc,
    },
    deposit: {
        from: addresses[0],
        assetAddress: assets[0].address,
        transactions: [
            {
                amount: randomInt(1000),
                to: addresses[1],
            },
        ],
        goNext: dummyFunc,
    },
    'deposit.confirm': () => {
        const amounts = randomInts(3, 1000);
        return {
            asset: assets[0],
            from: addresses[0],
            transactions: generate(3, i => ({
                amount: amounts[i],
                to: addresses[i + 1],
            })),
            amount: amounts.reduce((sum, a) => sum + a, 0),
            goNext: dummyFunc,
        };
    },
    'deposit.grant': {
        asset: assets[0],
        from: addresses[0],
        transactions: [],
        amount: randomInt(1, 1000),
        goNext: dummyFunc,
    },
    withdraw: {
        asset: assets[0],
        sender: addresses[0],
        to: addresses[0],
        amount: randomInt(1, 1000),
        goNext: dummyFunc,
    },
    send: {
        asset: assets[0],
        user: {
            address: addresses[0],
        },
        transactions: sendTransactions,
        goNext: dummyFunc,
    },
    'send.confirm': {
        asset: assets[0],
        user: {
            address: addresses[0],
        },
        transactions: sendTransactions,
        goNext: dummyFunc,
    },
    'send.grant': {
        asset: assets[0],
        user: {
            address: addresses[0],
        },
        transactions: sendTransactions,
        goNext: dummyFunc,
    },
    mint: {
        asset: assets[0],
        user: {
            address: addresses[0],
        },
        amount: randomInt(1, 1000),
        goNext: dummyFunc,
    },
    burn: {
        asset: assets[0],
        user: {
            address: addresses[0],
        },
        amount: randomInt(1, 1000),
        goNext: dummyFunc,
    },
};
