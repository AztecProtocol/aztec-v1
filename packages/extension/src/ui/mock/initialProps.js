import {
    randomInt,
} from '~utils/random';
import {
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
        asset: assets[0],
        user: {
            address: addresses[0],
        },
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
};
