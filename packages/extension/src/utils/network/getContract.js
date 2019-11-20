import * as contracts from '~/config/contracts';
import {
    warnLog,
} from '~/utils/log';

export default function getContract(contractName, networkId) {
    const {
        config,
        networks,
    } = contracts[contractName] || {};
    if (!config) {
        warnLog(`Contract ${contractName} is not defined in '~/config/contracts'`);
    }

    let address = (networks && networks[networkId]);
    if (!address && config && config.networks[networkId]) {
        ({ address } = config.networks[networkId]);
    }

    return {
        contract: config,
        address: address || '',
    };
}
