import Web3Service from '~helpers/NetworkService';

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

    const web3Service = await Web3Service();

    const receipt = await web3Service
        .useContract(contract, contractAddress)
        .method(method)
        .send(...params);
    return {
        ...data,
        data: {
            response: {
                txReceipt: receipt,
            },
        },
        responseId,
    };
};
// TODO change this to use the gas station network

export default {
    sendTransaction,
};
