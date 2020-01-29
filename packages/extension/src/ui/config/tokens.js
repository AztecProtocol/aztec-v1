import dai from '../images/tokens/dai.png';
import usdc from '../images/tokens/usdc.png';

export default {
    dai: {
        name: 'Dai',
        iconSrc: dai,
        networks: {
            mainnet: {
                address: '0x',
            },
        },
    },
    usdc: {
        name: 'USD Coin',
        iconSrc: usdc,
        decimal: 2,
        networks: {
            mainnet: {
                address: '0x',
            },
        },
    },
    cc: {
        name: 'C Coin',
        networks: {
            mainnet: {
                address: '0x',
            },
        },
    },
};
