import Web3Service from '~/client/services/Web3Service';
import assetFactory from '~/client/apis/assetFactory';
import noteFactory from '~/client/apis/noteFactory';

const availableWeb3Apis = [
    'useContract',
    'getAddress',
    'deploy',
];

export default function generateApis() {
    const web3 = {
        account: () => ({
            ...Web3Service.account,
        }),
    };
    availableWeb3Apis.forEach((name) => {
        web3[name] = (...args) => Web3Service[name](...args);
    });

    return {
        zkAsset: assetFactory,
        zkNote: noteFactory,
        web3,
    };
}
