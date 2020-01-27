import BN from 'bn.js';
import {
    userAccount,
} from '~testHelpers/testUsers';
import {
    randomId,
    randomInt,
} from '~/utils/random';
import daiIcon from '~/ui/images/tokens/dai.png';
import usdcIcon from '~/ui/images/tokens/usdc.png';
import compoundLogo from './images/compound.png';

export const generate = (count, generator) => {
    const data = [];
    for (let i = 0; i < count; i += 1) {
        data.push(generator(i));
    }
    return data;
};

export const randomAddress = () => `0x${randomId(40)}`;

export const randomRawNote = () => ({
    noteHash: `0x${randomId()}`,
    k: new BN(randomInt(100)),
});

export const seedPhrase = 'oyster lemon tornado cat hamster basic similar vote priority purchase planet idle';

export const password = 'password01';

const {
    linkedPublicKey,
    linkedPrivateKey,
    spendingPublicKey,
} = userAccount;

export {
    linkedPublicKey,
    linkedPrivateKey,
    spendingPublicKey,
};

export const addresses = [
    '0x3339C3c842732F4DAaCf12aed335661cf4eab66b',
    ...generate(3, randomAddress),
];

export const assets = [
    {
        name: 'Dai Stablecoin',
        symbol: 'DAI',
        decimals: 18,
        scalingFactor: new BN('10000000000000000'),
        address: randomAddress(),
        linkedTokenAddress: '0x6B175474E89094C44Da98b954EedeAC495271d0F',
        icon: daiIcon,
        balance: 0.51232,
    },
    {
        name: 'USD Coin',
        symbol: 'USDC',
        decimals: 6,
        scalingFactor: new BN(1),
        address: randomAddress(),
        linkedTokenAddress: '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48',
        icon: usdcIcon,
        balance: 2832.21,
    },
    {
        address: randomAddress(),
        linkedTokenAddress: '',
        balance: 0,
    },
    ...generate(5, () => ({
        scalingFactor: new BN(1),
        address: randomAddress(),
        linkedTokenAddress: randomAddress(),
        balance: 0,
    })),
];

export const sites = [
    {
        title: 'Aztec Protocol',
        url: 'https://www.aztecprotocol.com',
        domain: 'aztecprotocol.com',
        icons: [
            {
                href: 'https://www.aztecprotocol.com/icons/icon-144x144.png?v=d70c0dfad3304ef3eca84c656c8c63ab',
                sizes: '144x144',
            },
        ],
    },
];

export const domains = [
    {
        name: 'Compound Finance',
        iconSrc: compoundLogo,
        url: 'https://compound.finance/',
        domain: 'compound.finance',
    },
];

export const gsnConfig = {
    isGSNAvailable: false,
    proxyContract: randomAddress(),
};

export const notes = [
    {
        noteHash: `0x${randomId()}`,
        value: randomInt(100),
        asset: assets[0],
    },
    {
        noteHash: `0x${randomId()}`,
        value: randomInt(100),
        asset: assets[1],
    },
];

export const sendTransactions = generate(3, () => ({
    amount: randomInt(1, 100),
    to: addresses[randomInt(1, addresses.length - 1)],
}));
