import Web3Service from '~client/services/Web3Service';

const sendTransaction = async (data) => {
    const {
        data: {
            responseId,
            data: {
                contract,
                method,
                params,
                contractAddress,
            },
        },
    } = data;
    const receipt = await Web3Service.useContract(contract, contractAddress)
        .method(method)
        .send(...params);
    return {
        ...data,
        responseId,
        response: {
            txReceipt: receipt,
        },
    };
};
// TODO change this to use the gas station network

export default {
    sendTransaction,
};
