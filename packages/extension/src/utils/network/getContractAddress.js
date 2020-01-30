import {
    getContractAddressesForNetwork,
} from '@aztec/contract-addresses';
import {
    warnLog,
} from '~/utils/log';
import * as contracts from '~/config/contracts';

export default function getContractAddress(contractName, networkId) {
    let address;

    if (process.env.NODE_ENV === 'production') {
        let addresses;
        try {
            addresses = getContractAddressesForNetwork(networkId);
        } catch (error) {
            addresses = {};
        }
        address = addresses[contractName];
    }

    if (!address) {
        const contract = contracts[contractName];
        if (!contract) {
            warnLog(`Contract ${contractName} is not defined in '~/config/contracts'`);
            return '';
        }

        const {
            networks,
            config,
            isProxyContract,
        } = contract;

        if (!isProxyContract) {
            address = (networks && networks[networkId]);

            if (!address && config && config.networks) {
                ({ address } = config.networks[networkId] || {});
            }
        }
    }

    return address || '';
}
