import {
    getNetworkName,
} from '~/utils/network';
import Web3Service from '~/client/services/Web3Service';
import assetFactory from '~/client/apis/assetFactory';
import noteFactory from '~/client/apis/noteFactory';

const availableWeb3Apis = [
    'useContract',
    'getAddress',
    'deploy',
];

export default function generateApis(hasPermission = false) {
    const web3 = {
        getNetwork: () => ({
            id: Web3Service.networkId,
            name: getNetworkName(Web3Service.networkId),
        }),
        getAccount: () => ({ ...Web3Service.account }),
    };
    if (hasPermission) {
        availableWeb3Apis.forEach((name) => {
            web3[name] = (...args) => Web3Service[name](...args);
        });
    }

    // TODO - assign mock modules that show warnings when calling apis before enabled

    return {
        zkAsset: hasPermission ? assetFactory : null,
        zkNote: hasPermission ? noteFactory : null,
        web3,
    };
}
