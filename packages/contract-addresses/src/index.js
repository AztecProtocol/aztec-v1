const { isUndefined } = require('lodash');

const mainnetAddresses = require('../addresses/mainnet');
const rinkebyAddresses = require('../addresses/rinkeby');
const ropstenAddresses = require('../addresses/ropsten');

const NetworkId = {
    Mainnet: '1',
    Ropsten: '3',
    Rinkeby: '4',
    Ganache: '1234',
};

const networkToAddresses = {
    '1': {
        ...mainnetAddresses,
    },
    '3': {
        ...ropstenAddresses,
    },
    '4': {
        ...rinkebyAddresses,
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
const getContractAddressesForNetwork = (networkId) => {
    if (isUndefined(networkToAddresses[networkId])) {
        throw new Error(`Unknown network id (${networkId}). No known AZTEC contracts have been deployed on this network.`);
    }
    return networkToAddresses[networkId];
};

module.exports = {
    getContractAddressesForNetwork,
    NetworkId,
};
