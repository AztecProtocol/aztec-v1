import BN from 'bn.js';
import {
    randomId,
    randomInt,
} from '~/utils/random';
import makeAsset from '~uiModules/utils/makeAsset';
import {
    seedPhrase,
    linkedPublicKey,
    addresses,
    assets,
    domains,
    notes,
    depositTransactions,
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
        linkedPublicKey: `0x${randomId(64)}`,
    },
    'register.confirm': {
        address,
        linkedPublicKey: `0x${randomId(64)}`,
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
    deposit: {
        asset: makeAsset(assets[0]),
        publicOwner: randomAddress(),
        transactions: depositTransactions,
        amount: depositTransactions.reduce((sum, tx) => sum + tx.amount, 0),
        userAccessAccounts: [
            {
                address: randomAddress(),
            },
        ],
    },
    'deposit.approve': ({
        asset,
        amount,
    }) => ({
        requestedAllowance: asset.scalingFactor.mul(new BN(amount)),
    }),
    'deposit.publicApprove': ({
        asset,
        amount,
    }) => ({
        requestedAllowance: asset.scalingFactor.mul(new BN(amount)),
    }),
    withdraw: {
        asset: assets[0],
        currentAddress: addresses[0],
        amount: randomInt(1, 100),
        publicOwner: randomAddress(),
    },
    'withdraw.sign': {
        proof: {
            inputNotes: generate(5, randomRawNote),
        },
    },
    send: {
        asset: makeAsset(assets[0]),
        sender: randomAddress(),
        transactions: sendTransactions,
        amount: depositTransactions.reduce((sum, tx) => sum + tx.amount, 0),
        userAccessAccounts: [
            {
                address: randomAddress(),
            },
        ],
    },
    'send.sign': {
        proof: {
            inputNotes: generate(3, randomRawNote),
        },
    },
    noteAccess: {
        id: notes[0].noteHash,
        addresses,
    },
    createNote: {
        asset: assets[0],
        amount: randomInt(1, 100),
        numberOfOutputNotes: 1,
        inputNotes: generate(1, randomRawNote),
        outputNotes: generate(2, randomRawNote),
        remainderNote: randomRawNote(),
        userAccessAccounts: [
            {
                address: randomAddress(),
            },
        ],
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
