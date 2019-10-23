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

    /**
     * TODO: This should be fixed by gas station network
     */
    web3Service.account.privateKey = process.env.GANACHE_TESTING_ACCOUNT_0;

    const receipt = await web3Service
        .useContract(contract, contractAddress)
        .method(method)
        .sendSigned(...params);
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
