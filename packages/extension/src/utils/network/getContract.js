import contracts from '~/config/contracts';
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

    return {
        contract: config,
        address: (networks && networks[networkId]) || '',
    };
}
