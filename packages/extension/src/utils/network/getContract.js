import * as contracts from '~/config/contracts';
import {
    warnLog,
} from '~/utils/log';
import getContractAddress from './getContractAddress';

export default function getContract(contractName, networkId) {
    const {
        config,
        isProxyContract,
    } = contracts[contractName] || {};
    if (!config) {
        warnLog(`Contract ${contractName} is not defined in '~/config/contracts'`);
    }

    const address = getContractAddress(contractName, networkId);

    return {
        contract: config,
        address,
        isProxyContract,
    };
}
