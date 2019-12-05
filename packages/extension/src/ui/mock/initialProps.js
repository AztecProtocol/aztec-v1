import {
    randomId,
    randomInt,
} from '~utils/random';
import {
    seedPhrase,
    linkedPublicKey,
    addresses,
    assets,
    domains,
    notes,
    pastTransactions,
    depositTransactions,
    withdrawTransactions,
    sendTransactions,
    generate,
    randomAddress,
    randomRawNote,
} from './data';

const dummyFunc = () => {};

const address = addresses[0];

export default {
    register: {
        address,
    },
    'register.backup': {
        seedPhrase,
    },
    'register.password': {},
    'register.link': {
        address,
        linkedPublicKey,
    },
    'register.confirm': {
        address,
        linkedPublicKey,
    },
    'register.address': {
        currentAccount: {
            address,
            linkedPublicKey,
        },
    },
    'register.domain': {
        domain: domains[0],
    },
    'account.restore': {
        currentAccount: {
            address,
            linkedPublicKey,
        },
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
            .filter(({ asset }) => asset.address === assets[0].address)
            .slice(0, 2),
    },
    'account.duplicated': {
        address: addresses[0],
        goNext: dummyFunc,
    },
    deposit: {
        from: addresses[0],
        sender: addresses[1],
        assetAddress: assets[0].address,
        transactions: [depositTransactions[0]],
    },
    'deposit.approve': {
        asset: assets[0],
        amount: depositTransactions.reduce((sum, tx) => sum + tx.amount, 0),
    },
    withdraw: {
        assetAddress: assets[0].address,
        sender: addresses[0],
        transactions: withdrawTransactions,
    },
    'withdraw.sign': {
        proof: {
            inputNotes: generate(5, () => ({
                noteHash: `0x${randomId()}`,
                k: {
                    words: [randomInt(100)],
                },
            })),
        },
    },
    send: {
        assetAddress: assets[0].address,
        sender: addresses[0],
        transactions: sendTransactions.slice(0, 1),
    },
    'send.sign': {
        proof: {
            inputNotes: generate(3, () => ({
                noteHash: `0x${randomId()}`,
                k: {
                    words: [randomInt(100)],
                },
            })),
        },
    },
    noteAccess: {
        id: notes[0].noteHash,
        addresses,
    },
    createNote: {
        assetAddress: assets[0].address,
        amount: randomInt(1, 100),
        owner: randomAddress(),
        numberOfOutputNotes: 1,
    },
    'createNote.sign': {
        proof: {
            inputNotes: generate(5, randomRawNote),
        },
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
    'playground.icons.notes': {
        type: 'note',
        noteHashes: [
            ...generate(20, () => `0x${randomId(64)}`),
        ],
    },
};
