import {
    randomInt,
} from '~utils/random';
import i18n from '~ui/helpers/i18n';
import {
    seedPhrase,
    addresses,
    assets,
    domains,
    notes,
    pastTransactions,
    depositTransactions,
    sendTransactions,
    generate,
    randomAddress,
} from './data';

const dummyFunc = () => {};

export default {
    register: {
        address: addresses[0],
        next: 'register.backup',
    },
    'register.backup': {
        seedPhrase,
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
        next: 'register.account',
    },
    'register.account': {
        initialStep: 4,
        initialData: {
            seedPhrase,
            password: 'password01',
        },
        prev: 'register.password',
        goNext: dummyFunc,
    },
    'register.address': {
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
    'account.restore.password': () => ({
        description: i18n.t('account.restore.password.description'),
        submitButtonText: i18n.t('account.restore.confirm'),
        goNext: dummyFunc,
    }),
    'account.restore.failed': {
        address: addresses[0],
        seedPhrase,
        isLinked: true,
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
    'account.duplicated': {
        address: addresses[0],
        goNext: dummyFunc,
    },
    noteAccess: {
        id: notes[0].noteHash,
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
        sender: addresses[1],
        assetAddress: assets[0].address,
        transactions: [depositTransactions[0]],
        goNext: dummyFunc,
    },
    'deposit.confirm': {
        asset: assets[0],
        from: addresses[0],
        transactions: depositTransactions,
        amount: depositTransactions.reduce((sum, tx) => sum + tx.amount, 0),
        goNext: dummyFunc,
    },
    'deposit.grant': {
        asset: assets[0],
        from: addresses[0],
        sender: addresses[1],
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
        assetAddress: assets[0].address,
        sender: addresses[0],
        transactions: sendTransactions.slice(0, 1),
        goNext: dummyFunc,
    },
    'send.confirm': {
        asset: assets[0],
        sender: addresses[0],
        transactions: sendTransactions,
        amount: sendTransactions.reduce((sum, tx) => sum + tx.amount, 0),
        goNext: dummyFunc,
    },
    'send.grant': {
        asset: assets[0],
        sender: addresses[0],
        transactions: sendTransactions,
        amount: sendTransactions.reduce((sum, tx) => sum + tx.amount, 0),
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
    'playground.icons.assets': {
        type: 'asset',
        addresses: [
            ...addresses,
            ...generate(20 - addresses.length, randomAddress),
        ],
    },
    'playground.icons.users': {
        type: 'user',
        addresses: [
            ...addresses,
            ...generate(20 - addresses.length, randomAddress),
        ],
    },
};
