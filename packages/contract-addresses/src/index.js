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
        ace: '0x79d210b65C01ec9cBa9424983e0afdFBEb5E212f',
        aztec: '0xE353F15D0690f064455CD19AdA6AC60C59ee901E',
        aztecErc20Bridge: '0xC0C887e992746d370Dce4704c6CD70A0546Cbe41',
        doorbell: '0x33CF6Fd048650BcE2c9B56A73ae606aCD5A29E94',
        erc20Mintable: '0x5e1f3f7d8712f0FF2b73969263aFa89d4E25C987',
        joinSplit: '0x3E526b96CD8955a2f84c176237A31F6EEFB8f1c0',
    },
    4: {
        ace: '0x9b8Eb39bb0aF99D95066E7e60883fa0461Ac1C65',
        aztec: '0xf2d68f5D6C826A58fdAe08d176A3F7fB5AdBd85f',
        aztecErc20Bridge: '0x5a2DE5b11cfDA9D7D3C10e0220D9e7008a480642',
        erc20Mintable: '0x08F3484bBE7501d1614B40f07D9bE0eeb007a80c',
        doorbell: '0xf45FF560ad8e7e06B64505CAe76472F432a99b9C',
        joinSplit: '0x0b092b1B1496636d0e5721bC6cB0Ec27E99d47A0',
    },
    42: {
        ace: '0x3dAEf97C8F235C4C2a6186D1e326cC84b2DdeE87',
        aztec: '0xFd1295B71E8476e0C07E7c0e5FF2cB822cb10941',
        aztecErc20Bridge: '0xF57eF7edebb3313f0684953A9aDBE55e5A0C67B2',
        erc20Mintable: '0xa1D05f6994A1b982a4E44A4372E1C6D7F544c3fF',
        doorbell: '0x6eB77536c0C3DfCBa4825E7f31719D80B8aA9cBD',
        joinSplit: '0xC5C6A6372d16C902422380c5E1a4f73838b6ebEF',
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
        throw new Error(
            `Unknown network id (${networkId}). No known AZTEC contracts have been deployed on this network.`,
        );
    }
    return networkToAddresses[networkId];
}
