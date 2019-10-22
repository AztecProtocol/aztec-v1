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
    web3Service.account.privateKey = '0xB8A23114E720D45005B608F8741639464A341C32C61920BF341B5CBDDAE7651D';

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
