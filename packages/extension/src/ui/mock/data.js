export const seedPhrase = 'oyster lemon tornado cat hamster basic similar vote priority purchase planet idle';

export const addresses = [
    '0x3339C3c842732F4DAaCf12aed335661cf4eab66b',
    '0x0563a36603911daaB46A3367d59253BaDF500bF9',
];

export const assets = [
    {
        code: 'dai',
        address: '0x',
        balance: 0.51232,
    },
    {
        code: 'usdc',
        address: '0x',
        balance: 2832.21,
    },
    {
        code: 'cc',
        address: '0x',
        balance: 0,
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
