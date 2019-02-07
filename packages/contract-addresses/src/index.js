import { isUndefined } from 'lodash';

export const NetworkId = {
    Mainnet: 1,
    Ropsten: 3,
    Rinkeby: 4,
    Kovan: 42,
    Ganache: 1234,
};

const networkToAddresses = {
    1: {
        aztec: '0xbF58Dc0EDF212C0439C913A98DD95d328688B3eA',
        aztecErc20Bridge: '0xb8184c18c5541e437d98af1a31396fc304296e08',
    },
    3: {
        ace: '0x2112098d8E21C991fc7013DCd45866b8b61cb8D4',
        aztec: '0x455DF7B66aa3F0866Ea5f696Ed316B80c9E9df9c',
        aztecErc20Bridge: '0x656D4ae3983DaeD3177CB42360D0fA7C7D55C6d2',
        doorbell: '0xA2cB97d0ac53C63D153222141C134f8f016D9173',
        erc20Mintable: '0x0CB4c15E2aC21fbc69F20D6Dcc0207B1a7966649',
        joinSplit: '0xE65af4899F4e339D36e3F908a0bF78E47368C200',
    },
    4: {
        ace: '0xfd1521ba65dC7114F4FEF7A3Eea5fE4D24c0bec1',
        aztec: '0x5A4eb88F12eBdF638cAC617A268Fa90f9812D18F',
        aztecErc20Bridge: '0x0F2BEA90588B56fC710817f013e483cf50702362',
        erc20Mintable: '0x0f584e029D4BF601b55A988a376046D2F6416aB6',
        doorbell: '0x5f63cCd5584e8b38351f65AECE5ECc00Be16bA51',
        joinSplit: '0xE93965E8f7C1487dC4Ebb1c5239b2bDACba9401F',
    },
    42: {
        ace: '0x8bFe82edA5C3883fe0618b7654D57Fd2C23A07ED',
        aztec: '0xbFC0001e3772C81fD95C1fD007CA16Dc8097E058',
        aztecErc20Bridge: '0x1d1F868EB295C123878f9d163B1790f4948c4680',
        erc20Mintable: '0x23681aF8A95E9FD1A143eB8bC5B022795e375c40',
        doorbell: '0x0d723b74C3fFAf4c7d0E27F479a37232b715E447',
        joinSplit: '0x8d530B6e072FB8fBa381f371C133F968451BD0c9',
    },
};

/**
 * Used to get addresses of contracts that have been deployed to either the
 * Ethereum mainnet or a supported testnet. Throws if there are no known
 * contracts deployed on the corresponding network.
 * @param networkId The desired networkId.
 * @returns The set of addresses for contracts which have been deployed on the
 * given networkId.
 */
export function getContractAddressesForNetwork(networkId) {
    if (isUndefined(networkToAddresses[networkId])) {
        throw new Error(`Unknown network id (${networkId}). No known AZTEC contracts have been deployed on this network.`);
    }
    return networkToAddresses[networkId];
}
