import BN from 'bn.js';
import {
    randomId,
    randomInt,
} from '~/utils/random';
import makeAsset from '~uiModules/utils/makeAsset';
import {
    linkedPublicKey,
    addresses,
    assets,
    domains,
    generate,
    randomAddress,
    randomAccount,
} from './data';

const dummyFunc = () => {};

const address = addresses[0];

export default {
    register: {
        address,
        AZTECaddress: randomAddress(),
        linkedPublicKey,
    },
    'register.address': {
        address,
        AZTECaddress: randomAddress(),
        linkedPublicKey,
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
    deposit: () => {
        const depositTransactions = generate(2, i => ({
            amount: randomInt(1, 10000),
            to: addresses[i + 1],
        }));

        return {
            asset: makeAsset(assets[0]),
            publicOwner: randomAddress(),
            transactions: depositTransactions,
            amount: depositTransactions.reduce((sum, tx) => sum + tx.amount, 0),
            userAccessAccounts: [
                {
                    address: randomAddress(),
                },
            ],
        };
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
        asset: makeAsset(assets[0]),
        currentAddress: addresses[0],
        amount: randomInt(1, 10000),
        publicOwner: randomAddress(),
        spender: addresses[1],
        proofHash: `0x${randomId(150)}`,
    },
    send: () => {
        const sendTransactions = generate(2, () => ({
            amount: randomInt(1, 10000),
            to: addresses[randomInt(1, addresses.length - 1)],
        }));

        return {
            asset: makeAsset(assets[0]),
            sender: randomAddress(),
            transactions: sendTransactions,
            amount: sendTransactions.reduce((sum, tx) => sum + tx.amount, 0),
            userAccessAccounts: [
                {
                    address: randomAddress(),
                },
            ],
            spender: addresses[1],
            proofHash: `0x${randomId(150)}`,
        };
    },
    noteAccess: {
        asset: makeAsset(assets[0]),
        amount: randomInt(1, 10000),
        userAccessAccounts: generate(2, randomAccount),
        isGSNAvailable: true,
    },
    'noteAccess.MetaMask': {
        isGSNAvailable: false,
    },
    createNote: {
        asset: makeAsset(assets[0]),
        amount: randomInt(1, 100),
        currentAddress: addresses[0],
        userAccessAccounts: generate(2, randomAccount),
        spender: addresses[1],
        proofHash: `0x${randomId(150)}`,
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
