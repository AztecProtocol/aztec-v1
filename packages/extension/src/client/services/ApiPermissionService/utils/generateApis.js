import Web3 from 'web3';
import {
    getNetworkName,
} from '~/utils/network';
import Web3Service from '~/client/services/Web3Service';
import accountFactory from '~/client/apis/accountFactory';
import assetFactory from '~/client/apis/assetFactory';
import noteFactory from '~/client/apis/noteFactory';

const availableWeb3Apis = [
    'useContract',
    'getAddress',
    'deploy',
    'registerContract',
    'registerInterface',
    'sendAsync',
];

export default async function generateApis(hasPermission = false) {
    const web3 = {};

    let networkId;
    let account;
    if (hasPermission) {
        ({
            networkId,
            account,
        } = Web3Service);
        availableWeb3Apis.forEach((name) => {
            web3[name] = (...args) => Web3Service[name](...args);
        });
        web3.eth = Web3Service.eth;
    } else if (window.ethereum) {
        try {
            const web3Instance = new Web3(window.ethereum);
            web3.eth = web3Instance.eth;
            networkId = await web3Instance.eth.net.getId();
            const [address] = await web3Instance.eth.getAccounts();
            if (address) {
                account = {
                    address,
                };
            }
        } catch (e) {
            web3.error = e;
        }
    }

    web3.network = !networkId
        ? null
        : {
            id: networkId,
            name: getNetworkName(networkId),
        };
    web3.account = !account
        ? null
        : { ...account };
    web3.getNetwork = () => web3.network;
    web3.getAccount = () => web3.account;

    // TODO - assign mock modules that show warnings when calling apis before enabled

    return {
        user: hasPermission ? accountFactory : null,
        zkAsset: hasPermission ? assetFactory : null,
        zkNote: hasPermission ? noteFactory : null,
        web3,
    };
}
