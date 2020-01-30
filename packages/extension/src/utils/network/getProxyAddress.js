import * as contracts from '~/config/contracts';
import {
    warnLog,
} from '~/utils/log';
import Web3Service from '~/helpers/Web3Service';
import getContractAddress from './getContractAddress';

export default async function getProxyAddress(contractName, networkId, customConfig = {}) {
    const {
        managerContractName,
    } = contracts[contractName] || {};
    if (!managerContractName) {
        warnLog(`Contract '${contractName}' has no manager in '~/config/contracts'`);
        return '';
    }

    const managerAddress = customConfig[managerContractName]
        || getContractAddress(managerContractName, networkId);
    if (!managerAddress) {
        warnLog(`Address of contract '${managerContractName}' is not defined in its artifact.`);
        return '';
    }

    const {
        config,
    } = contracts[managerContractName];
    Web3Service.registerInterface(config, { name: managerContractName });

    const proxyAddress = await Web3Service
        .useContract(managerContractName)
        .at(managerAddress)
        .method('proxyAddress')
        .call();

    return proxyAddress;
}
