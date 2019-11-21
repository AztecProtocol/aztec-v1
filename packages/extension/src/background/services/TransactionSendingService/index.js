import Web3Service from '~/helpers/Web3Service';

const sendTransaction = async (query) => {
    const {
        data: {
            contract,
            method,
            params,
        },
        responseId,
    } = query;

    try {
        const receipt = await Web3Service
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
