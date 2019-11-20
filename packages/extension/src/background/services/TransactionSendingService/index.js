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
        },
        responseId,
    } = query;

    const networkId = await get('networkId');
    const web3Service = await Web3Service({
        networkId,
    });

    try {
        const receipt = await web3Service
            .useContract(contract)
            .method(method, true)
            .send(...params);
        return {
            ...query,
            data: {
                txReceipt: receipt,
            },
            responseId,
        };
    } catch (error) {
        return {
            ...query,
            data: {
                error,
            },
        };
    }
};

// TODO change this to use the gas station network

export default {
    sendTransaction,
};
