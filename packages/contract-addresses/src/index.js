import { isUndefined } from 'lodash';

export const NetworkId = {
    Mainnet: 1,
    Ropsten: 3,
    Rinkeby: 4,
    Kovan: 42,
    Ganache: 1234,
};

const networkToAddresses = {
    3: {
        ACE: '0x606eDBb42422a1eeBCac46cfdA5A4EA200e85f4f',
        AdjustSupply: '0x4Ed21f3b9092ED2EBC9B02937362505f7d82832E',
        BilateralSwap: '0xAB685Be76346494e84eBa2883fc7C44ad66a1e84',
        DividendComputation: '0x27ca006a0BB5c4d68A7a7698970374dE01ee5722',
        ERC20Mintable: '0x4c9343CC183760244d4adbA8884eBB118A3d4BC0',
        JoinSplit: '0x0652a14d71CA555FAd45A2B6B1D278324c5019dc',
        ZkAsset: '0x717dBEd26D79EFcc435FDB02b4Abf31Aed2e38D2',
    },
    4: {
        ACE: '0x606eDBb42422a1eeBCac46cfdA5A4EA200e85f4f',
        AdjustSupply: '0x4Ed21f3b9092ED2EBC9B02937362505f7d82832E',
        BilateralSwap: '0xAB685Be76346494e84eBa2883fc7C44ad66a1e84',
        DividendComputation: '0x27ca006a0BB5c4d68A7a7698970374dE01ee5722',
        ERC20Mintable: '0x4c9343CC183760244d4adbA8884eBB118A3d4BC0',
        JoinSplit: '0x0652a14d71CA555FAd45A2B6B1D278324c5019dc',
        ZkAsset: '0x717dBEd26D79EFcc435FDB02b4Abf31Aed2e38D2',
    },
    42: {
        ACE: '0x606eDBb42422a1eeBCac46cfdA5A4EA200e85f4f',
        AdjustSupply: '0x4Ed21f3b9092ED2EBC9B02937362505f7d82832E',
        BilateralSwap: '0xAB685Be76346494e84eBa2883fc7C44ad66a1e84',
        DividendComputation: '0x27ca006a0BB5c4d68A7a7698970374dE01ee5722',
        ERC20Mintable: '0x4c9343CC183760244d4adbA8884eBB118A3d4BC0',
        JoinSplit: '0x0652a14d71CA555FAd45A2B6B1D278324c5019dc',
        ZkAsset: '0x717dBEd26D79EFcc435FDB02b4Abf31Aed2e38D2',
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
