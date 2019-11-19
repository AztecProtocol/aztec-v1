import {
    get,
} from '~/utils/storage';
import Web3Service from '~helpers/NetworkService';

const sendTransaction = async (query) => {
    const {
        data: {
            contract,
            method,
            params,
            contractAddress,
        },
    } = query;

    const networkId = await get('networkId');
    const web3Service = await Web3Service({
        networkId,
    });

    /**
     * TODO: This should be fixed by gas station network
     */
    web3Service.account.privateKey = process.env.GANACHE_TESTING_ACCOUNT_0;

    const receipt = await web3Service
        .useContract(contract, contractAddress)
        .method(method)
        .sendSigned(...params);

    return {
        ...query,
        data: {
            txReceipt: receipt,
        },
    };
};

// TODO change this to use the gas station network

export default {
    sendTransaction,
};
