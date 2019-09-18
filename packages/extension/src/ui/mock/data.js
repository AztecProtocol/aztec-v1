import {
    randomId,
    randomInt,
} from '~utils/random';
import compoundLogo from './images/compound.png';

const randomAddress = () => `0x${randomId(40)}`;

export const seedPhrase = 'oyster lemon tornado cat hamster basic similar vote priority purchase planet idle';

export const addresses = [
    '0x3339C3c842732F4DAaCf12aed335661cf4eab66b',
    randomAddress(),
    randomAddress(),
    randomAddress(),
];

export const assets = [
    {
        code: 'dai',
        address: randomAddress(),
        balance: 0.51232,
    },
    {
        code: 'usdc',
        address: randomAddress(),
        balance: 2832.21,
    },
    {
        code: 'cc',
        address: randomAddress(),
        balance: 0,
    },
    {
        code: 'da',
        address: randomAddress(),
        balance: 0,
    },
    {
        code: 'ec',
        address: randomAddress(),
        balance: 0,
    },
    {
        code: 'ffc',
        address: randomAddress(),
        balance: 0,
    },
    {
        code: 'ica',
        address: randomAddress(),
        balance: 0,
    },
];

export const domains = [
    {
        name: 'Compound Finance',
        iconSrc: compoundLogo,
        url: 'https://compound.finance/',
    },
];

export const pastTransactions = [
    {
        type: 'deposit',
        asset: assets[0],
        address: addresses[0],
        value: 50,
        timestamp: Date.now() - 40 * 1000,
    },
    {
        type: 'deposit',
        asset: assets[1],
        address: addresses[0],
        value: 1000,
        timestamp: Date.now() - 60 * 60 * 1000,
    },
    {
        type: 'send',
        asset: assets[0],
        address: addresses[0],
        value: 0.12,
        timestamp: Date.now() - 2 * 24 * 60 * 60 * 1000,
    },
    {
        type: 'withdraw',
        asset: assets[0],
        address: addresses[0],
        value: 1.523,
        timestamp: Date.now() - 45 * 24 * 60 * 60 * 1000,
    },
];
