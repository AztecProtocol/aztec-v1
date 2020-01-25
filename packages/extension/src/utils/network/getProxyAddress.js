import * as contracts from '~/config/contracts';
import {
    warnLog,
} from '~/utils/log';
import Web3Service from '~/helpers/Web3Service';

export default async function getProxyContract(contractName, networkId) {
    console.log({ contractName });
    const {
        managerContractName,
    } = contracts[contractName] || {};
    if (!managerContractName) {
        warnLog(`Contract ${contractName} has no manager in '~/config/contracts'`);
    }
    const {
        config,
        networks,
    } = contracts[managerContractName] || {};

    if (!config) {
        warnLog(`Contract ${managerContractName} is not defined in '~/config/contracts'`);
    }

    let managerAddress = (networks && networks[networkId]);
    if (!managerAddress && config && config.networks[networkId]) {
        ({ address: managerAddress } = config.networks[networkId]);
    }
    console.log(config, networks);
    console.log({ managerAddress, managerContractName });

    Web3Service.registerInterface(config, { name: managerContractName });

    const proxyAddress = await Web3Service
        .useContract(managerContractName)
        .at(managerAddress)
        .method('proxyAddress')
        .call();


    return proxyAddress;
}
